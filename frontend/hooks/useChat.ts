'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store/auth';
import {
    Conversation,
    Message,
    ChatPartner,
    ConversationType,
} from '@/types';

interface UseChatOptions {
    autoConnect?: boolean;
}

interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    partners: ChatPartner[];
    isLoading: boolean;
    messagesLoading: boolean;
    error: string | null;
    isConnected: boolean;
    typingUsers: Map<string, string>;
    aiTyping: boolean;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
// Socket.IO connects to the base URL (no /api prefix), namespace /chat
const WS_BASE = API_URL.replace('/api', '');
const WS_URL = `${WS_BASE}/chat`;

// 4-tier token resolution: Zustand → localStorage(accessToken) → mobile localStorage → NextAuth
const getToken = async (): Promise<string | null> => {
    // 1. Zustand store (set by ProtectedLayout after NextAuth session is ready)
    const storeToken = useAuthStore.getState().accessToken;
    if (storeToken) return storeToken;
    // 2. Direct localStorage key — setAuth() always writes here
    try {
        if (typeof window !== 'undefined') {
            const direct = localStorage.getItem('accessToken');
            if (direct) return direct;
        }
    } catch {}
    // 3. Mobile auth storage (Capacitor)
    try {
        const { getStoredSession } = await import('@/lib/mobile-auth');
        const m = getStoredSession();
        if (m?.tokens?.accessToken) return m.tokens.accessToken;
    } catch {}
    // 4. NextAuth session (always fresh from server)
    try {
        const { getSession } = await import('next-auth/react');
        const s = await getSession();
        return s?.accessToken || null;
    } catch {}
    return null;
};

const getCurrentUserId = (): string | null => {
    const storeUser = useAuthStore.getState().user;
    if (storeUser?.id) return storeUser.id;
    try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('pulselogic_auth') : null;
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.user?.id || null;
        }
    } catch {}
    return null;
};

export function useChat(options: UseChatOptions = {}) {
    const socketRef = useRef<Socket | null>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    const [state, setState] = useState<ChatState>({
        conversations: [],
        currentConversation: null,
        messages: [],
        partners: [],
        isLoading: false,
        messagesLoading: false,
        error: null,
        isConnected: false,
        typingUsers: new Map(),
        aiTyping: false,
    });

    const currentConvRef = useRef<Conversation | null>(null);
    currentConvRef.current = state.currentConversation;

    // Connect to WebSocket
    useEffect(() => {
        if (!options.autoConnect) return;

        let socket: Socket;
        let mounted = true;

        const connect = async () => {
            const token = await getToken();
            if (!token || !mounted) return;

            socket = io(WS_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: 10,
            });

            socket.on('connect', () => {
                if (!mounted) return;
                setState((prev) => ({ ...prev, isConnected: true }));
            });

            socket.on('disconnect', () => {
                if (!mounted) return;
                setState((prev) => ({ ...prev, isConnected: false }));
            });

            // Refresh JWT before each reconnect attempt so expired tokens don't block reconnection
            socket.io.on('reconnect_attempt', async () => {
                const freshToken = await getToken();
                if (freshToken) {
                    socket.auth = { token: freshToken };
                }
            });

            socket.on('reconnect', async () => {
                if (!mounted) return;
                // Re-fetch conversations and re-join active conversation room
                await fetchConversationsInternal(socket);
                const conv = currentConvRef.current;
                if (conv) {
                    socket.emit('join_conversation', conv.id);
                }
            });

            socket.on('auth_error', (data: { message: string }) => {
                console.error('Socket auth error:', data.message);
                if (!mounted) return;
                setState((prev) => ({ ...prev, error: data.message, isConnected: false }));
            });

            socket.on('new_message', (message: Message) => {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    messages:
                        prev.currentConversation?.id === message.conversationId
                            ? [...prev.messages.filter((m) => !m.id.startsWith('temp-')), message]
                            : prev.messages,
                    conversations: prev.conversations.map((conv) =>
                        conv.id === message.conversationId
                            ? {
                                  ...conv,
                                  lastMessageAt: message.createdAt,
                                  metadata: {
                                      ...conv.metadata,
                                      lastMessagePreview: message.content.substring(0, 100),
                                  },
                              }
                            : conv
                    ),
                }));
            });

            socket.on(
                'user_typing',
                (data: { userId: string; username: string; conversationId: string; isTyping: boolean }) => {
                    if (!mounted) return;
                    setState((prev) => {
                        const newTypingUsers = new Map(prev.typingUsers);
                        if (data.isTyping) {
                            newTypingUsers.set(data.userId, data.username);
                        } else {
                            newTypingUsers.delete(data.userId);
                        }
                        return { ...prev, typingUsers: newTypingUsers };
                    });
                }
            );

            socket.on('ai_typing', (data: { conversationId: string; isTyping: boolean }) => {
                if (!mounted) return;
                setState((prev) => ({ ...prev, aiTyping: data.isTyping }));
            });

            socket.on('user_online', (data: { userId: string }) => {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    partners: prev.partners.map((p) =>
                        p.id === data.userId ? { ...p, isOnline: true } : p
                    ),
                }));
            });

            socket.on('user_offline', (data: { userId: string }) => {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    partners: prev.partners.map((p) =>
                        p.id === data.userId ? { ...p, isOnline: false } : p
                    ),
                }));
            });

            socket.on('unread_update', (data: { conversationId: string; unreadCount: number }) => {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    conversations: prev.conversations.map((conv) =>
                        conv.id === data.conversationId
                            ? { ...conv, unreadCount: data.unreadCount }
                            : conv
                    ),
                }));
            });

            socket.on('unread_cleared', (data: { conversationId: string }) => {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    conversations: prev.conversations.map((conv) =>
                        conv.id === data.conversationId ? { ...conv, unreadCount: 0 } : conv
                    ),
                }));
            });

            socket.on('message_status', (data: { conversationId: string; status: string }) => {
                if (!mounted) return;
                setState((prev) => ({
                    ...prev,
                    messages: prev.messages.map((m) =>
                        m.conversationId === data.conversationId ? { ...m, status: data.status as any } : m
                    ),
                }));
            });

            socketRef.current = socket;
        };

        connect();

        return () => {
            mounted = false;
            if (socket) {
                socket.disconnect();
            }
            socketRef.current = null;
        };
    }, [options.autoConnect]);

    // Internal fetch that can be called with an existing socket
    const fetchConversationsInternal = useCallback(async (socket?: Socket) => {
        const token = await getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) return;

            const conversations = await response.json();
            setState((prev) => ({ ...prev, conversations }));

            // Re-join conversation rooms on reconnect
            if (socket) {
                conversations.forEach((conv: Conversation) => {
                    socket.emit('join_conversation', conv.id);
                });
            }
        } catch {}
    }, []);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            await fetchConversationsInternal();
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: 'Failed to fetch conversations',
            }));
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [fetchConversationsInternal]);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        const token = await getToken();
        if (!token) return;

        setState((prev) => ({ ...prev, messagesLoading: true, error: null }));

        try {
            const response = await fetch(
                `${API_URL}/chat/conversations/${conversationId}/messages`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch messages');

            const messages = await response.json();
            setState((prev) => ({ ...prev, messages, messagesLoading: false }));

            // Join conversation room via socket and mark delivered
            socketRef.current?.emit('join_conversation', conversationId);
            socketRef.current?.emit('mark_delivered', { conversationId });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: 'Failed to fetch messages',
                messagesLoading: false,
            }));
        }
    }, []);

    // Fetch available chat partners — returns true on success, false on failure
    const fetchPartners = useCallback(async (): Promise<boolean> => {
        const token = await getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${API_URL}/chat/partners`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                console.error('fetchPartners failed:', response.status);
                return false;
            }

            const partners = await response.json();
            setState((prev) => ({ ...prev, partners }));
            return true;
        } catch (error) {
            console.error('Failed to fetch partners:', error);
            return false;
        }
    }, []);

    // Create a new conversation
    const createConversation = useCallback(
        async (data: {
            type: ConversationType;
            recipientId?: string;
            title?: string;
            context?: string;
        }) => {
            const token = await getToken();
            if (!token) return null;

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await fetch(`${API_URL}/chat/conversations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) throw new Error('Failed to create conversation');

                const conversation = await response.json();
                setState((prev) => ({
                    ...prev,
                    conversations: [conversation, ...prev.conversations],
                    currentConversation: conversation,
                    isLoading: false,
                }));

                // Join new conversation room
                socketRef.current?.emit('join_conversation', conversation.id);

                return conversation;
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    error: 'Failed to create conversation',
                    isLoading: false,
                }));
                return null;
            }
        },
        []
    );

    // Send a message (user-to-user) via socket with optimistic update
    const sendMessage = useCallback(
        async (content: string, attachmentUrl?: string) => {
            const conv = currentConvRef.current;
            if (!conv || !socketRef.current) return;

            const userId = getCurrentUserId();
            const tempId = `temp-${Date.now()}`;

            // Optimistic message
            if (userId) {
                const optimistic: Partial<Message> = {
                    id: tempId,
                    conversationId: conv.id,
                    senderId: userId,
                    content,
                    status: 'sent' as any,
                    createdAt: new Date().toISOString() as any,
                };
                setState((prev) => ({
                    ...prev,
                    messages: [...prev.messages, optimistic as Message],
                }));
            }

            socketRef.current.emit(
                'send_message',
                {
                    conversationId: conv.id,
                    content,
                    attachmentUrl,
                },
                (ack: { success?: boolean; error?: string; message?: Message }) => {
                    if (ack?.error) {
                        // Remove optimistic message on failure
                        setState((prev) => ({
                            ...prev,
                            messages: prev.messages.filter((m) => m.id !== tempId),
                        }));
                    }
                    // On success, the new_message event will replace the optimistic msg
                }
            );
        },
        []
    );

    // Send a message to AI
    const sendAIMessage = useCallback(async (content: string) => {
        const conv = currentConvRef.current;
        if (!conv || !socketRef.current) return;

        socketRef.current.emit('send_ai_message', {
            conversationId: conv.id,
            content,
        });
    }, []);

    // Send typing indicator (throttled)
    const sendTyping = useCallback((isTyping: boolean) => {
        const conv = currentConvRef.current;
        if (!conv || !socketRef.current) return;

        if (isTyping) {
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                socketRef.current.emit('typing', {
                    conversationId: conv.id,
                    isTyping: true,
                });
            }

            // Reset silence timer
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }
            typingTimerRef.current = setTimeout(() => {
                isTypingRef.current = false;
                socketRef.current?.emit('typing', {
                    conversationId: conv.id,
                    isTyping: false,
                });
            }, 2500);
        } else {
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
                typingTimerRef.current = null;
            }
            if (isTypingRef.current) {
                isTypingRef.current = false;
                socketRef.current.emit('typing', {
                    conversationId: conv.id,
                    isTyping: false,
                });
            }
        }
    }, []);

    // Select a conversation
    const selectConversation = useCallback(
        (conversation: Conversation | null) => {
            const prev = currentConvRef.current;
            if (prev) {
                socketRef.current?.emit('leave_conversation', prev.id);
            }

            setState((s) => ({
                ...s,
                currentConversation: conversation,
                messages: [],
                typingUsers: new Map(),
                aiTyping: false,
            }));

            if (conversation) {
                fetchMessages(conversation.id);
            }
        },
        [fetchMessages]
    );

    // Mark conversation as read
    const markAsRead = useCallback((conversationId: string) => {
        socketRef.current?.emit('mark_read', conversationId);
    }, []);

    // Upload a file attachment
    const uploadAttachment = useCallback(
        async (file: File, conversationId: string): Promise<string | null> => {
            const token = await getToken();
            if (!token) return null;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(
                    `${API_URL}/chat/attachments?conversationId=${conversationId}`,
                    {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                    }
                );

                if (!response.ok) return null;

                const data = await response.json();
                return data.url || null;
            } catch {
                return null;
            }
        },
        []
    );

    return {
        ...state,
        fetchConversations,
        fetchMessages,
        fetchPartners,
        createConversation,
        sendMessage,
        sendAIMessage,
        sendTyping,
        selectConversation,
        markAsRead,
        uploadAttachment,
    };
}
