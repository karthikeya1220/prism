/**
 * Tiny className joiner — skips falsey parts. Stand-in for `clsx` so the
 * project keeps its zero-extra-dependency rule (AGENTS.md rule 9).
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
