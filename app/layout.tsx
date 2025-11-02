/**
 * Root Layout
 *
 * This is the root layout that wraps all pages.
 * Provides the HTML structure for all routes including auth callbacks.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
