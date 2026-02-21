/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },

    // Enable static export for mobile/desktop builds (Capacitor/Tauri)
    ...(isMobileBuild && {
        output: 'export',
    }),

    // Exclude API routes from mobile builds (static export can't have API routes)
    ...(isMobileBuild && {
        excludeDefaultMomentLocales: true,
    }),

    // Proxy API requests to backend — only for web dev (not static export)
    ...(!isMobileBuild && {
        async rewrites() {
            return {
                beforeFiles: [
                    {
                        source: '/api/:path((?!auth/).*)',
                        destination: `${BACKEND_URL}/api/:path*`,
                    },
                ],
            };
        },

        // Security headers — only for web builds
        async headers() {
            return [
                {
                    source: '/:path*',
                    headers: [
                        {
                            key: 'X-DNS-Prefetch-Control',
                            value: 'on'
                        },
                        {
                            key: 'Strict-Transport-Security',
                            value: 'max-age=63072000; includeSubDomains; preload'
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
                            key: 'X-XSS-Protection',
                            value: '1; mode=block'
                        },
                        {
                            key: 'Referrer-Policy',
                            value: 'no-referrer'
                        },
                        {
                            key: 'Permissions-Policy',
                            value: 'camera=(), microphone=(), geolocation=(self)'
                        }
                    ]
                }
            ]
        },
    }),

    // Environment variables exposed to client
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    }
}

module.exports = nextConfig
