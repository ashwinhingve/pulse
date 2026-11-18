import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Authentication must execute per request. Native exports omit this server route.
export const dynamic = 'force-dynamic';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
