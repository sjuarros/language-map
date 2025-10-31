/**
 * Home Page
 *
 * The main landing page of the application.
 * Displays welcome message with i18n support.
 */

'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

export default function Home() {
  const t = useTranslations('home')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          {t('subtitle')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('description')}
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <LocaleSwitcher />
        </div>
      </div>
    </main>
  )
}

function LocaleSwitcher() {
  const locales = ['en', 'nl', 'fr'] as const
  const localeNames = {
    en: 'English',
    nl: 'Nederlands',
    fr: 'Français',
  }

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <Link
          key={locale}
          href="/"
          locale={locale}
          className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {localeNames[locale]}
        </Link>
      ))}
    </div>
  )
}
