import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Strict mode for better React error detection
  reactStrictMode: true,

  // Security: prevent embedding in iframes
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],

  // Disable powered-by header
  poweredByHeader: false,
}

export default nextConfig
