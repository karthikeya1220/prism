/**
 * Query-param validation tests (PLAN.md §4): clamping, defaults, and the
 * BAD_REQUEST contract every /api/* handler relies on.
 */
import { describe, expect, it } from 'vitest'
import {
  PAGE_SIZE,
  ValidationError,
  parseCategories,
  parseHashtags,
  parsePage,
  parseQuery,
} from '@/lib/validate'

/** Run fn and return whatever it threw (null when it did not throw). */
function catchError(fn: () => unknown): unknown {
  try {
    fn()
    return null
  } catch (error) {
    return error
  }
}

describe('parsePage', () => {
  it('defaults to 1 and clamps into [1, 10]', () => {
    expect(parsePage(null)).toBe(1)
    expect(parsePage('')).toBe(1)
    expect(parsePage('3')).toBe(3)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-4')).toBe(1)
    expect(parsePage('999')).toBe(10)
  })

  it('rejects non-numeric pages with BAD_REQUEST', () => {
    const error = catchError(() => parsePage('abc'))
    expect(error).toBeInstanceOf(ValidationError)
    expect((error as ValidationError).body.error.code).toBe('BAD_REQUEST')
    expect((error as ValidationError).message).toContain('abc')
  })
})

describe('parseCategories', () => {
  it('defaults to general and parses comma lists case-insensitively', () => {
    expect(parseCategories(null)).toEqual(['general'])
    expect(parseCategories('  ')).toEqual(['general'])
    expect(parseCategories('Technology, finance')).toEqual(['technology', 'finance'])
  })

  it('rejects unknown categories', () => {
    expect(() => parseCategories('technology,cryptocurrency')).toThrow(ValidationError)
    expect(() => parseCategories('TECHNO')).toThrow(/Unknown category/)
  })

  it('ignores empty segments', () => {
    expect(parseCategories('technology,,sports,')).toEqual(['technology', 'sports'])
  })
})

describe('parseHashtags', () => {
  it('normalizes case and strips leading hashes; empty when absent', () => {
    expect(parseHashtags(null)).toEqual([])
    expect(parseHashtags(' , ')).toEqual([])
    expect(parseHashtags('#AI, Finance')).toEqual(['ai', 'finance'])
  })

  it('rejects oversized hashtag input with BAD_REQUEST', () => {
    const many = Array.from({ length: 11 }, (_, i) => `t${i}`).join(',')
    const tooMany = catchError(() => parseHashtags(many))
    expect(tooMany).toBeInstanceOf(ValidationError)

    const runaway = catchError(() => parseHashtags('a'.repeat(41)))
    expect(runaway).toBeInstanceOf(ValidationError)
  })
})

describe('parseQuery', () => {
  it('trims and returns empty when absent', () => {
    expect(parseQuery(null)).toBe('')
    expect(parseQuery('   ')).toBe('')
    expect(parseQuery('  dune  ')).toBe('dune')
  })

  it('rejects queries longer than 80 characters', () => {
    expect(() => parseQuery('a'.repeat(81))).toThrow(ValidationError)
    expect(() => parseQuery('a'.repeat(80))).not.toThrow()
  })
})

describe('PAGE_SIZE', () => {
  it('is the shared page size across endpoints', () => {
    expect(PAGE_SIZE).toBe(12)
  })
})
