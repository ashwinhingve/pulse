import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/components/providers'

const inter = localFont({ src: '../public/fonts/Inter.ttf', variable: '--font-inter', weight: '100 900', display: 'swap' })
const manrope = localFont({ src: '../public/fonts/Manrope.ttf', variable: '--font-manrope', weight: '200 800', display: 'swap' })

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
    title: 'PulseLogic - Secure Military Medical Platform',
    description: 'Clinical decision support and communication for military doctors',
    robots: 'noindex, nofollow',
    icons: {
        icon: [
            { url: '/icon.svg', type: 'image/svg+xml' },
        ],
    },
    openGraph: {
        title: 'PulseLogic',
        description: 'AI-powered clinical decision support for military medical professionals',
        siteName: 'PulseLogic',
    },
    other: {
        'theme-color': '#0d9488',
        'msapplication-TileColor': '#0d9488',
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${manrope.variable} ${inter.className}`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
