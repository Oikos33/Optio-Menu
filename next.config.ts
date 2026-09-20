import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Custom loader: routes all next/image requests through Supabase Storage transforms
    loader: 'custom',
    loaderFile: './lib/supabase-image-loader.ts',
    // Fallback domains for any external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ezxtjgydhhxjvalggirj.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
