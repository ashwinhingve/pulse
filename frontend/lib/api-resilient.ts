import api from './api';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

let isOnline = typeof navigator === 'undefined' || navigator.onLine;
let isBackendHealthy = true;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(online: boolean, healthy: boolean) => void>();
const notify = () => listeners.forEach(listener => listener(isOnline, isBackendHealthy));
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { isOnline = true; notify(); checkHealth(); });
    window.addEventListener('offline', () => { isOnline = false; notify(); });
}
async function checkHealth() {
    try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
        const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
        isBackendHealthy = response.ok;
    } catch { isBackendHealthy = false; }
    notify();
}
export function startHealthMonitor() { if (!timer) { checkHealth(); timer = setInterval(checkHealth, 30000); } }
export function stopHealthMonitor() { if (timer) clearInterval(timer); timer = null; }
export function getConnectionStatus() { return { isOnline, isBackendHealthy, queuedRequests: 0 }; }
export function onConnectionChange(listener: (online: boolean, healthy: boolean) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export async function resilientRequest<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (!isOnline) throw new Error('You are offline. Your changes have not been sent.');
    const safe = ['get', 'head', 'options'].includes((config.method || 'get').toLowerCase());
    for (let attempt = 0; ; attempt++) {
        try { return await api.request<T>(config); }
        catch (error: any) {
            if (!safe || attempt >= 2 || (error.response?.status && error.response.status < 500)) throw error;
            await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
        }
    }
}
export default resilientRequest;
