/**
 * Connection monitor — tracks online/offline + WebSocket reconnection.
 * Use in React with the useConnectionStatus hook.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { onConnectionChange, getConnectionStatus, startHealthMonitor, stopHealthMonitor } from './api-resilient';

/* ── React Hook ────────────────────────────────────── */

export interface ConnectionStatus {
    isOnline: boolean;
    isBackendHealthy: boolean;
    queuedRequests: number;
}

/**
 * React hook for connection status — use in layout/providers.
 * Starts health monitor on mount, cleans up on unmount.
 */
export function useConnectionStatus(): ConnectionStatus {
    const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus);

    useEffect(() => {
        startHealthMonitor();

        const unsubscribe = onConnectionChange((online, backendHealthy) => {
            setStatus({
                isOnline: online,
                isBackendHealthy: backendHealthy,
                queuedRequests: getConnectionStatus().queuedRequests,
            });
        });

        return () => {
            unsubscribe();
            stopHealthMonitor();
        };
    }, []);

    return status;
}

/* ── WebSocket Reconnection ────────────────────────── */

const WS_RECONNECT_BASE_MS = 1000;
const WS_RECONNECT_MAX_MS = 30_000;
const WS_MAX_RETRIES = 10;

interface WebSocketManagerOptions {
    url: string;
    onMessage?: (data: MessageEvent) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    protocols?: string | string[];
}

/**
 * Auto-reconnecting WebSocket manager.
 * Call .connect() to start, .disconnect() to stop.
 */
export class WebSocketManager {
    private ws: WebSocket | null = null;
    private retryCount = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;

    constructor(private opts: WebSocketManagerOptions) { }

    connect() {
        this.intentionalClose = false;
        this.retryCount = 0;
        this.createConnection();
    }

    disconnect() {
        this.intentionalClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.ws?.close();
        this.ws = null;
    }

    send(data: string | ArrayBuffer) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    get readyState() {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    private createConnection() {
        try {
            this.ws = new WebSocket(this.opts.url, this.opts.protocols);

            this.ws.onopen = () => {
                this.retryCount = 0;
                this.opts.onOpen?.();
            };

            this.ws.onmessage = (event) => {
                this.opts.onMessage?.(event);
            };

            this.ws.onclose = () => {
                this.opts.onClose?.();
                if (!this.intentionalClose) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (error) => {
                this.opts.onError?.(error);
            };
        } catch {
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.retryCount >= WS_MAX_RETRIES) return;

        const delayMs = Math.min(
            WS_RECONNECT_BASE_MS * 2 ** this.retryCount,
            WS_RECONNECT_MAX_MS,
        );
        const jitter = Math.random() * 1000;
        this.retryCount++;

        this.reconnectTimer = setTimeout(() => {
            this.createConnection();
        }, delayMs + jitter);
    }
}

/**
 * React hook for auto-reconnecting WebSocket.
 */
export function useWebSocket(url: string | null, onMessage?: (data: MessageEvent) => void) {
    const managerRef = useRef<WebSocketManager | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!url) return;

        const manager = new WebSocketManager({
            url,
            onMessage,
            onOpen: () => setIsConnected(true),
            onClose: () => setIsConnected(false),
        });

        managerRef.current = manager;
        manager.connect();

        return () => {
            manager.disconnect();
            managerRef.current = null;
        };
    }, [url]);

    const send = useCallback((data: string | ArrayBuffer) => {
        managerRef.current?.send(data);
    }, []);

    return { isConnected, send };
}
