import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
// Legacy AuthProvider removed; tests no longer need auth wrapper while auth is being rebuilt.
// If specific tests require a user, they can mock the stub context directly.

// Removed Supabase mock – no auth layer active.

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => <>{children}</>;

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
// export placeholder for backward compatibility if imports linger
export const mockSupabaseClient = {} as any;
