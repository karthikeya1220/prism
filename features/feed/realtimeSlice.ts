/**
 * Realtime feed state (PLAN.md M12): posts arriving over SSE queue up in
 * `pending` (surfaced by the "N new posts" pill) and move into `live` when
 * the reader consumes them — `FeedSection` prepends `live` into the social
 * stream before `buildFeed`. Ephemeral by design: never persisted, so a
 * reload starts from the API pages alone.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SocialItem } from '@/types'

export interface RealtimeState {
  /** Arrived over SSE, not yet revealed in the feed (oldest first). */
  pending: SocialItem[]
  /** Revealed to the reader — newest first; merged into the feed. */
  live: SocialItem[]
}

export const initialRealtimeState: RealtimeState = { pending: [], live: [] }

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState: initialRealtimeState,
  reducers: {
    /** Queue a streamed post; duplicate ids (reconnects) are dropped. */
    receiveLive(state, action: PayloadAction<SocialItem>) {
      const item = action.payload
      const known = (candidate: SocialItem): boolean => candidate.id === item.id
      if (state.pending.some(known) || state.live.some(known)) return
      state.pending.push(item)
    },
    /** Reveal the whole queue: pending moves to the head of `live`. */
    consumeLive(state) {
      if (state.pending.length === 0) return
      state.live = [...state.pending.reverse(), ...state.live]
      state.pending = []
    },
    /** Test/logout helper — drops everything back to the empty state. */
    resetRealtime() {
      return initialRealtimeState
    },
  },
})

export const { receiveLive, consumeLive, resetRealtime } = realtimeSlice.actions

export const selectPending = (state: { realtime: RealtimeState }): SocialItem[] =>
  state.realtime.pending
export const selectLive = (state: { realtime: RealtimeState }): SocialItem[] =>
  state.realtime.live

export default realtimeSlice.reducer
