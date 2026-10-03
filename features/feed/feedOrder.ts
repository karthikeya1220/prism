/**
 * Manual feed-order reconciliation (PLAN.md §5, M8): the saved drag order
 * wins for ids that are still loaded; everything else — cards the user never
 * reordered, and new arrivals from infinite scroll — appends in natural
 * feed order. Pure so both the hook and unit tests share one source of truth.
 */

/** Place saved ids first (saved order), then every remaining item in its
 * natural feed order. Duplicate-safe; never drops or duplicates items. */
export function applyFeedOrder<T extends { id: string }>(
  items: T[],
  savedOrder: string[],
): T[] {
  if (savedOrder.length === 0 || items.length === 0) return items
  const byId = new Map(items.map((item) => [item.id, item]))
  const placed = new Set<string>()
  const ordered: T[] = []
  for (const id of savedOrder) {
    const item = byId.get(id)
    if (item && !placed.has(id)) {
      ordered.push(item)
      placed.add(id)
    }
  }
  for (const item of items) {
    if (!placed.has(item.id)) ordered.push(item)
  }
  return ordered
}

/** Structural equality for string lists — lets callers skip no-op dispatches. */
export function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}
