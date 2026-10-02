/**
 * Typed Redux hooks — always use these instead of the plain react-redux
 * exports so selectors/dispatches stay type-safe (PLAN.md §3).
 */
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './index'

/** Dispatch thunks/RTK Query actions with full inference. */
export function useAppDispatch(): AppDispatch {
  return useDispatch<AppDispatch>()
}

/** Select from RootState with the slice types inferred. */
export function useAppSelector<T>(selector: (state: RootState) => T): T {
  return useSelector(selector)
}
