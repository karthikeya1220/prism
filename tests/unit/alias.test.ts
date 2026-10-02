import { describe, expect, it } from 'vitest'
import { handlers } from '@/mocks/handlers'
import { server } from '@/mocks/server'

describe('tooling smoke', () => {
  it('runs Vitest with the @ alias and MSW server wired up', () => {
    expect(server).toBeDefined()
    expect(Array.isArray(handlers)).toBe(true)
  })
})
