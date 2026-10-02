/**
 * Shared domain types. ContentItem union + API contracts (see PLAN.md §2).
 */
export {
  CATEGORIES,
  isCategory,
  isContentItem,
  isMovieItem,
  isNewsItem,
  isSocialItem,
} from './content'
export type {
  Category,
  ContentItem,
  MovieItem,
  NewsItem,
  SocialItem,
} from './content'
export type { ApiErrorCode, ApiErrorBody, ContentPage, ContentSource } from './api'
