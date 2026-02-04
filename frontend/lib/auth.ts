import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserRole } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
                    // Call backend API
                    const res = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: credentials.username,
                            password: credentials.password,
                        }),
                    });

                    if (!res.ok) {
                        console.error('Login failed:', res.status);
                        return null;
                    }

                    const data = await res.json();

                    // Backend returns { accessToken, refreshToken }
                    // Get user profile with the token
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.clearanceLevel = user.clearanceLevel;
                token.accessToken = user.accessToken;
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
        maxAge: 15 * 60, // 15 minutes
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: true, // Enable debug mode to see errors
};
