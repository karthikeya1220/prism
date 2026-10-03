/**
 * Realtime slice unit tests (PLAN.md M12): queue → consume flow, dedupe by
 * id across both lists, and the reset helper.
 */
import { describe, expect, it } from 'vitest'
import realtimeReducer, {
  consumeLive,
  initialRealtimeState,
  receiveLive,
  resetRealtime,
} from '@/features/feed/realtimeSlice'
import { nextLiveSocialItem } from '@/lib/live/social'
import type { SocialItem } from '@/types'

const post = (sequence: number, now = 1_727_870_000_000): SocialItem =>
  nextLiveSocialItem(sequence, now)

describe('realtimeSlice', () => {
  it('starts empty and queues received posts (oldest first)', () => {
    const state = realtimeReducer(initialRealtimeState, receiveLive(post(1)))
    expect(state.pending).toHaveLength(1)
    expect(state.pending[0].id).toMatch(/^social:live:/)
    expect(state.live).toHaveLength(0)
  })

  it('drops duplicate ids whether still pending or already live', () => {
    const item = post(1)
    let state = realtimeReducer(initialRealtimeState, receiveLive(item))
    state = realtimeReducer(state, receiveLive(item))
    expect(state.pending).toHaveLength(1)

    state = realtimeReducer(state, consumeLive())
    state = realtimeReducer(state, receiveLive(item))
    expect(state.pending).toHaveLength(0)
    expect(state.live).toHaveLength(1)
  })

  it('consumeLive moves the whole queue to the head of live, newest first', () => {
    let state = realtimeReducer(initialRealtimeState, receiveLive(post(1)))
    state = realtimeReducer(state, receiveLive(post(2)))
    state = realtimeReducer(state, receiveLive(post(3)))
    state = realtimeReducer(state, consumeLive())

    expect(state.pending).toHaveLength(0)
    expect(state.live.map((item) => item.id)).toEqual([
      post(3).id,
      post(2).id,
      post(1).id,
    ])
  })

  it('consumeLive on an empty queue is a no-op; reset clears everything', () => {
    const idle = realtimeReducer(initialRealtimeState, consumeLive())
    expect(idle).toEqual(initialRealtimeState)

    const dirty = realtimeReducer(
      realtimeReducer(initialRealtimeState, receiveLive(post(1))),
      consumeLive(),
    )
    expect(realtimeReducer(dirty, resetRealtime())).toEqual(initialRealtimeState)
  })
})
