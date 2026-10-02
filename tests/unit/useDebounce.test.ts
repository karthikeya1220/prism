/**
 * Unit tests for the useDebounce hook (M7): fake timers prove the 400 ms
 * default, per-call override, rapid typing keeping the value pending, and
 * value-only changes resetting the clock.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial'))
    expect(result.current).toBe('initial')
  })

  it('waits the 400 ms default before updating', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(399)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('ab')
  })

  it('honors a per-call delay override', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('b')
  })

  it('keeps the latest value when changes keep arriving (rapid typing)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'q' },
    })

    rerender({ value: 'qu' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ value: 'que' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ value: 'quer' })
    // 600 ms of elapsed wall time, but every change reset the clock —
    // the settled value must be the newest one, not an intermediate.
    act(() => {
      vi.advanceTimersByTime(399)
    })
    expect(result.current).toBe('q')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('quer')
  })
})
