/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.cashfree.com https://*.cashfree.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://ik.imagekit.io https://*.cashfree.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://upload.imagekit.io https://*.cashfree.com https://sandbox.cashfree.com https://api.cashfree.com https://payments-test.cashfree.com https://payments.cashfree.com; frame-src 'self' https://*.cashfree.com https://sandbox.cashfree.com https://api.cashfree.com https://payments-test.cashfree.com https://payments.cashfree.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/billing/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ]
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/projects/:id',
        destination: '/dashboard/:id',
        permanent: true,
      },
      {
        source: '/dashboard/projects/:id',
        destination: '/dashboard/:id',
        permanent: true,
      },
    ]
  }
};

export default nextConfig;
