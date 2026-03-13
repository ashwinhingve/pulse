import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserRole } from '@/types';
import { JWT } from 'next-auth/jwt';

// Server-side: needs absolute URL (Node.js fetch requires it)
// Uses BACKEND_URL (server env) rather than NEXT_PUBLIC_API_URL (client-side relative path)
const API_URL = process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api`
    : (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:3001/api');

/**
 * Decode JWT payload to check expiration without verification
 */
function decodeJwtExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.exp || null;
    } catch {
        return null;
    }
}

/**
 * Refresh the backend access token using the refresh token
 */
async function refreshBackendToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
            },
        });
        if (res.ok) {
            return await res.json();
        }
    } catch { }
    return null;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials): Promise<User | null> {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                try {
                    const res = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: credentials.username,
                            password: credentials.password,
                        }),
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        // Surface specific account status codes so the login page can show targeted messages
                        const code = errData?.code || errData?.message?.code;
                        if (code === 'ACCOUNT_PENDING' || code === 'ACCOUNT_SUSPENDED') {
                            throw new Error(code);
                        }
                        return null;
                    }

                    const data = await res.json();

                    if (data.accessToken) {
                        const profileRes = await fetch(`${API_URL}/auth/profile`, {
                            headers: {
                                'Authorization': `Bearer ${data.accessToken}`,
                            },
                        });

                        if (profileRes.ok) {
                            const user = await profileRes.json();
                            return {
                                id: user.id,
                                username: user.username,
                                email: user.username + '@pulselogic.mil',
                                name: user.fullName || user.username,
                                role: user.role as UserRole,
                                clearanceLevel: user.clearanceLevel,
                                accessToken: data.accessToken,
                                refreshToken: data.refreshToken,
                            };
                        }
                    }

                    return null;
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }): Promise<JWT> {
            // Initial sign-in: store both tokens
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.clearanceLevel = user.clearanceLevel;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                return token;
            }

            // Subsequent requests: check if backend token is expired
            const accessToken = token.accessToken as string;
            if (accessToken) {
                const exp = decodeJwtExpiry(accessToken);
                const now = Math.floor(Date.now() / 1000);

                // If token expires within 60 seconds, refresh it
                if (exp && exp - now < 60) {
                    const refreshToken = token.refreshToken as string;
                    if (refreshToken) {
                        const refreshed = await refreshBackendToken(refreshToken);
                        if (refreshed) {
                            token.accessToken = refreshed.accessToken;
                            token.refreshToken = refreshed.refreshToken;
                            console.log('[NextAuth] Backend token refreshed successfully');
                        } else {
                            console.warn('[NextAuth] Failed to refresh backend token');
                        }
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.role = token.role as UserRole;
                session.user.clearanceLevel = token.clearanceLevel as number;
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: false,
};
