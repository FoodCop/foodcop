import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FuzoButton } from '../../../components/FuzoButton'

describe('FuzoButton', () => {
  it('renders with default props', () => {
    render(<FuzoButton>Click me</FuzoButton>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-[#F14C35]') // primary variant
    expect(button).toHaveClass('px-6', 'py-3', 'text-base') // md size
  })

  it('renders with secondary variant', () => {
    render(<FuzoButton variant="secondary">Secondary</FuzoButton>)
    
    const button = screen.getByRole('button', { name: /secondary/i })
    expect(button).toHaveClass('bg-white', 'text-[#F14C35]', 'border-2', 'border-[#F14C35]')
  })

  it('renders with tertiary variant', () => {
    render(<FuzoButton variant="tertiary">Tertiary</FuzoButton>)
    
    const button = screen.getByRole('button', { name: /tertiary/i })
    expect(button).toHaveClass('bg-transparent', 'text-[#F14C35]')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<FuzoButton size="sm">Small</FuzoButton>)
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm')

    rerender(<FuzoButton size="lg">Large</FuzoButton>)
    expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-lg')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<FuzoButton onClick={handleClick}>Click me</FuzoButton>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<FuzoButton disabled>Disabled</FuzoButton>)
    
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('applies custom className', () => {
    render(<FuzoButton className="custom-class">Custom</FuzoButton>)
    
    const button = screen.getByRole('button', { name: /custom/i })
    expect(button).toHaveClass('custom-class')
  })

  it('forwards other props to button element', () => {
    render(<FuzoButton data-testid="custom-button" aria-label="Custom label">Test</FuzoButton>)
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })
})
