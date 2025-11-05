/**
 * Invitation Server Actions Tests
 *
 * Tests for invitation-related server actions.
 *
 * @module app/actions/invitations.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createInvitation,
  acceptInvitation,
  revokeInvitation,
  getInvitations,
} from './invitations'

// Mock the Supabase client and related modules
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock the database functions
vi.mock('@/lib/database/client', () => ({
  getDatabaseClient: vi.fn(),
  getDatabaseAdminClient: vi.fn(),
}))

// Test data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
}

const mockInvitation = {
  id: 'invitation-123',
  email: 'invited@example.com',
  token: 'test-token-123',
  role: 'admin' as const,
  full_name: 'Invited User',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
}

describe('createInvitation', () => {
  it('should create an invitation successfully', async () => {
    // Mock successful auth and all required queries
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: check user role
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'superuser' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: check existing user (return null - no existing user)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        })
        // Third call: check pending invitation (return null - no pending invitation)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  gt: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        })
        // Fourth call: create invitation
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockInvitation,
                error: null,
              }),
            }),
          }),
        })
        // Fifth call: create city grants
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await createInvitation({
      email: 'invited@example.com',
      fullName: 'Invited User',
      role: 'admin',
      cityIds: ['123e4567-e89b-12d3-a456-426614174000'],
    })

    expect(result.success).toBe(true)
    expect(result.invitation).toEqual({
      id: 'invitation-123',
      email: 'invited@example.com',
      token: 'test-token-123',
      role: 'admin',
      fullName: 'Invited User',
      expiresAt: expect.any(String),
    })
  })

  it('should throw error for invalid email', async () => {
    await expect(
      createInvitation({
        email: 'invalid-email',
        fullName: 'Test User',
        role: 'admin',
        cityIds: ['123e4567-e89b-12d3-a456-426614174000'],
      })
    ).rejects.toThrow('Invalid email address')
  })

  it('should throw error for missing city IDs', async () => {
    await expect(
      createInvitation({
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'admin',
        cityIds: [],
      })
    ).rejects.toThrow('At least one city is required')
  })

  it('should throw error if user does not have permission', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'operator' },
              error: null,
            }),
          }),
        }),
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      createInvitation({
        email: 'invited@example.com',
        fullName: 'Invited User',
        role: 'admin',
        cityIds: ['123e4567-e89b-12d3-a456-426614174000'],
      })
    ).rejects.toThrow('Insufficient permissions')
  })

  it('should throw error if user already exists', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: check user role (admin)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: check admin cities
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [{ city_id: '123e4567-e89b-12d3-a456-426614174000' }],
                error: null,
              }),
            }),
          }),
        })
        // Third call: check existing user (return existing user)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-user' },
                error: null,
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      createInvitation({
        email: 'existing@example.com',
        fullName: 'Existing User',
        role: 'admin',
        cityIds: ['123e4567-e89b-12d3-a456-426614174000'],
      })
    ).rejects.toThrow('A user with this email already exists')
  })

  it('should throw error if pending invitation exists', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: check user role (admin)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: check admin cities
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [{ city_id: '123e4567-e89b-12d3-a456-426614174000' }],
                error: null,
              }),
            }),
          }),
        })
        // Third call: check existing user (return null - no existing user)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        })
        // Fourth call: check pending invitation (return existing invitation)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  gt: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'existing-invitation' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      createInvitation({
        email: 'pending@example.com',
        fullName: 'Pending User',
        role: 'admin',
        cityIds: ['123e4567-e89b-12d3-a456-426614174000'],
      })
    ).rejects.toThrow('A pending invitation already exists for this email')
  })

  it('should throw error if admin does not have access to selected cities', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: check user role
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: check admin cities (return empty array - admin has no city access)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [], // Admin has no city access
                error: null,
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      createInvitation({
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'admin',
        cityIds: ['123e4567-e89b-12d3-a456-426614174001'],
      })
    ).rejects.toThrow('You must have admin access to at least one of the selected cities')
  })
})

describe('acceptInvitation', () => {
  it('should accept invitation successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: { success: true, message: 'Invitation accepted' },
        error: null,
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await acceptInvitation('valid-token')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Invitation accepted')
  })

  it('should throw error for invalid token', async () => {
    await expect(acceptInvitation('')).rejects.toThrow('Invalid invitation token')
  })

  it('should throw error if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(acceptInvitation('test-token')).rejects.toThrow('Authentication required')
  })

  it('should throw error if invitation RPC fails', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invitation not found' },
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(acceptInvitation('invalid-token')).rejects.toThrow('Invitation not found')
  })

  it('should throw error if invitation returns unsuccessful', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: { success: false, error: 'Invitation expired' },
        error: null,
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(acceptInvitation('expired-token')).rejects.toThrow('Invitation expired')
  })
})

describe('revokeInvitation', () => {
  it('should revoke invitation successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { invited_by: mockUser.id },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await revokeInvitation('invitation-123')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Invitation revoked successfully')
  })

  it('should throw error for invalid invitation ID', async () => {
    await expect(revokeInvitation('')).rejects.toThrow('Invalid invitation ID')
  })

  it('should throw error if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(revokeInvitation('invitation-123')).rejects.toThrow('Authentication required')
  })

  it('should throw error if invitation not found', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(revokeInvitation('invitation-123')).rejects.toThrow('Invitation not found')
  })

  it('should allow superuser to revoke any invitation', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { invited_by: 'other-user-id' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'superuser' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await revokeInvitation('invitation-123')

    expect(result.success).toBe(true)
  })

  it('should throw error if non-owner tries to revoke', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { invited_by: 'other-user-id' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(revokeInvitation('invitation-123')).rejects.toThrow(
      'You can only revoke invitations you created'
    )
  })
})

describe('getInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch invitations for superuser', async () => {
    const mockInvitations = [
      {
        id: '1',
        email: 'test1@example.com',
        invited_by_user: { id: 'user1', email: 'user1@example.com' },
      },
      {
        id: '2',
        email: 'test2@example.com',
        invited_by_user: { id: 'user2', email: 'user2@example.com' },
      },
    ]

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: user_profiles
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'superuser' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: invitations (superuser sees all)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: mockInvitations,
              error: null,
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await getInvitations()

    expect(result).toEqual(mockInvitations)
  })

  it('should fetch only own invitations for non-superuser', async () => {
    const mockInvitations = [
      {
        id: '1',
        email: 'test@example.com',
        invited_by_user: { id: mockUser.id, email: mockUser.email },
      },
    ]

    // First call is to user_profiles, second to invitations
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: user_profiles to get role
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: invitations (non-superuser gets filtered query)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: mockInvitations,
                error: null,
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await getInvitations()

    expect(result).toEqual(mockInvitations)
    // Verify that the query was filtered by invited_by
    expect(mockSupabase.from).toHaveBeenCalledWith('invitations')
  })

  it('should return empty array if no invitations found', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: user_profiles
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: invitations (returns empty)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    const result = await getInvitations()

    expect(result).toEqual([])
  })

  it('should throw error if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(getInvitations()).rejects.toThrow('Authentication required')
  })

  it('should throw error if user profile not found', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: user_profiles (returns error)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(getInvitations()).rejects.toThrow('User profile not found')
  })

  it('should throw error if database query fails', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn()
        // First call: user_profiles
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        })
        // Second call: invitations (returns error)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
    }

    const { getDatabaseAdminClient } = await import('@/lib/database/client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getDatabaseAdminClient).mockReturnValue(mockSupabase as any)

    await expect(getInvitations()).rejects.toThrow('Failed to fetch invitations')
  })
})
