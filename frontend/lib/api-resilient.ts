/**
 * Resilient API wrapper — retry logic, offline queue, and health monitoring.
 * Wraps the existing axios instance from lib/api.ts.
 */

import api from './api';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

/* ── Configuration ─────────────────────────────────── */

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // Exponential: 1s, 2s, 4s
const HEALTH_CHECK_INTERVAL_MS = 30_000; // 30s
const HEALTH_ENDPOINT = '/health';

/* ── State ─────────────────────────────────────────── */

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isBackendHealthy = true;
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
const offlineQueue: Array<{
    config: AxiosRequestConfig;
    resolve: (v: AxiosResponse) => void;
    reject: (e: unknown) => void;
}> = [];

type StatusCallback = (online: boolean, backendHealthy: boolean) => void;
const statusListeners = new Set<StatusCallback>();

/* ── Online/Offline Detection ──────────────────────── */

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        isOnline = true;
        notifyListeners();
        flushOfflineQueue();
    });
    window.addEventListener('offline', () => {
        isOnline = false;
        notifyListeners();
    });
}

function notifyListeners() {
    statusListeners.forEach((cb) => cb(isOnline, isBackendHealthy));
}

/* ── Health Check ──────────────────────────────────── */

async function checkHealth(): Promise<boolean> {
    try {
        await api.get(HEALTH_ENDPOINT, { timeout: 5000 });
        if (!isBackendHealthy) {
            isBackendHealthy = true;
            notifyListeners();
        }
        return true;
    } catch {
        if (isBackendHealthy) {
            isBackendHealthy = false;
            notifyListeners();
        }
        return false;
    }
}

export function startHealthMonitor() {
    if (healthCheckTimer) return;
    checkHealth(); // immediate first check
    healthCheckTimer = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
}

export function stopHealthMonitor() {
    if (healthCheckTimer) {
        clearInterval(healthCheckTimer);
        healthCheckTimer = null;
    }
}

/* ── Retry with Exponential Backoff ────────────────── */

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(status?: number): boolean {
    if (!status) return true; // network error
    return status >= 500 || status === 408 || status === 429;
}

async function requestWithRetry<T = unknown>(
    config: AxiosRequestConfig,
    retries = MAX_RETRIES,
): Promise<AxiosResponse<T>> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await api.request<T>(config);
        } catch (error: any) {
            const status = error?.response?.status;
            const canRetry = attempt < retries && isRetryable(status);

            if (!canRetry) throw error;

            const backoff = RETRY_BASE_DELAY_MS * 2 ** attempt;
            const jitter = Math.random() * 500;
            await delay(backoff + jitter);
        }
    }
    // Unreachable, but TypeScript needs it
    throw new Error('Max retries exceeded');
}

/* ── Offline Queue ─────────────────────────────────── */

async function flushOfflineQueue() {
    while (offlineQueue.length > 0 && isOnline) {
        const item = offlineQueue.shift()!;
        try {
            const res = await requestWithRetry(item.config);
            item.resolve(res);
        } catch (err) {
            item.reject(err);
        }
    }
}

/* ── Public API ────────────────────────────────────── */

/**
 * Make a resilient API request with automatic retry and offline queuing.
 * - Retries up to 3 times with exponential backoff for 5xx/408/429
 * - Queues requests when offline and replays when back online
 */
export async function resilientRequest<T = unknown>(
    config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
    if (!isOnline) {
        // Queue for later if we're offline
        return new Promise<AxiosResponse<T>>((resolve, reject) => {
            offlineQueue.push({
                config,
                resolve: resolve as (v: AxiosResponse) => void,
                reject,
            });
        });
    }
    return requestWithRetry<T>(config);
}

/** Subscribe to connection status changes */
export function onConnectionChange(cb: StatusCallback): () => void {
    statusListeners.add(cb);
    return () => statusListeners.delete(cb);
}

/** Current connection status */
export function getConnectionStatus() {
    return { isOnline, isBackendHealthy, queuedRequests: offlineQueue.length };
}

export default resilientRequest;
