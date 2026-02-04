/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Enable static export for mobile builds (Capacitor)
    // Web builds use middleware for authentication
    ...(isMobileBuild && {
        output: 'export',
        // Disable image optimization for static export
        images: { unoptimized: true },
    }),
    images: {
        unoptimized: true,
    },
    // Exclude API routes for mobile builds (they don't work with static export)
    ...(isMobileBuild && {
        experimental: {
            // Skip type checking for faster builds
            typedRoutes: false,
        },
    }),

    // Security headers
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

    // Environment variables exposed to client
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    }
}

module.exports = nextConfig
