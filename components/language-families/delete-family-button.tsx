/**
 * Delete Language Family Button Component
 * ========================================
 * Client component for deleting language families with confirmation dialog and loading states.
 *
 * Features:
 * - Confirmation dialog before deletion
 * - Loading state with disabled buttons
 * - Error handling with display
 * - Automatic navigation on success
 *
 * @module components/language-families/delete-family-button
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

/**
 * Props for DeleteFamilyButton component
 */
interface DeleteFamilyButtonProps {
  /** Language family UUID to delete */
  familyId: string
  /** Display name of the family for confirmation message */
  familyName: string
  /** City slug for navigation */
  citySlug: string
  /** Current locale for navigation */
  locale: string
  /** Server action to delete the family */
  onDelete: (id: string) => Promise<void>
  /** Optional size variant for the button */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Optional variant for the button */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

/**
 * Delete Language Family Button with Confirmation Dialog
 *
 * @param props - Component props
 * @returns Button with confirmation dialog and loading/error states
 *
 * @example
 * ```tsx
 * <DeleteFamilyButton
 *   familyId="uuid-123"
 *   familyName="Indo-European"
 *   citySlug="amsterdam"
 *   locale="en"
 *   onDelete={deleteLanguageFamily}
 * />
 * ```
 */
export function DeleteFamilyButton({
  familyId,
  familyName,
  citySlug,
  locale,
  onDelete,
  size = 'sm',
  variant = 'destructive',
}: DeleteFamilyButtonProps) {
  const t = useTranslations('operator.languageFamilies.delete')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')

  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  /**
   * Handle delete with error handling and loading state
   *
   * @async
   * @throws Will set error state if deletion fails
   */
  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      // Validate inputs before deletion
      if (!familyId || typeof familyId !== 'string') {
        throw new Error('Invalid family ID')
      }

      await onDelete(familyId)

      // Close dialog and navigate on success
      setIsOpen(false)
      router.push(`/${locale}/operator/${citySlug}/language-families`)
      router.refresh()
    } catch (err) {
      console.error('Error deleting language family:', err)

      let errorMessage = tCommon('error')

      if (err instanceof Error) {
        const message = err.message.toLowerCase()

        if (message.includes('referenced') || message.includes('foreign key')) {
          errorMessage = t('errors.stillReferenced')
        } else if (message.includes('unauthorized') || message.includes('permission')) {
          errorMessage = tErrors('permissionDenied')
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = tErrors('networkError')
        } else {
          errorMessage = `${t('errors.deleteFailed')}: ${err.message}`
        }
      }

      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handle dialog open state change
   * Clears error when dialog is opened
   */
  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) {
      setError(null)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-1" />
          )}
          {tCommon('delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmMessage', { familyName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('deleting')}
              </>
            ) : (
              tCommon('delete')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
