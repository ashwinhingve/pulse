'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

// Check if mobile/desktop static build at module level
const isStaticBuild = process.env.NEXT_PUBLIC_MOBILE_BUILD === 'true';

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

    // Always include SessionProvider so useSession() never throws.
    // For static builds (mobile/desktop), disable session fetching since
    // /api/auth/* routes don't exist in the static export.
    return (
        <SessionProvider
            session={isStaticBuild ? null : undefined}
            refetchInterval={isStaticBuild ? 0 : undefined}
            refetchOnWindowFocus={!isStaticBuild}
        >
            {content}
        </SessionProvider>
    );
}

