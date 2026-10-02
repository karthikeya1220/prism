/**
 * Deterministic mock social dataset (fallback + the social "API" itself, as the
 * assignment explicitly permits a mock social source). 72 realistic posts with
 * authors, avatars, hashtags and engagement — generated from curated pools so
 * content is varied yet stable across reloads (ids are deterministic).
 */
import type { SocialItem } from '@/types'

interface MockAuthor {
  handle: string
  displayName: string
  avatarIndex: number
}

const AUTHORS: MockAuthor[] = [
  { handle: 'devgrind', displayName: 'Dev Grind', avatarIndex: 0 },
  { handle: 'thefinancier', displayName: 'The Financier', avatarIndex: 1 },
  { handle: 'courtside', displayName: 'Courtside', avatarIndex: 2 },
  { handle: 'starwatch', displayName: 'Starwatch', avatarIndex: 3 },
  { handle: 'wellnessdaily', displayName: 'Wellness Daily', avatarIndex: 4 },
  { handle: 'screenhub', displayName: 'Screen Hub', avatarIndex: 5 },
  { handle: 'marketspulse', displayName: 'Markets Pulse', avatarIndex: 6 },
  { handle: 'thefeedlab', displayName: 'The Feed Lab', avatarIndex: 7 },
  { handle: 'nasa', displayName: 'NASA', avatarIndex: 3 },
  { handle: 'historyfacts', displayName: 'History Facts', avatarIndex: 2 },
  { handle: 'startupdaily', displayName: 'Startup Daily', avatarIndex: 0 },
  { handle: 'gearpatrol', displayName: 'Gear Patrol', avatarIndex: 5 },
]

const HASHTAGS = [
  'technology', 'ai', 'startups', 'finance', 'markets', 'sports',
  'entertainment', 'science', 'space', 'health', 'movies', 'design',
] as const

const TEMPLATES = [
  (t: string) => `Thread: what nobody tells you about ${t} — lessons from 5 years in the field 🧵`,
  (t: string) => `Hot take: ${t} is having its most interesting year in a decade.`,
  (t: string) => `We ranked the top 10 ${t} stories this week. The #1 pick surprised us.`,
  (t: string) => `New post: A beginner's guide to ${t} (no jargon, promise).`,
  (t: string) => `Poll: is ${t} overhyped or underhyped right now? Wrong answers only 👇`,
  (t: string) => `Behind the scenes: how our team shipped a ${t} project in 6 weeks.`,
  (t: string) => `This ${t} chart changed how I think about the whole industry.`,
  (t: string) => `Weekly recap: 8 ${t} headlines you can actually use.`,
]

/** Stable per-post pseudo-random from (i, salt) — no Math.random, no flaky ids. */
function seeded(n: number, salt: number): number {
  const x = Math.sin(n * 12_9898 + salt * 78_233) * 4_371_545_123
  return x - Math.floor(x)
}

export const MOCK_SOCIAL: SocialItem[] = Array.from({ length: 72 }, (_, i) => {
  const author = AUTHORS[i % AUTHORS.length]
  const hashtag = HASHTAGS[i % HASHTAGS.length]
  const template = TEMPLATES[Math.floor(seeded(i, 1) * TEMPLATES.length)]
  const topic = hashtag === 'ai' ? 'AI' : hashtag
  const minutesAgo = 10 + i * 47 + Math.floor(seeded(i, 2) * 30)
  const publishedAt = new Date(
    new Date('2026-10-02T12:00:00Z').getTime() - minutesAgo * 60_000,
  ).toISOString()

  return {
    id: `social:${i + 1}`,
    type: 'social',
    title: `${author.displayName} on #${hashtag}`,
    description: template(topic),
    imageUrl: null,
    url: `https://social.example.com/${author.handle.trim()}/status/${1000 + i}`,
    source: `@${author.handle.trim()}`,
    category: hashtagToCategory(hashtag),
    publishedAt,
    author: {
      handle: author.handle.trim(),
      displayName: author.displayName,
      avatarUrl: avatarUrl(author.avatarIndex),
    },
    hashtag,
    likes: Math.floor(seeded(i, 3) * 4_800) + 12,
    reposts: Math.floor(seeded(i, 4) * 900) + 2,
  }
})

/** Route a mock hashtag to a feed Category. */
function hashtagToCategory(hashtag: string): SocialItem['category'] {
  switch (hashtag) {
    case 'technology':
    case 'ai':
    case 'design':
      return 'technology'
    case 'finance':
    case 'markets':
    case 'startups':
      return 'finance'
    case 'sports':
      return 'sports'
    case 'entertainment':
    case 'movies':
      return 'entertainment'
    case 'science':
    case 'space':
      return 'science'
    case 'health':
      return 'health'
    default:
      return 'general'
  }
}

/** Deterministic avatar URLs (DiceBear, seeded by author index). */
function avatarUrl(index: number): string {
  const seeds = ['felix', 'aisha', 'maria', 'kenji', 'lucia', 'omar']
  const seed = seeds[index % seeds.length]
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`
}
