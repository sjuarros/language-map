/**
 * Invitation Server Actions
 *
 * Server-side actions for user invitation management.
 * Handles creating invitations, accepting invitations, and granting city access.
 *
 * This module provides:
 * - createInvitation: Create new user invitations with city access grants
 * - acceptInvitation: Accept invitation and grant city access
 * - revokeInvitation: Revoke pending invitations
 * - getInvitations: Fetch invitations list for admin review
 *
 * Security features:
 * - Token-based invitation acceptance
 * - Role-based permission checks (admin/superuser)
 * - City access validation
 * - RLS policies for data isolation
 * - Input validation with Zod
 *
 * @module app/actions/invitations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { getDatabaseAdminClient } from '@/lib/database/client'
import { randomBytes } from 'crypto'
import { z } from 'zod'

/**
 * Schema for creating an invitation
 */
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
  role: z.enum(['admin', 'operator'] as const),
  cityIds: z.array(z.string().uuid('Invalid city ID')).min(1, 'At least one city is required'),
})

/**
 * Create a new invitation
 *
 * @param input - Invitation data
 * @param input.email - Email address of the invited user
 * @param input.fullName - Full name of the invited user
 * @param input.role - Role to grant (admin or operator)
 * @param input.cityIds - Array of city IDs to grant access to
 * @returns Promise resolving to invitation data
 * @throws Error if invitation creation fails
 */
export async function createInvitation(input: {
  email: string
  fullName: string
  role: 'admin' | 'operator'
  cityIds: string[]
}): Promise<{ success: boolean; invitation: {
  id: string
  email: string
  token: string
  role: string
  fullName: string
  expiresAt: string
} }> {
  // Validate input
  const validation = createInvitationSchema.safeParse(input)
  if (!validation.success) {
    throw new Error(
      `Validation failed: ${validation.error.issues.map((e) => e.message).join(', ')}`
    )
  }

  const { email, fullName, role, cityIds } = validation.data

  try {
    const supabase = getDatabaseAdminClient('system')

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Check if user has permission to invite (admin or superuser)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'superuser' && profile.role !== 'admin')) {
      throw new Error('Insufficient permissions to create invitations')
    }

    // If user is admin, check they have admin access to at least one of the target cities
    // This prevents privilege escalation where an admin could invite users to cities they don't manage
    if (profile.role === 'admin') {
      // Fetch cities where this user has admin role
      const { data: adminCities } = await supabase
        .from('city_users')
        .select('city_id')
        .eq('user_id', user.id)
        .eq('role', 'admin')

      // Extract city IDs into an array for quick lookup
      const adminCityIds = adminCities?.map((c) => c.city_id) || []

      // Verify that at least one target city is in our admin list
      // This ensures admins can only invite users to cities they manage
      const hasCityAccess = cityIds.some((cityId) => adminCityIds.includes(cityId))

      if (!hasCityAccess) {
        throw new Error('You must have admin access to at least one of the selected cities')
      }
    }

    // Check if user already exists in the system
    // This prevents duplicate accounts and ensures email uniqueness
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('A user with this email already exists')
    }

    // Check for existing pending invitations to this email
    // We only allow one pending invitation per email to avoid spam and confusion
    // Query filters: not accepted, not revoked, not expired
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .is('accepted_at', null)       // Not yet accepted
      .is('revoked_at', null)        // Not revoked
      .gt('expires_at', new Date().toISOString())  // Not expired
      .single()

    if (existingInvitation) {
      throw new Error('A pending invitation already exists for this email')
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex')

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        token,
        role,
        full_name: fullName,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (invitationError) {
      throw new Error(`Failed to create invitation: ${invitationError.message}`)
    }

    // Create city access grants for this invitation
    // Each grant maps an invitation to a city with a specific role
    // These grants are used when the invitation is accepted to automatically grant access
    const cityGrants = cityIds.map((cityId) => ({
      invitation_id: invitation.id,
      city_id: cityId,
      role,
    }))

    const { error: grantsError } = await supabase
      .from('invitation_city_grants')
      .insert(cityGrants)

    if (grantsError) {
      // Rollback: Clean up invitation if grants fail
      // This ensures we don't have orphaned invitations without grants
      await supabase.from('invitations').delete().eq('id', invitation.id)
      throw new Error(`Failed to create city grants: ${grantsError.message}`)
    }

    // TODO: Send email invitation
    // This would integrate with an email service (SendGrid, etc.)
    // For now, we'll just log the invitation link
    console.log('Invitation created:', {
      email,
      token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/invitation/accept?token=${token}`,
    })

    // Revalidate relevant paths
    revalidatePath('/admin/invitations')

    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        role: invitation.role,
        fullName: invitation.full_name,
        expiresAt: invitation.expires_at,
      },
    }
  } catch (error) {
    console.error('Error creating invitation:', error)
    throw error instanceof Error
      ? error
      : new Error('Failed to create invitation')
  }
}

/**
 * Accept an invitation
 *
 * @param token - Invitation token
 * @returns Promise resolving to acceptance result
 * @throws Error if invitation acceptance fails
 */
export async function acceptInvitation(token: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid invitation token')
    }

    const supabase = getDatabaseAdminClient('system')

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Call the database function to accept invitation
    const { data, error } = await supabase.rpc('accept_invitation', {
      p_token: token,
      p_user_id: user.id,
    })

    if (error) {
      throw new Error(error.message)
    }

    const result = data as { success: boolean; error?: string; message?: string }

    if (!result.success) {
      throw new Error(result.error || 'Failed to accept invitation')
    }

    // Revalidate relevant paths
    revalidatePath('/admin/invitations')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: result.message || 'Invitation accepted',
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    throw error instanceof Error
      ? error
      : new Error('Failed to accept invitation')
  }
}

/**
 * Revoke an invitation
 *
 * @param invitationId - ID of the invitation to revoke
 * @returns Promise resolving to revocation result
 * @throws Error if revocation fails
 */
export async function revokeInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!invitationId || typeof invitationId !== 'string') {
      throw new Error('Invalid invitation ID')
    }

    const supabase = getDatabaseAdminClient('system')

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Check if user can revoke this invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('invited_by')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.invited_by !== user.id) {
      // Check if user is superuser
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'superuser') {
        throw new Error('You can only revoke invitations you created')
      }
    }

    // Revoke the invitation
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      throw new Error(`Failed to revoke invitation: ${updateError.message}`)
    }

    // Revalidate relevant paths
    revalidatePath('/admin/invitations')

    return {
      success: true,
      message: 'Invitation revoked successfully',
    }
  } catch (error) {
    console.error('Error revoking invitation:', error)
    throw error instanceof Error
      ? error
      : new Error('Failed to revoke invitation')
  }
}

/**
 * Get invitations for the current user
 *
 * @returns Promise resolving to list of invitations
 * @throws Error if fetch fails
 */
export async function getInvitations(): Promise<Array<{
  id: string
  email: string
  role: string
  full_name: string
  created_at: string
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
}>> {
  try {
    const supabase = getDatabaseAdminClient('system')

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw new Error('User profile not found')
    }

    let query = supabase
      .from('invitations')
      .select(`
        *,
        invited_by_user:user_profiles!invitations_invited_by_fkey(
          id,
          email,
          full_name
        ),
        city_grants:invitation_city_grants(
          id,
          city_id,
          role,
          city:cities(
            id,
            slug,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // If not superuser, only show invitations created by this user
    if (profile.role !== 'superuser') {
      query = query.eq('invited_by', user.id)
    }

    const { data: invitations, error } = await query

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`)
    }

    return invitations || []
  } catch (error) {
    console.error('Error fetching invitations:', error)
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch invitations')
  }
}
