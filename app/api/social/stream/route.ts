/**
 * GET /api/social/stream — server-sent "live" social posts (PLAN.md M12).
 * Emits one generated SocialItem immediately, then every `interval` ms
 * (default 15 s), with `: ping` heartbeats so proxies keep the connection
 * open. The `?interval=` query (clamped 50–60 000 ms) exists so tests can
 * exercise the stream without waiting 15 s.
 */
import { nextLiveSocialItem } from '@/lib/live/social'

export const dynamic = 'force-dynamic'

const DEFAULT_INTERVAL_MS = 15_000
const HEARTBEAT_MS = 15_000

/** Effective tick interval for a stream URL (defaults when invalid). */
export function intervalMsFrom(url: URL): number {
  const raw = Number(url.searchParams.get('interval'))
  if (url.searchParams.get('interval') === null || !Number.isFinite(raw)) {
    return DEFAULT_INTERVAL_MS
  }
  return Math.min(60_000, Math.max(50, Math.trunc(raw)))
}

export async function GET(request: Request): Promise<Response> {
  const intervalMs = intervalMsFrom(new URL(request.url))
  const encoder = new TextEncoder()
  let sequence = 0
  let tick: ReturnType<typeof setInterval> | undefined
  let beat: ReturnType<typeof setInterval> | undefined

  const cleanup = (): void => {
    if (tick) clearInterval(tick)
    if (beat) clearInterval(beat)
    tick = undefined
    beat = undefined
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Enqueues throw once the consumer cancels — swallow and let the
      // cleanup below tear the timers down.
      const safe = (fn: () => void): void => {
        try {
          fn()
        } catch {
          cleanup()
        }
      }
      const send = (): void => {
        sequence += 1
        const item = nextLiveSocialItem(sequence, Date.now())
        safe(() =>
          controller.enqueue(
            encoder.encode(`event: post\ndata: ${JSON.stringify(item)}\n\n`),
          ),
        )
      }
      send()
      tick = setInterval(send, intervalMs)
      beat = setInterval(
        () => safe(() => controller.enqueue(encoder.encode(': ping\n\n'))),
        HEARTBEAT_MS,
      )
      request.signal.addEventListener('abort', () => {
        cleanup()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      })
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
