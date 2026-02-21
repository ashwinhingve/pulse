import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// For mobile/desktop static export, this route won't be used.
// Mobile auth uses direct API calls via lib/mobile-auth.ts
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Required for static export (output: 'export') — tells Next.js
// what params to pre-render. Empty = none (route excluded from export).
export function generateStaticParams() {
    return [];
}
