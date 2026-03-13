'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth(requiredRole?: string) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const isAuthenticated = status === 'authenticated';
    const isLoading = status === 'loading';
    const user = session?.user;

    const hasRole = (role: string) => {
        return user?.role === role;
    };

    const requireAuth = () => {
        if (!isAuthenticated && !isLoading) {
            router.push('/auth/login');
            return false;
        }
        return true;
    };

    const requireRole = (role: string) => {
        if (!requireAuth()) return false;

        if (!hasRole(role)) {
            router.push(`/${user?.role.toLowerCase()}/dashboard`);
            return false;
        }

        return true;
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        hasRole,
        requireAuth,
        requireRole,
    };
}
