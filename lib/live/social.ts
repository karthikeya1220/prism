/**
 * Live-post generator for the SSE feed (M12): rotating author/topic/template
 * pools produce one fresh `SocialItem` per (sequence, timestamp) pair — no
 * `Math.random`, so tests can assert exact output. Ids embed the timestamp so
 * two connections (or a reconnect) never collide in the dedupe-by-id merge.
 */
import type { Category, SocialItem } from '@/types'

interface LiveAuthor {
  handle: string
  displayName: string
}

const AUTHORS: LiveAuthor[] = [
  { handle: 'devgrind', displayName: 'Dev Grind' },
  { handle: 'thefinancier', displayName: 'The Financier' },
  { handle: 'courtside', displayName: 'Courtside' },
  { handle: 'starwatch', displayName: 'Starwatch' },
  { handle: 'wellnessdaily', displayName: 'Wellness Daily' },
  { handle: 'marketspulse', displayName: 'Markets Pulse' },
]

interface LiveTopic {
  hashtag: string
  category: Category
  topic: string
}

const TOPICS: LiveTopic[] = [
  { hashtag: 'technology', category: 'technology', topic: 'AI agents' },
  { hashtag: 'finance', category: 'finance', topic: 'rate cuts' },
  { hashtag: 'sports', category: 'sports', topic: 'the trade deadline' },
  { hashtag: 'entertainment', category: 'entertainment', topic: 'awards season' },
  { hashtag: 'science', category: 'science', topic: 'the lunar mission' },
  { hashtag: 'health', category: 'health', topic: 'sleep research' },
]

const TEMPLATES = [
  (topic: string) => `Breaking: the ${topic} story just took a turn nobody expected 🧵`,
  (topic: string) => `Live thread — everything happening with ${topic} right now.`,
  (topic: string) => `Three things about ${topic} that changed my mind this week.`,
  (topic: string) => `Hot take: ${topic} is the most underrated story of the month.`,
  (topic: string) => `Quick update on ${topic} — the numbers are wild 📈`,
]

/**
 * The `sequence`-th live post stamped at `now` (ms). Deterministic for a
 * given pair — the route passes `Date.now()`, tests pass a fixed instant.
 */
export function nextLiveSocialItem(sequence: number, now: number = Date.now()): SocialItem {
  const author = AUTHORS[sequence % AUTHORS.length]
  const topic = TOPICS[sequence % TOPICS.length]
  const description = TEMPLATES[sequence % TEMPLATES.length](topic.topic)
  return {
    id: `social:live:${now}-${sequence}`,
    type: 'social',
    title: description,
    description,
    imageUrl: null,
    url: `https://social.example.com/${author.handle}/${sequence}`,
    source: `@${author.handle}`,
    category: topic.category,
    publishedAt: new Date(now).toISOString(),
    author: { handle: author.handle, displayName: author.displayName, avatarUrl: null },
    hashtag: topic.hashtag,
    likes: 3 + ((sequence * 37) % 420),
    reposts: (sequence * 13) % 64,
  }
}
