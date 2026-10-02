/**
 * Curated mock movies (fallback for /api/movies when TMDB credentials are
 * missing or upstream fails). Deterministic, genre-tagged, rating/popularity
 * included so Trending works offline.
 */
import type { MovieItem } from '@/types'

const DAY = 86_400_000
const BASE_TIME = new Date('2026-10-01T12:00:00Z').getTime()

function movie(
  tmdbId: number,
  category: MovieItem['category'],
  title: string,
  description: string,
  genres: string[],
  rating: number,
  popularity: number,
  releaseDaysAgo: number,
): MovieItem {
  return {
    id: `movie:mock-${tmdbId}`,
    type: 'movie',
    title,
    description,
    imageUrl: null,
    url: `https://www.themoviedb.org/movie/${tmdbId}`,
    source: 'TMDB',
    category,
    publishedAt: new Date(BASE_TIME - releaseDaysAgo * DAY).toISOString(),
    rating,
    releaseDate: new Date(BASE_TIME - releaseDaysAgo * DAY).toISOString().slice(0, 10),
    genres,
    popularity,
  }
}

export const MOCK_MOVIES: MovieItem[] = [
  movie(101, 'technology', 'The Silent Algorithm',
    'A rogue recommendation engine starts editing reality for its users.',
    ['Science Fiction', 'Thriller'], 8.1, 912, 12),
  movie(102, 'technology', 'Reboot City',
    'Two junior devs uncover a conspiracy buried in legacy code.',
    ['Science Fiction', 'Mystery'], 7.4, 640, 30),
  movie(103, 'finance', 'The Short Game',
    'Based on the true story of the bet that shook Wall Street.',
    ['Drama'], 7.9, 720, 45),
  movie(104, 'finance', 'Golden Handcuffs',
    'A trader must choose between loyalty and the biggest deal of her life.',
    ['Drama', 'Crime'], 7.2, 410, 60),
  movie(105, 'sports', 'Final Lap',
    'An aging sprinter chases one last record with a rookie rival at her heels.',
    ['Drama', 'Sport'], 7.8, 588, 21),
  movie(106, 'sports', 'Home Turf',
    'A relegated football club fights back from the bottom of the table.',
    ['Drama'], 6.9, 350, 90),
  movie(107, 'entertainment', 'Neon Nights',
    'A karaoke bar becomes the heart of a struggling neighborhood.',
    ['Comedy', 'Music'], 7.6, 801, 15),
  movie(108, 'entertainment', 'The Double Feature',
    'Two rival drive-in owners are forced to share one screen.',
    ['Comedy', 'Romance'], 6.8, 402, 75),
  movie(109, 'science', 'Orbital Drift',
    'A repair crew aboard a decaying station races against reentry.',
    ['Science Fiction', 'Drama'], 8.4, 1_050, 8),
  movie(110, 'science', 'The Fungal Age',
    'Documentary: how mycology is rewriting medicine and materials.',
    ['Documentary'], 8.0, 380, 50),
  movie(111, 'health', 'Second Heartbeat',
    'A transplant surgeon confronts the ethics of her own breakthrough.',
    ['Drama'], 7.5, 455, 40),
  movie(112, 'health', 'Running on Empty',
    'Documentary: ultra-marathoners and the science of endurance.',
    ['Documentary', 'Sport'], 7.3, 290, 65),
  movie(113, 'general', 'The Long Way Home',
    'A road movie across three time zones and one lost dog.',
    ['Adventure', 'Family'], 7.1, 512, 25),
  movie(114, 'general', 'Paper Lanterns',
    'A festival, a promise, and the summer that changed a town.',
    ['Drama', 'Romance'], 6.7, 301, 100),
  movie(115, 'technology', 'Signal to Noise',
    'A translator discovers the first extraterrestrial broadcast — in code.',
    ['Science Fiction', 'Mystery'], 8.2, 970, 5),
  movie(116, 'entertainment', 'Encore!',
    'A washed-up conductor takes over a youth orchestra.',
    ['Comedy', 'Music', 'Family'], 7.0, 460, 55),
]
