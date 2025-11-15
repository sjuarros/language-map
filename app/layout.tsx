/**
 * Root Layout
 *
 * This is the root layout that wraps all pages.
 * Provides the HTML structure for all routes including auth callbacks.
 */

import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
