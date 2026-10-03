/**
 * useInfiniteScroll unit tests: observer wiring, enabled gating, teardown
 * on disable, and live callback identity (no stale closures).
 * IntersectionObserver is stubbed — jsdom has no native implementation.
 */
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll } from '@/features/feed/useInfiniteScroll'

interface ObserverInstance {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

const instances: ObserverInstance[] = []

class StubIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    instances.push(this)
  }
}

function Harness({ onHit, enabled }: { onHit: () => void; enabled: boolean }) {
  const ref = useInfiniteScroll(onHit, enabled)
  return <div data-testid="sentinel" ref={ref} />
}

function trigger(instance: ObserverInstance, isIntersecting: boolean) {
  instance.callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    undefined as unknown as IntersectionObserver,
  )
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    instances.length = 0
    vi.stubGlobal('IntersectionObserver', StubIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('observes the sentinel and fires onHit only while intersecting', () => {
    const onHit = vi.fn()
    render(<Harness onHit={onHit} enabled />)

    expect(instances).toHaveLength(1)
    expect(instances[0].observe).toHaveBeenCalledTimes(1)

    trigger(instances[0], true)
    expect(onHit).toHaveBeenCalledTimes(1)

    trigger(instances[0], false)
    expect(onHit).toHaveBeenCalledTimes(1)
  })

  it('never observes while disabled', () => {
    render(<Harness onHit={vi.fn()} enabled={false} />)
    expect(instances).toHaveLength(0)
  })

  it('disconnects the observer when disabled again', () => {
    const onHit = vi.fn()
    const { rerender } = render(<Harness onHit={onHit} enabled />)
    rerender(<Harness onHit={onHit} enabled={false} />)
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1)
  })

  it('always invokes the latest callback — no stale closure', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Harness onHit={first} enabled />)
    rerender(<Harness onHit={second} enabled />)

    trigger(instances[0], true)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
