'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { isMobileBuild, getStoredSession, isAuthenticated } from '@/lib/mobile-auth';

// Check at module level - this is set at build time
const IS_MOBILE_BUILD = process.env.NEXT_PUBLIC_MOBILE_BUILD === 'true';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { setAuth, clearAuth } = useAuthStore();
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        // For mobile builds, use local storage auth
        if (IS_MOBILE_BUILD) {
            const mobileSession = getStoredSession();
            if (mobileSession?.user) {
                setAuth(
                    {
                        id: mobileSession.user.id,
                        username: mobileSession.user.username,
                        role: mobileSession.user.role as any,
                        clearanceLevel: mobileSession.user.clearanceLevel,
                        mfaEnabled: false,
                    },
                    mobileSession.tokens.accessToken,
                    mobileSession.tokens.refreshToken
                );
                setIsAuthed(true);
            } else {
                clearAuth();
                router.replace('/auth/login');
            }
            setAuthChecked(true);
        } else {
            // Web build - dynamically import and use NextAuth
            import('next-auth/react').then(({ getSession }) => {
                getSession().then((session) => {
                    if (session?.user) {
                        setAuth(
                            {
                                id: (session.user as any).id,
                                username: session.user.name || '',
                                role: (session.user as any).role as any,
                                clearanceLevel: (session.user as any).clearanceLevel,
                                mfaEnabled: false,
                            },
                            (session as any).accessToken || '',
                            ''
                        );
                        setIsAuthed(true);
                    } else {
                        clearAuth();
                        router.replace('/auth/login');
                    }
                    setAuthChecked(true);
                });
            });
        }
    }, [setAuth, clearAuth, router]);

    // Show loading state while checking authentication
    if (!authChecked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthed) {
        return null;
    }

    return <>{children}</>;
}
