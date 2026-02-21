// Mobile authentication utilities for Capacitor builds
// This bypasses NextAuth and uses direct API calls with local token storage

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Check if running in Capacitor (mobile)
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).Capacitor?.isNativePlatform?.();
};

// Check if this is a mobile build (static export)
export const isMobileBuild = (): boolean => {
    return process.env.NEXT_PUBLIC_MOBILE_BUILD === 'true' || isMobile();
};

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface MobileUser {
    id: string;
    username: string;
    fullName: string;
    role: string;
    clearanceLevel: number;
    department?: string;
}

export interface MobileSession {
    user: MobileUser;
    tokens: AuthTokens;
}

const STORAGE_KEY = 'pulselogic_auth';

// Store session in localStorage
export const storeSession = (session: MobileSession): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

// Get stored session
export const getStoredSession = (): MobileSession | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

// Clear session
export const clearSession = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
};

// Login via backend API
export const mobileLogin = async (username: string, password: string): Promise<MobileSession> => {
    // Call backend login endpoint
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        const code = errData?.code || errData?.message?.code;
        if (code === 'ACCOUNT_PENDING' || code === 'ACCOUNT_SUSPENDED') {
            throw new Error(code);
        }
        throw new Error(errData.message || 'Invalid credentials');
    }

    const tokens: AuthTokens = await loginRes.json();

    // Get user profile
    const profileRes = await fetch(`${API_URL}/auth/profile`, {
        headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
        },
    });

    if (!profileRes.ok) {
        throw new Error('Failed to get user profile');
    }

    const user: MobileUser = await profileRes.json();

    const session: MobileSession = { user, tokens };
    storeSession(session);

    return session;
};

// Logout
export const mobileLogout = (): void => {
    clearSession();
};

// Get access token for API calls
export const getAccessToken = (): string | null => {
    const session = getStoredSession();
    return session?.tokens.accessToken || null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!getStoredSession();
};

// Get current user
export const getCurrentUser = (): MobileUser | null => {
    const session = getStoredSession();
    return session?.user || null;
};
