/**
 * GET /api/social — mock social posts with hashtag filter, search, and
 * pagination (assignment permits a mock social source). Same
 * ContentPage<SocialItem> contract as the live endpoints.
 */
import type { NextRequest, NextResponse } from 'next/server'
import { fetchSocial } from '@/lib/apis/social'
import { jsonPage, withErrors } from '@/lib/response'
import { parseHashtags, parsePage, parseQuery, PAGE_SIZE } from '@/lib/validate'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrors(async () => {
    const params = request.nextUrl.searchParams
    const hashtags = parseHashtags(params.get('hashtag'))
    const page = parsePage(params.get('page'))
    const q = parseQuery(params.get('q'))

    const result = fetchSocial({ hashtags, page, pageSize: PAGE_SIZE, query: q })
    return jsonPage(result)
  })
}
