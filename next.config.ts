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
  env: {
    // Expose service role key to Edge runtime (middleware)
    // This is safe - Edge runtime is server-side, not exposed to client
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
}

export default withNextIntl(nextConfig)
