/**
 * i18n resource integrity (M13): English and Hindi carry identical key
 * trees, matching `{{placeholders}}`, and no empty strings — plus the shared
 * instance switches languages and falls back to English keys.
 */
import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/lib/i18n'
import { en, hi } from '@/lib/i18n/resources'

interface Tree {
  [key: string]: string | Tree
}

/** Flatten a namespace bundle to dotted leaf paths. */
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out[path] = value
    else Object.assign(out, flatten(value, path))
  }
  return out
}

/** Sorted `{{var}}` names used by a message. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
}

const enFlat = flatten(en as unknown as Tree)
const hiFlat = flatten(hi as unknown as Tree)

describe('locale resources', () => {
  it('ships the same key tree in English and Hindi', () => {
    expect(Object.keys(hiFlat).sort()).toEqual(Object.keys(enFlat).sort())
  })

  it('has no empty translations', () => {
    const empty = [
      ...Object.entries(enFlat).filter(([, value]) => !value.trim()),
      ...Object.entries(hiFlat).filter(([, value]) => !value.trim()),
    ]
    expect(empty).toEqual([])
  })

  it('keeps {{placeholders}} in sync across languages', () => {
    const mismatched = Object.keys(enFlat).filter(
      (key) =>
        JSON.stringify(placeholders(enFlat[key])) !==
        JSON.stringify(placeholders(hiFlat[key])),
    )
    expect(mismatched).toEqual([])
  })

  it('covers every namespace in both languages', () => {
    const namespaces = Object.keys(en)
    expect(Object.keys(hi)).toEqual(namespaces)
    expect(namespaces).toContain('common')
    expect(namespaces).toContain('settings')
    expect(namespaces).toContain('auth')
    expect(namespaces).toContain('pages')
  })
})

describe('i18n instance', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('defaults to English and switches to Hindi on demand', async () => {
    expect(i18n.language).toBe('en')
    expect(i18n.t('settings:language')).toBe('Language')

    await i18n.changeLanguage('hi')
    expect(i18n.t('settings:language')).toBe('भाषा')
    expect(i18n.t('common:time.minutesAgo', { n: 5 })).toBe('5 मिनट पहले')

    await i18n.changeLanguage('en')
    expect(i18n.t('settings:language')).toBe('Language')
  })

  it('falls back to the raw key for unknown strings', () => {
    // Unknown keys pass the literal-type check only via a deliberate cast.
    expect(i18n.t('definitely.not.a.key' as never)).toBe('definitely.not.a.key')
  })
})
