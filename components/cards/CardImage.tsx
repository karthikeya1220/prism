/* eslint-disable @next/next/no-img-element -- card imagery comes from live
   upstream URLs (NewsAPI/TMDB) that cannot be known at build time, so
   next/image optimization is impossible; onError hides broken images. */
import type { ReactNode } from 'react'

export interface CardImageProps {
  /** Upstream image URL, or null to keep the branded placeholder. */
  src: string | null
  /** Decorative by default — the card headline is the accessible name. */
  alt?: string
  /** Glyph shown when there is no image. */
  fallback: ReactNode
}

/**
 * Card thumbnail: a branded gradient + icon placeholder with the real image
 * layered on top. A failed load hides the <img>, revealing the placeholder —
 * broken images never show browser chrome.
 */
export function CardImage({ src, alt = '', fallback }: CardImageProps) {
  return (
    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
      <span className="grid h-full place-items-center text-accent/50" aria-hidden="true">
        {fallback}
      </span>
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}

export default CardImage
