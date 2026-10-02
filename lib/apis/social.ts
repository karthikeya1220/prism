/**
 * Social "API" over the deterministic mock dataset (the assignment permits a
 * mock social source). Supports hashtag filter, free-text search, and
 * pagination; returns ContentPage<SocialItem> with source: 'live'.
 */
import type { ContentPage, SocialItem } from '@/types'
import { MOCK_SOCIAL } from '@/mocks/social'

/**
 * Query the social dataset.
 * - hashtags: filter by post hashtag (empty = all)
 * - query: case-insensitive substring match on description/handle
 * - page/pageSize: slice pagination
 */
export function fetchSocial(options: {
  hashtags: string[]
  page: number
  pageSize: number
  query?: string
}): ContentPage<SocialItem> {
  const { hashtags, page, pageSize, query } = options
  const q = query?.trim().toLowerCase() ?? ''

  const filtered = MOCK_SOCIAL.filter((post) => {
    if (hashtags.length > 0 && !hashtags.includes(post.hashtag)) return false
    if (
      q &&
      !post.description.toLowerCase().includes(q) &&
      !post.author.handle.toLowerCase().includes(q)
    ) {
      return false
    }
    return true
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return {
    items,
    page,
    pageSize,
    totalResults: filtered.length,
    hasMore: start + items.length < filtered.length,
    source: 'live',
  }
}
