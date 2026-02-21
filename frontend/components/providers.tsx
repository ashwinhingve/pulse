'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

// Check if mobile build at module level
const isMobile = process.env.NEXT_PUBLIC_MOBILE_BUILD === 'true';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    const content = (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );

    // For mobile builds, skip SessionProvider (uses local token storage)
    if (isMobile) {
        return content;
    }

    // Web build: wrap with NextAuth SessionProvider
    return (
        <SessionProvider>
            {content}
        </SessionProvider>
    );
}

