import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FuzoCard } from '../../../components/global/FuzoCard'

describe('FuzoCard', () => {
  it('renders with default props', () => {
    render(<FuzoCard>Card content</FuzoCard>)
    
    const card = screen.getByText('Card content')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('bg-white', 'text-[#0B1F3A]') // white background
    expect(card).toHaveClass('p-8') // lg padding
    expect(card).toHaveClass('rounded-2xl', 'shadow-lg') // base styles
  })

  it('renders with different backgrounds', () => {
    const { rerender } = render(<FuzoCard background="yellow">Yellow card</FuzoCard>)
    expect(screen.getByText('Yellow card')).toHaveClass('bg-[#FFD74A]', 'text-[#0B1F3A]')

    rerender(<FuzoCard background="coral">Coral card</FuzoCard>)
    expect(screen.getByText('Coral card')).toHaveClass('bg-[#F14C35]', 'text-white')

    rerender(<FuzoCard background="dark">Dark card</FuzoCard>)
    expect(screen.getByText('Dark card')).toHaveClass('bg-[#A6471E]', 'text-white')
  })

  it('renders with different padding sizes', () => {
    const { rerender } = render(<FuzoCard padding="sm">Small padding</FuzoCard>)
    expect(screen.getByText('Small padding')).toHaveClass('p-4')

    rerender(<FuzoCard padding="md">Medium padding</FuzoCard>)
    expect(screen.getByText('Medium padding')).toHaveClass('p-6')

    rerender(<FuzoCard padding="xl">Extra large padding</FuzoCard>)
    expect(screen.getByText('Extra large padding')).toHaveClass('p-12')
  })

  it('applies custom className', () => {
    render(<FuzoCard className="custom-card">Custom card</FuzoCard>)
    
    const card = screen.getByText('Custom card')
    expect(card).toHaveClass('custom-card')
  })

  it('renders children correctly', () => {
    render(
      <FuzoCard>
        <h2>Card Title</h2>
        <p>Card description</p>
        <button>Action</button>
      </FuzoCard>
    )
    
    expect(screen.getByRole('heading', { name: /card title/i })).toBeInTheDocument()
    expect(screen.getByText('Card description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
  })
})
