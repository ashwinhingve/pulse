'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Lock,
    Shield,
    User,
    Users,
    Plus,
    Search,
    X,
    Loader2,
    Check,
    CheckCheck,
    Paperclip,
    FileImage,
} from 'lucide-react';
import {
    useAuthStore,
    UserRole,
    ROLE_DISPLAY_NAMES,
} from '@/lib/store/auth';
import { getStoredSession } from '@/lib/mobile-auth';
import { useChat } from '@/hooks/useChat';
import { ConversationType } from '@/types';
import Modal from '@/components/ui/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function isImageUrl(url: string): boolean {
    return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
}

function MessageStatusIcon({ status }: { status?: string }) {
    if (status === 'read') {
        return <CheckCheck size={12} className="text-primary ml-1" />;
    }
    if (status === 'delivered') {
        return <CheckCheck size={12} className="text-muted-foreground ml-1" />;
    }
    return <Check size={12} className="text-muted-foreground ml-1" />;
}

export default function ChatPage() {
    const router = useRouter();
    const { user, accessToken } = useAuthStore();
    const [mobileUser, setMobileUser] = useState<any>(null);
    const hasFetchedRef = useRef(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [partnersError, setPartnersError] = useState(false);
    const [partnersLoaded, setPartnersLoaded] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        conversations,
        currentConversation,
        messages,
        partners,
        isLoading,
        messagesLoading,
        isConnected,
        typingUsers,
        aiTyping,
        fetchConversations,
        fetchPartners,
        createConversation,
        sendMessage,
        sendTyping,
        selectConversation,
        markAsRead,
        uploadAttachment,
    } = useChat({ autoConnect: true });

    useEffect(() => {
        const session = getStoredSession();
        if (session?.user) {
            setMobileUser(session.user);
        }
    }, []);

    // Fetch data once token is available (handles Zustand hydration + mobile localStorage)
    useEffect(() => {
        if (hasFetchedRef.current) return;
        const mobileSession = getStoredSession();
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const token = accessToken || mobileSession?.tokens?.accessToken || localToken;
        if (!token) return;
        hasFetchedRef.current = true;
        fetchConversations();
        fetchPartners().then((ok) => {
            setPartnersLoaded(true);
            if (!ok) setPartnersError(true);
        });
    }, [accessToken, fetchConversations, fetchPartners]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const currentUserId = user?.id || mobileUser?.id;
    const userRole = (user?.role || mobileUser?.role) as UserRole;
    const isArmyOfficer = userRole === UserRole.ARMY_MEDICAL_OFFICER;
    const isPublicOfficial = userRole === UserRole.PUBLIC_MEDICAL_OFFICIAL;

    const getRoleBadgeColor = (role: UserRole) => {
        if (role === UserRole.ARMY_MEDICAL_OFFICER) {
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
        }
        if (role === UserRole.PUBLIC_MEDICAL_OFFICIAL) {
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
        }
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    };

    // Extract partner from conversation (participant1 or participant2 depending on who current user is)
    const getPartnerFromConv = useCallback(
        (conv: any) => {
            if (conv.participant1Id === currentUserId) {
                return conv.participant2 || { id: conv.participant2Id, username: 'Unknown' };
            }
            return conv.participant1 || { id: conv.participant1Id, username: 'Unknown' };
        },
        [currentUserId]
    );

    const handleSelectConversation = useCallback(
        (conv: any) => {
            selectConversation(conv);
            setShowNewChat(false);
            markAsRead(conv.id);
        },
        [selectConversation, markAsRead]
    );

    const handleOpenNewChat = useCallback(async () => {
        setSearchTerm('');
        setShowNewChat(true);
        // Re-fetch partners when modal opens (in case previous fetch failed)
        if (partners.length === 0 && !partnersLoaded) {
            const ok = await fetchPartners();
            setPartnersLoaded(true);
            if (!ok) setPartnersError(true);
            else setPartnersError(false);
        }
    }, [partners.length, partnersLoaded, fetchPartners]);

    const handleStartNewChat = async (partner: any) => {
        // Check if conversation already exists
        const existing = conversations.find(
            (c: any) =>
                c.participant1Id === partner.id ||
                c.participant2Id === partner.id
        );
        if (existing) {
            handleSelectConversation(existing);
            setShowNewChat(false);
            return;
        }

        const conv = await createConversation({
            type: ConversationType.USER_TO_USER,
            recipientId: partner.id,
        });

        if (conv) {
            handleSelectConversation(conv);
        }
        setShowNewChat(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingAttachment(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !pendingAttachment) return;
        if (!currentConversation) return;

        const content = newMessage.trim() || (pendingAttachment ? pendingAttachment.name : '');
        setNewMessage('');
        sendTyping(false);

        let attachmentUrl: string | undefined;

        if (pendingAttachment) {
            setUploadingFile(true);
            const url = await uploadAttachment(pendingAttachment, currentConversation.id);
            setUploadingFile(false);
            setPendingAttachment(null);
            if (url) {
                attachmentUrl = url;
            }
        }

        await sendMessage(content, attachmentUrl);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (e.target.value) {
            sendTyping(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: any) => {
        try {
            return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const filteredPartners = partners.filter((p: any) =>
        (p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="glass border-b border-border sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => currentConversation ? selectConversation(null) : router.back()}
                        className="p-2 hover:bg-muted rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                            <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">
                                {currentConversation
                                    ? (() => {
                                          const p = getPartnerFromConv(currentConversation);
                                          return p.fullName || p.username || 'Chat';
                                      })()
                                    : 'User Chat'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {currentConversation
                                    ? ROLE_DISPLAY_NAMES[(getPartnerFromConv(currentConversation) as any)?.role as UserRole] || 'User'
                                    : isArmyOfficer
                                        ? 'Chat with Public Medical Officials'
                                        : isPublicOfficial
                                            ? 'Chat with Army Medical Officers'
                                            : 'Chat with all users'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                            <Lock size={12} />
                            <span className="hidden sm:inline">E2E Encrypted</span>
                        </div>
                        <button
                            onClick={handleOpenNewChat}
                            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Connection status banner */}
            {!isConnected && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <Loader2 size={12} className="animate-spin" />
                    Reconnecting to secure channel...
                </div>
            )}

            <main className="flex-1 max-w-6xl w-full mx-auto flex overflow-hidden">
                {/* Conversation List */}
                <div className={`w-full md:w-80 bg-card border-r border-border flex-shrink-0 overflow-y-auto ${currentConversation ? 'hidden md:block' : ''}`}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="text-muted-foreground" size={24} />
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                No conversations yet
                            </p>
                            <button
                                onClick={handleOpenNewChat}
                                className="btn-primary text-sm"
                            >
                                Start New Chat
                            </button>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {conversations.map((conv: any) => {
                                const partner = getPartnerFromConv(conv);
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`w-full p-3 rounded-xl flex items-start gap-3 hover:bg-muted transition-colors text-left ${
                                            currentConversation?.id === conv.id ? 'bg-primary/10' : ''
                                        }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                partner.role === UserRole.ARMY_MEDICAL_OFFICER
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    : partner.role === UserRole.ADMIN
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            }`}>
                                                <User size={18} />
                                            </div>
                                            {partner.isOnline && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-foreground truncate text-sm">
                                                    {partner.fullName || partner.username || 'Unknown'}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-1">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs inline-block px-1.5 py-0.5 rounded mt-0.5 ${getRoleBadgeColor(partner.role)}`}>
                                                {partner.role === UserRole.ARMY_MEDICAL_OFFICER ? 'Army Officer' : 'Public Official'}
                                            </p>
                                            {conv.metadata?.lastMessagePreview && (
                                                <p className="text-xs text-muted-foreground truncate mt-1">
                                                    {conv.metadata.lastMessagePreview}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Chat Messages */}
                {currentConversation ? (
                    <div className="flex-1 flex flex-col bg-muted/30 min-h-0">
                        {/* Partner Info Banner */}
                        {(() => {
                            const partner = getPartnerFromConv(currentConversation);
                            return (
                                <div className="p-3 bg-card border-b border-border flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                partner.role === UserRole.ARMY_MEDICAL_OFFICER
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    : partner.role === UserRole.ADMIN
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            }`}>
                                                <User size={16} />
                                            </div>
                                            {partner.isOnline && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                                            )}
                                        </div>
                                        <div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(partner.role)}`}>
                                                {ROLE_DISPLAY_NAMES[partner.role as UserRole] || partner.role}
                                            </span>
                                            {partner.department && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {partner.department}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="animate-spin text-primary" size={24} />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                messages.map((message: any) => {
                                    const isMe = message.senderId === currentUserId;
                                    const attachmentUrl = message.metadata?.attachments?.[0];
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                                                {!isMe && (
                                                    <div className="flex items-center gap-2 mb-1 ml-1">
                                                        <p className="text-xs font-medium text-foreground">
                                                            {message.senderUsername || message.sender?.username || message.sender?.fullName || 'User'}
                                                        </p>
                                                    </div>
                                                )}
                                                <div
                                                    className={`p-3 rounded-2xl ${
                                                        isMe
                                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                                            : 'bg-card text-foreground border border-border rounded-bl-md'
                                                    }`}
                                                >
                                                    <p className="text-sm break-words">{message.content}</p>

                                                    {/* Attachment rendering */}
                                                    {attachmentUrl && (
                                                        isImageUrl(attachmentUrl) ? (
                                                            <img
                                                                src={attachmentUrl.startsWith('/') ? `${API_URL.replace('/api', '')}${attachmentUrl}` : attachmentUrl}
                                                                alt="attachment"
                                                                className="max-w-full rounded-xl mt-2 cursor-pointer max-h-48 object-contain"
                                                                onClick={() => setLightboxUrl(attachmentUrl)}
                                                            />
                                                        ) : (
                                                            <a
                                                                href={attachmentUrl.startsWith('/') ? `${API_URL.replace('/api', '')}${attachmentUrl}` : attachmentUrl}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`flex items-center gap-2 mt-2 text-xs underline ${isMe ? 'text-primary-foreground/80' : 'text-primary'}`}
                                                            >
                                                                📄 Download attachment
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                                    <Shield size={10} className="text-emerald-500" />
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatTime(message.createdAt)}
                                                    </span>
                                                    {isMe && <MessageStatusIcon status={message.status} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Typing indicator */}
                            {typingUsers.size > 0 && !aiTyping && (
                                <div className="flex items-end gap-2">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <User size={12} className="text-muted-foreground" />
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3 py-2">
                                        <span className="flex gap-1 items-center h-4">
                                            {[0, 150, 300].map((delay) => (
                                                <span
                                                    key={delay}
                                                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                                                    style={{ animationDelay: `${delay}ms` }}
                                                />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* AI typing indicator */}
                            {aiTyping && (
                                <div className="flex items-end gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <MessageSquare size={12} className="text-indigo-500" />
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3 py-2">
                                        <span className="flex gap-1 items-center h-4">
                                            {[0, 150, 300].map((delay) => (
                                                <span
                                                    key={delay}
                                                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: `${delay}ms` }}
                                                />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Attachment preview */}
                        {pendingAttachment && (
                            <div className="px-4 pb-2 flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                                    <FileImage size={14} className="text-primary" />
                                    <span className="text-xs truncate max-w-32">{pendingAttachment.name}</span>
                                    <button
                                        onClick={() => setPendingAttachment(null)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input bar */}
                        <div className="p-4 border-t border-border bg-card flex-shrink-0">
                            <div className="flex items-center gap-2">
                                {/* File attachment button */}
                                <label className="p-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors rounded-xl hover:bg-muted">
                                    {uploadingFile ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Paperclip size={20} />
                                    )}
                                    <input
                                        type="file"
                                        className="sr-only"
                                        accept="image/*,.pdf"
                                        onChange={handleFileSelect}
                                        disabled={uploadingFile}
                                        ref={fileInputRef}
                                    />
                                </label>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a secure message..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!newMessage.trim() && !pendingAttachment) || uploadingFile}
                                    className="p-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-xl transition-colors"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                Messages are end-to-end encrypted
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center bg-muted/30">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="text-muted-foreground" size={32} />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">Select a conversation</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Or start a new chat with a{' '}
                                {isArmyOfficer ? 'Public Medical Official' : isPublicOfficial ? 'Army Medical Officer' : 'colleague'}
                            </p>
                            <button
                                onClick={handleOpenNewChat}
                                className="btn-primary text-sm"
                            >
                                <Plus size={16} className="mr-1 inline" />
                                New Chat
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* New Chat Modal */}
            <Modal open={showNewChat} onClose={() => setShowNewChat(false)} title="New Conversation" size="md">
                <div className="border-b border-border pb-4 mb-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or department..."
                            className="w-full pl-10 pr-10 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {isArmyOfficer
                            ? 'Chat with Public Medical Officials'
                            : isPublicOfficial
                                ? 'Chat with Army Medical Officers'
                                : `${partners.length} user${partners.length !== 1 ? 's' : ''} available to chat`}
                    </p>
                </div>

                <div className="overflow-y-auto max-h-[50vh] space-y-1">
                    {partnersError ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground mb-3">Failed to load users</p>
                            <button
                                onClick={async () => {
                                    setPartnersError(false);
                                    const ok = await fetchPartners();
                                    if (!ok) setPartnersError(true);
                                }}
                                className="text-xs text-primary underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : !partnersLoaded ? (
                        <div className="p-8 text-center">
                            <Loader2 size={20} className="animate-spin text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Loading users...</p>
                        </div>
                    ) : partners.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground">No users available to chat with</p>
                            <p className="text-xs text-muted-foreground mt-1">Contact your administrator if this seems incorrect</p>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                No users match <span className="font-medium text-foreground">&quot;{searchTerm}&quot;</span>
                            </p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="text-xs text-primary underline"
                            >
                                Clear search to see all {partners.length} user{partners.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    ) : (
                        filteredPartners.map((partner: any) => (
                            <button
                                key={partner.id}
                                onClick={() => handleStartNewChat(partner)}
                                className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-muted transition-colors text-left"
                            >
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        partner.role === UserRole.ARMY_MEDICAL_OFFICER
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : partner.role === UserRole.ADMIN
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        <User size={18} />
                                    </div>
                                    {partner.isOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm">
                                        {partner.fullName || partner.username}
                                    </p>
                                    <p className={`text-xs inline-block px-1.5 py-0.5 rounded mt-0.5 ${getRoleBadgeColor(partner.role)}`}>
                                        {ROLE_DISPLAY_NAMES[partner.role as UserRole] || partner.role}
                                    </p>
                                    {partner.department && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {partner.department}
                                        </p>
                                    )}
                                </div>
                                {partner.isOnline ? (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Online</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Offline</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </Modal>

            {/* Lightbox for image attachments */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setLightboxUrl(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <img
                            src={lightboxUrl.startsWith('/') ? `${API_URL.replace('/api', '')}${lightboxUrl}` : lightboxUrl}
                            alt="attachment"
                            className="max-w-full max-h-[85vh] object-contain rounded-xl"
                        />
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
