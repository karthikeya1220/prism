import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

/** Trivial component proving Vitest + RTL + jest-dom are wired up. */
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}!</p>
}

describe('tooling smoke', () => {
  it('renders a component with RTL and jest-dom matchers', () => {
    render(<Greeting name="Prism" />)
    expect(screen.getByText('Hello, Prism!')).toBeInTheDocument()
  })
})
