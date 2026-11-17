'use client';

import { getSession, signOut } from 'next-auth/react';
import {
    getStoredSession,
    storeSession,
    clearSession,
    isMobileBuild,
} from './mobile-auth';
import { useAuthStore } from './store/auth';

export const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
).replace(/\/$/, '');
let refreshing: Promise<string | null> | null = null;
let generation = 0;

function expiresSoon(token: string): boolean {
    try {
        return (
            JSON.parse(atob(token.split('.')[1])).exp * 1000 <
            Date.now() + 60000
        );
    } catch {
        return true;
    }
}

export function clearClientSession() {
    generation++;
    clearSession();
    useAuthStore.getState().clearAuth();
}

export async function getAuthToken(
    forceRefresh = false,
): Promise<string | null> {
    const current = isMobileBuild()
        ? getStoredSession()?.tokens.accessToken
        : useAuthStore.getState().accessToken;
    if (current && !forceRefresh && !expiresSoon(current)) {
        if (isMobileBuild()) {
            const session = getStoredSession();
            if (session)
                useAuthStore
                    .getState()
                    .setAuth(
                        {
                            ...session.user,
                            role: session.user.role as any,
                            mfaEnabled: !!session.user.mfaEnabled,
                        },
                        current,
                        session.tokens.refreshToken,
                    );
        }
        return current;
    }
    if (refreshing) return refreshing;
    const started = generation;
    refreshing = (async () => {
        try {
            if (isMobileBuild()) {
                const session = getStoredSession();
                if (!session) return null;
                const response = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.tokens.refreshToken}`,
                    },
                });
                if (!response.ok) throw new Error('Session expired');
                const tokens = await response.json();
                if (started !== generation) return null;
                storeSession({ ...session, tokens });
                useAuthStore
                    .getState()
                    .setAuth(
                        {
                            ...session.user,
                            role: session.user.role as any,
                            mfaEnabled: !!session.user.mfaEnabled,
                        },
                        tokens.accessToken,
                        tokens.refreshToken,
                    );
                return tokens.accessToken as string;
            }
            // NextAuth refresh tokens stay in its server-managed session cookie.
            const session = await getSession();
            if (started !== generation) return null;
            if (!session?.accessToken || session.error)
                throw new Error('Session expired');
            useAuthStore
                .getState()
                .setAuth(
                    {
                        ...session.user,
                        fullName: session.user.name,
                        role: session.user.role as any,
                        mfaEnabled: !!session.user.mfaEnabled,
                    },
                    session.accessToken,
                    '',
                );
            return session.accessToken;
        } catch {
            if (started === generation) {
                clearClientSession();
                if (!isMobileBuild()) await signOut({ redirect: false });
            }
            return null;
        }
    })().finally(() => {
        refreshing = null;
    });
    return refreshing;
}

export async function authenticatedFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<Response> {
    const send = async (token: string | null) => {
        const headers = new Headers(init.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return fetch(input, { ...init, headers });
    };
    const token = await getAuthToken();
    if (!token) throw new Error('Your session expired. Please sign in again.');
    let response = await send(token);
    if (response.status === 401) {
        const refreshed = await getAuthToken(true);
        if (!refreshed)
            throw new Error('Your session expired. Please sign in again.');
        response = await send(refreshed);
    }
    if (response.status === 401) {
        clearClientSession();
        if (!isMobileBuild()) await signOut({ redirect: false });
    }
    return response;
}
