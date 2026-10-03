'use client'
import { useEffect } from 'react'
import { receiveLive } from '@/features/feed/realtimeSlice'
import { useAppDispatch } from '@/store/hooks'
import type { SocialItem } from '@/types'

/**
 * Parse one `post` SSE payload; returns null for malformed or non-social
 * data so a bad frame can never poison the realtime queue.
 */
export function parseLivePost(data: string): SocialItem | null {
  try {
    const parsed: unknown = JSON.parse(data)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'type' in parsed &&
      (parsed as { type: unknown }).type === 'social'
    ) {
      return parsed as SocialItem
    }
    return null
  } catch {
    return null
  }
}

/**
 * Open the `/api/social/stream` SSE connection while mounted and dispatch
 * each valid post into the realtime slice. No-ops where `EventSource` is
 * unavailable (SSR, jsdom) and closes the connection on unmount.
 */
export function useSocialStream(enabled = true): void {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return
    const source = new EventSource('/api/social/stream')
    const onPost = (event: MessageEvent<string>): void => {
      const item = parseLivePost(event.data)
      if (item) dispatch(receiveLive(item))
    }
    source.addEventListener('post', onPost)
    return () => {
      source.removeEventListener('post', onPost)
      source.close()
    }
  }, [enabled, dispatch])
}
