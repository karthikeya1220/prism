/**
 * Deterministic id hashing so upstream urls/titles become stable, namespaced
 * ContentItem ids (required by favorites + manual ordering).
 */

/** djb2 hash → base36, namespaced: hashId('news', url) → 'news:k3x9…'. */
export function hashId(prefix: string, value: string): string {
  let h = 5381
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0
  }
  return `${prefix}:${(h >>> 0).toString(36)}`
}
