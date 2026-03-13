import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// Server-side: needs absolute URL (Node.js fetch requires it)
const API_URL = process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api`
    : (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:3001/api');

export async function apiClient(endpoint: string, options: RequestInit = {}) {
    const session = await getServerSession(authOptions);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}

// Client-side API client
export async function clientApiClient(endpoint: string, options: RequestInit = {}, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}
