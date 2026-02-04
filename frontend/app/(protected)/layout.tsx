'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/lib/store/auth';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { setAuth, clearAuth } = useAuthStore();

    useEffect(() => {
        // Sync NextAuth session with Zustand store
        if (status === 'authenticated' && session?.user) {
            setAuth(
                {
                    id: session.user.id,
                    username: session.user.name || '',
                    role: session.user.role as any,
                    clearanceLevel: session.user.clearanceLevel,
                    mfaEnabled: false,
                },
                session.accessToken || '',
                ''
            );
        } else if (status === 'unauthenticated') {
            clearAuth();
            router.push('/auth/login');
        }
    }, [session, status, setAuth, clearAuth, router]);

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        return null;
    }

    return <>{children}</>;
}
