'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
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
    error: string | null;
    isConnected: boolean;
    typingUsers: Map<string, string>;
    aiTyping: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useChat(options: UseChatOptions = {}) {
    const { data: session } = useSession();
    const socketRef = useRef<Socket | null>(null);
    const [state, setState] = useState<ChatState>({
        conversations: [],
        currentConversation: null,
        messages: [],
        partners: [],
        isLoading: false,
        error: null,
        isConnected: false,
        typingUsers: new Map(),
        aiTyping: false,
    });

    // Connect to WebSocket
    useEffect(() => {
        if (!session?.accessToken || !options.autoConnect) return;

        const socket = io(`${API_URL}/chat`, {
            auth: {
                userId: session.user.id,
                username: session.user.username || session.user.name,
            },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            setState((prev) => ({ ...prev, isConnected: true }));
        });

        socket.on('disconnect', () => {
            setState((prev) => ({ ...prev, isConnected: false }));
        });

        socket.on('new_message', (message: Message) => {
            setState((prev) => ({
                ...prev,
                messages:
                    prev.currentConversation?.id === message.conversationId
                        ? [...prev.messages, message]
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

        socket.on('user_typing', (data: { userId: string; username: string; conversationId: string; isTyping: boolean }) => {
            setState((prev) => {
                const newTypingUsers = new Map(prev.typingUsers);
                if (data.isTyping) {
                    newTypingUsers.set(data.userId, data.username);
                } else {
                    newTypingUsers.delete(data.userId);
                }
                return { ...prev, typingUsers: newTypingUsers };
            });
        });

        socket.on('ai_typing', (data: { conversationId: string; isTyping: boolean }) => {
            setState((prev) => ({ ...prev, aiTyping: data.isTyping }));
        });

        socket.on('user_online', (data: { userId: string }) => {
            setState((prev) => ({
                ...prev,
                partners: prev.partners.map((p) =>
                    p.id === data.userId ? { ...p, isOnline: true } : p
                ),
            }));
        });

        socket.on('user_offline', (data: { userId: string }) => {
            setState((prev) => ({
                ...prev,
                partners: prev.partners.map((p) =>
                    p.id === data.userId ? { ...p, isOnline: false } : p
                ),
            }));
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [session?.accessToken, session?.user.id, session?.user.username, session?.user.name, options.autoConnect]);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        if (!session?.accessToken) return;

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch(`${API_URL}/api/chat/conversations`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch conversations');

            const conversations = await response.json();
            setState((prev) => ({ ...prev, conversations, isLoading: false }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: 'Failed to fetch conversations',
                isLoading: false,
            }));
        }
    }, [session?.accessToken]);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(
        async (conversationId: string) => {
            if (!session?.accessToken) return;

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await fetch(
                    `${API_URL}/api/chat/conversations/${conversationId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );

                if (!response.ok) throw new Error('Failed to fetch messages');

                const messages = await response.json();
                setState((prev) => ({ ...prev, messages, isLoading: false }));

                // Join conversation room via socket
                socketRef.current?.emit('join_conversation', conversationId);
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    error: 'Failed to fetch messages',
                    isLoading: false,
                }));
            }
        },
        [session?.accessToken]
    );

    // Fetch available chat partners
    const fetchPartners = useCallback(async () => {
        if (!session?.accessToken) return;

        try {
            const response = await fetch(`${API_URL}/api/chat/partners`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch partners');

            const partners = await response.json();
            setState((prev) => ({ ...prev, partners }));
        } catch (error) {
            console.error('Failed to fetch partners:', error);
        }
    }, [session?.accessToken]);

    // Create a new conversation
    const createConversation = useCallback(
        async (data: {
            type: ConversationType;
            recipientId?: string;
            title?: string;
            context?: string;
        }) => {
            if (!session?.accessToken) return null;

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await fetch(`${API_URL}/api/chat/conversations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.accessToken}`,
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
        [session?.accessToken]
    );

    // Send a message (user-to-user)
    const sendMessage = useCallback(
        async (content: string) => {
            if (!state.currentConversation || !socketRef.current) return;

            socketRef.current.emit('send_message', {
                conversationId: state.currentConversation.id,
                content,
            });
        },
        [state.currentConversation]
    );

    // Send a message to AI
    const sendAIMessage = useCallback(
        async (content: string) => {
            if (!state.currentConversation || !socketRef.current) return;

            socketRef.current.emit('send_ai_message', {
                conversationId: state.currentConversation.id,
                content,
            });
        },
        [state.currentConversation]
    );

    // Send typing indicator
    const sendTyping = useCallback(
        (isTyping: boolean) => {
            if (!state.currentConversation || !socketRef.current) return;

            socketRef.current.emit('typing', {
                conversationId: state.currentConversation.id,
                isTyping,
            });
        },
        [state.currentConversation]
    );

    // Select a conversation
    const selectConversation = useCallback(
        (conversation: Conversation | null) => {
            if (state.currentConversation) {
                socketRef.current?.emit('leave_conversation', state.currentConversation.id);
            }

            setState((prev) => ({
                ...prev,
                currentConversation: conversation,
                messages: [],
                typingUsers: new Map(),
                aiTyping: false,
            }));

            if (conversation) {
                fetchMessages(conversation.id);
            }
        },
        [state.currentConversation, fetchMessages]
    );

    // Mark conversation as read
    const markAsRead = useCallback(
        async (conversationId: string) => {
            socketRef.current?.emit('mark_read', conversationId);
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
    };
}
