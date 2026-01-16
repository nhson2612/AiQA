import { render, screen } from '@testing-library/react'
import { Button } from './Button'
import { describe, it, expect } from 'vitest'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary-600') // Default variant check
  })

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>)
    const loadingText = screen.getByText('Loading...')
    expect(loadingText).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })
})
