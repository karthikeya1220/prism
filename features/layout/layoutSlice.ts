/**
 * Layout: manual card order per dashboard section (drag-and-drop output).
 * Manual order wins over the feed algorithm for ids it contains (PLAN.md §5).
 * Persisted.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export type SectionKey = 'feed' | 'favorites' | 'trending'

export interface LayoutState {
  /** section → ordered content ids the user has explicitly dragged. */
  manualOrder: Record<SectionKey, string[]>
}

const initialState: LayoutState = {
  manualOrder: { feed: [], favorites: [], trending: [] },
}

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    /**
     * Record a drag result: replaces the manual order for a section with the
     * new id sequence (capped at 200 ids to bound persistence size).
     */
    setSectionOrder(
      state,
      action: PayloadAction<{ section: SectionKey; ids: string[] }>,
    ) {
      state.manualOrder[action.payload.section] = action.payload.ids.slice(0, 200)
    },
    /** Forget manual order for a section (Reset order button). */
    resetSectionOrder(state, action: PayloadAction<SectionKey>) {
      state.manualOrder[action.payload] = []
    },
    /** Replace all state (used by persistence rehydration). */
    hydrateLayout(state, action: PayloadAction<LayoutState>) {
      return action.payload
    },
  },
})

export const { setSectionOrder, resetSectionOrder, hydrateLayout } = layoutSlice.actions

/** Select the manual order ids for a section. */
export function selectSectionOrder(
  section: SectionKey,
): (state: RootState) => string[] {
  return (state) => state.layout.manualOrder[section] ?? []
}

export default layoutSlice.reducer
