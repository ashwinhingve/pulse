'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/session';
import { useAuthStore } from '@/lib/store/auth';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore(s => s.user);
    const [checked, setChecked] = useState(false);
    useEffect(() => {
        let mounted = true;
        getAuthToken().then(token => {
            if (!mounted) return;
            if (!token) router.replace('/auth/login');
            setChecked(!!token);
        });
        return () => { mounted = false; };
    }, [router, pathname]);
    useEffect(() => {
        if (checked && !user) router.replace('/auth/login');
    }, [checked, user, router]);
    if (!checked || !user) return <div className="min-h-screen flex items-center justify-center" role="status">Checking your session…</div>;
    return <>{children}</>;
}
