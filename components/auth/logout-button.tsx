/**
 * Logout Button Component
 *
 * A button that signs out the current user.
 * Can be used in navigation menus or user dropdowns.
 *
 * @module components/auth/logout-button
 */

'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { signOutAction } from '@/app/actions/auth'

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

/**
 * Logout button component with confirmation dialog
 *
 * @param props - Component props
 * @param props.variant - Button variant style
 * @param props.size - Button size
 * @param props.showIcon - Whether to show logout icon
 * @param props.className - Additional CSS classes
 * @returns Logout button JSX
 */
export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  className = '',
}: LogoutButtonProps) {
  const t = useTranslations('auth.logout')
  const tNav = useTranslations('navigation')
  const locale = useLocale()

  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handle logout confirmation
   *
   * Signs out the user and redirects to home page.
   */
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await signOutAction(locale)
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isLoading}>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {tNav('logout')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('confirmMessage')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} disabled={isLoading}>
            {isLoading ? tNav('loading') : t('confirmButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
