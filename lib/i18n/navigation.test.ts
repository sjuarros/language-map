/**
 * @file navigation.test.ts
 * @description Unit tests for i18n navigation utilities.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock next-intl/navigation
vi.mock('next-intl/navigation', () => ({
  createNavigation: vi.fn(() => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: vi.fn(),
    useRouter: vi.fn(),
  })),
}))

describe('i18n Navigation', () => {
  it('should export navigation functions', async () => {
    const { Link, redirect, usePathname, useRouter } = await import('./navigation')

    expect(Link).toBeDefined()
    expect(redirect).toBeDefined()
    expect(usePathname).toBeDefined()
    expect(useRouter).toBeDefined()
  })

  it('should create navigation with correct configuration', async () => {
    const { createNavigation } = await import('next-intl/navigation')

    const mockCreateNavigation = vi.mocked(createNavigation)
    mockCreateNavigation.mockReturnValue({
      Link: vi.fn(),
      redirect: vi.fn(),
      usePathname: vi.fn(),
      useRouter: vi.fn(),
    })

    await import('./navigation')

    expect(mockCreateNavigation).toHaveBeenCalledWith({
      locales: ['en', 'nl', 'fr'],
      defaultLocale: 'en',
    })
  })
})
