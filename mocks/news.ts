/**
 * Curated mock news articles (fallback for /api/news when NEWS_API_KEY is
 * missing or rate limited). Realistic, deterministic, category-tagged.
 */
import type { NewsItem } from '@/types'

const HOUR = 3_600_000
const BASE_TIME = new Date('2026-10-01T16:00:00Z').getTime()

function article(
  index: number,
  category: NewsItem['category'],
  title: string,
  description: string,
  source: string,
  author: string | null,
  hoursAgo: number,
): NewsItem {
  return {
    id: `news:mock-${index}`,
    type: 'news',
    title,
    description,
    imageUrl: null,
    url: `https://news.example.com/articles/${index}`,
    source,
    category,
    publishedAt: new Date(BASE_TIME - hoursAgo * HOUR).toISOString(),
    author,
  }
}

export const MOCK_NEWS: NewsItem[] = [
  article(1, 'technology', 'Chipmakers race to ship on-device AI accelerators',
    'New silicon designs promise faster local inference with lower power draw.',
    'The Verge', 'Mia Sato', 2),
  article(2, 'technology', 'Open-source robotics stack hits v2 with real-time control',
    'The release adds deterministic scheduling and a Rust control layer.',
    'Ars Technica', 'Tim De Chant', 5),
  article(3, 'finance', 'Markets steady as central banks signal slower cuts',
    'Bond yields ticked up after minutes revealed a divided committee.',
    'Bloomberg', 'Liz Capo McCormick', 1),
  article(4, 'finance', 'Fintech funding rebounds to two-year high',
    'Payment infrastructure startups drove most of the quarter\u2019s deal flow.',
    'Reuters', 'Yueqi Yang', 7),
  article(5, 'sports', 'Underdogs stun league leaders in extra time',
    'A 94th-minute header sends the cup tie to a replay.',
    'The Athletic', 'Ahmed Walid', 3),
  article(6, 'sports', 'Marathon record falls on a rain-soaked course',
    'Negative splits and a bold final 10k rewrote the record book.',
    'BBC Sport', 'Laura Scott', 9),
  article(7, 'entertainment', 'Indie film scoops festival jury prize',
    'A debut feature shot on 16mm wins over critics and distributors alike.',
    'Variety', 'Rebecca Rubin', 4),
  article(8, 'entertainment', 'Streaming platforms embrace weekly drops again',
    'Binge fatigue and churn push platforms back to appointment viewing.',
    'The Hollywood Reporter', 'Alex Weprin', 11),
  article(9, 'science', 'Webb telescope spots possible water vapor on exoplanet',
    'Spectra from three transits hint at a humid sub-Neptune atmosphere.',
    'Nature', 'Alexandra Witze', 6),
  article(10, 'science', 'Fusion startup reports net-electric milestone',
    'Independent reviewers verified the 90-second plasma sustain.',
    'Scientific American', 'Sophie Bushwick', 14),
  article(11, 'business', 'Retailers bet big on same-day fulfillment hubs',
    'Suburban micro-warehouses cut delivery times below four hours.',
    'Wall Street Journal', 'Paul Ziobro', 8),
  article(12, 'business', 'Remote-first companies double down on async tooling',
    'New surveys show documentation-first cultures retaining longer.',
    'Business Insider', 'Aki Ito', 16),
  article(13, 'technology', 'The quiet rise of local-first software',
    'Sync engines and CRDTs move state back to the edge.',
    'Wired', 'Steven Levy', 20),
  article(14, 'health', 'Wearables get better at detecting sleep apnea',
    'New validation studies put sensitivity above 90 percent.',
    'STAT News', 'Casey Ross', 10),
  article(15, 'health', 'Cities pilot traffic calming for cleaner air',
    'Early data links lower speeds with measurable PM2.5 drops.',
    'The Guardian', 'Gwyn Topham', 22),
  article(16, 'general', 'Weekend read: the archive that saved a city\u2019s memory',
    'How librarians digitized 2 million pages before the flood hit.',
    'Atlas Obscura', 'Sarah Laskow', 26),
]
