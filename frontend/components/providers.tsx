'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'

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

    // For mobile builds, skip SessionProvider (uses local token storage)
    if (isMobile) {
        return (
            <QueryClientProvider client={queryClient}>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        )
    }

    // Web build: use SessionProvider
    // Dynamic import to avoid bundling NextAuth in mobile builds
    const SessionProviderWrapper = ({ children }: { children: React.ReactNode }) => {
        const [SessionProvider, setSessionProvider] = useState<any>(null);

        useEffect(() => {
            import('next-auth/react').then((mod) => {
                setSessionProvider(() => mod.SessionProvider);
            });
        }, []);

        if (!SessionProvider) {
            return <>{children}</>;
        }

        return <SessionProvider>{children}</SessionProvider>;
    };

    return (
        <SessionProviderWrapper>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        </SessionProviderWrapper>
    )
}

