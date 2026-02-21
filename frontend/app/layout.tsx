import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
