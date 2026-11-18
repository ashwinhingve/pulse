'use client';
import { useConnectionStatus } from '@/lib/connection-monitor';
import { useAuthStore } from '@/lib/store/auth';
function Status() {
    const { isOnline, isBackendHealthy } = useConnectionStatus();
    if (isOnline && isBackendHealthy) return null;
    return (
        <div
            role="status"
            className="relative z-40 p-3 text-center text-sm bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
            {!isOnline
                ? 'You are offline. Changes cannot be saved until you reconnect.'
                : 'The server is not responding. Your latest changes may not have been saved.'}
        </div>
    );
}
export default function ConnectionBanner() {
    const user = useAuthStore((s) => s.user);
    return user ? <Status /> : null;
}
