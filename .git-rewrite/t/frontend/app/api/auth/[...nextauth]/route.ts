import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// For mobile/desktop static export, this route won't be used.
// Mobile auth uses direct API calls via lib/mobile-auth.ts

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

/**
 * Required by Next.js 14.1 `output: 'export'` for ALL dynamic routes,
 * including route handlers (not just page.tsx files).
 *
 * Next.js checks: `!!workerResult.prerenderRoutes?.length` — if the returned
 * array has zero entries it throws "missing generateStaticParams".
 *
 * For a catch-all `[...nextauth]` segment, the param key is `nextauth`
 * and the value must be a string array (each segment becomes one path part).
 * The placeholder value satisfies the length check without actually
 * generating a meaningful static file (the route is excluded from the
 * Capacitor/Tauri bundle anyway).
 */
export function generateStaticParams() {
    return [{ nextauth: ['session'] }];
}
