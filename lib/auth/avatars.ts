/** Avatar choices offered on the profile page (client-safe, no Node APIs). */

export const AVATAR_PRESETS = ['🦊', '🐼', '🚀', '🎧', '🌈', '⚡', '🌙', '🎸'] as const

/** Validate a preset avatar (or null to clear); rejects arbitrary strings. */
export function isAvatarPreset(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === 'string' && (AVATAR_PRESETS as readonly string[]).includes(value))
  )
}
