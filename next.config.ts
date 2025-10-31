/**
 * @file next.config.ts
 * @description Next.js configuration for internationalized routing.
 * Integrates with next-intl plugin for locale-aware routing.
 */

import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  /* config options here */
}

export default withNextIntl(nextConfig)
