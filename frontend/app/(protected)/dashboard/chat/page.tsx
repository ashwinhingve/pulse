'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Lock,
    Shield,
    AlertTriangle,
    User,
    Users,
    Plus,
    Search,
    X,
    Loader2,
    CheckCheck,
} from 'lucide-react';
import {
    useAuthStore,
    UserRole,
    ROLE_DISPLAY_NAMES,
    ROLE_PERMISSIONS
} from '@/lib/store/auth';
import { ConversationType } from '@/types';
import { getStoredSession } from '@/lib/mobile-auth';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderRole?: UserRole;
    content: string;
    timestamp: Date;
    encrypted: boolean;
}

interface ChatPartner {
    id: string;
    username: string;
    fullName?: string;
    role: UserRole;
    department?: string;
    isOnline?: boolean;
}

interface Conversation {
    id: string;
    partner: ChatPartner;
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadCount: number;
}

// Mock data based on new roles
const getMockPartners = (currentRole: UserRole): ChatPartner[] => {
    if (currentRole === UserRole.ARMY_MEDICAL_OFFICER) {
        return [
            { id: '1', username: 'dr.williams', fullName: 'Dr. Emily Williams', role: UserRole.PUBLIC_MEDICAL_OFFICIAL, department: 'Regional Health Authority', isOnline: true },
            { id: '2', username: 'dr.patel', fullName: 'Dr. Arun Patel', role: UserRole.PUBLIC_MEDICAL_OFFICIAL, department: 'Emergency Medical Services', isOnline: false },
            { id: '3', username: 'dr.johnson', fullName: 'Dr. Michelle Johnson', role: UserRole.PUBLIC_MEDICAL_OFFICIAL, department: 'Public Health Department', isOnline: true },
        ];
    } else if (currentRole === UserRole.PUBLIC_MEDICAL_OFFICIAL) {
        return [
            { id: '4', username: 'maj.harris', fullName: 'Major Sarah Harris', role: UserRole.ARMY_MEDICAL_OFFICER, department: 'Field Medical Unit Alpha', isOnline: true },
            { id: '5', username: 'cpt.rodriguez', fullName: 'Captain Miguel Rodriguez', role: UserRole.ARMY_MEDICAL_OFFICER, department: 'Combat Support Hospital', isOnline: true },
            { id: '6', username: 'lt.chen', fullName: 'Lieutenant James Chen', role: UserRole.ARMY_MEDICAL_OFFICER, department: 'Medical Battalion HQ', isOnline: false },
        ];
    }
    return [];
};

const getMockConversations = (currentRole: UserRole): Conversation[] => {
    const partners = getMockPartners(currentRole);
    return partners.slice(0, 2).map((partner, i) => ({
        id: `conv-${partner.id}`,
        partner,
        lastMessage: i === 0 ? 'Coordination needed for patient transfer' : 'Case file shared for review',
        lastMessageAt: new Date(Date.now() - i * 3600000),
        unreadCount: i === 0 ? 2 : 0,
    }));
};

export default function ChatPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [mobileUser, setMobileUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [availablePartners, setAvailablePartners] = useState<ChatPartner[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const session = getStoredSession();
        if (session?.user) {
            setMobileUser(session.user);
        }
    }, []);

    const userRole = (user?.role || mobileUser?.role) as UserRole;
    const isArmyOfficer = userRole === UserRole.ARMY_MEDICAL_OFFICER;
    const isPublicOfficial = userRole === UserRole.PUBLIC_MEDICAL_OFFICIAL;

    useEffect(() => {
        // Load mock data based on user role
        if (userRole) {
            setConversations(getMockConversations(userRole));
            setAvailablePartners(getMockPartners(userRole));
        }
    }, [userRole]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
        setShowNewChat(false);
        // Mock messages
        setMessages([
            {
                id: '1',
                senderId: conv.partner.id,
                senderName: conv.partner.fullName || conv.partner.username,
                senderRole: conv.partner.role,
                content: 'Good morning. I wanted to discuss the coordination for patient MC-2024-001.',
                timestamp: new Date(Date.now() - 3600000),
                encrypted: true,
            },
            {
                id: '2',
                senderId: user?.id || 'me',
                senderName: user?.fullName || user?.username || 'You',
                senderRole: userRole,
                content: 'Good morning. Yes, I have the case file ready. The patient needs specialized care.',
                timestamp: new Date(Date.now() - 1800000),
                encrypted: true,
            },
            {
                id: '3',
                senderId: conv.partner.id,
                senderName: conv.partner.fullName || conv.partner.username,
                senderRole: conv.partner.role,
                content: conv.lastMessage || 'Looking forward to collaborating.',
                timestamp: new Date(),
                encrypted: true,
            },
        ]);
    };

    const handleStartNewChat = (partner: ChatPartner) => {
        const existingConv = conversations.find(c => c.partner.id === partner.id);
        if (existingConv) {
            handleSelectConversation(existingConv);
        } else {
            const newConv: Conversation = {
                id: `conv-${partner.id}`,
                partner,
                unreadCount: 0,
            };
            setConversations(prev => [newConv, ...prev]);
            handleSelectConversation(newConv);
        }
        setShowNewChat(false);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const message: Message = {
            id: Date.now().toString(),
            senderId: user?.id || 'me',
            senderName: user?.fullName || user?.username || 'You',
            senderRole: userRole,
            content: newMessage,
            timestamp: new Date(),
            encrypted: true,
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // Update conversation's last message
        setConversations(prev => prev.map(c =>
            c.id === selectedConversation.id
                ? { ...c, lastMessage: newMessage, lastMessageAt: new Date() }
                : c
        ));
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getRoleBadgeColor = (role: UserRole) => {
        if (role === UserRole.ARMY_MEDICAL_OFFICER) {
            return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
        }
        if (role === UserRole.PUBLIC_MEDICAL_OFFICIAL) {
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
        }
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    };

    const filteredPartners = availablePartners.filter(p =>
        (p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="glass border-b border-border sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => selectedConversation ? setSelectedConversation(null) : router.back()}
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
                                {selectedConversation
                                    ? selectedConversation.partner.fullName || selectedConversation.partner.username
                                    : 'User Chat'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {selectedConversation
                                    ? ROLE_DISPLAY_NAMES[selectedConversation.partner.role]
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
                            onClick={() => setShowNewChat(true)}
                            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto flex">
                {/* Conversation List */}
                <div className={`w-full md:w-80 bg-card border-r border-border ${selectedConversation ? 'hidden md:block' : ''}`}>
                    <div className="p-4 border-b border-border">
                        <div className="demo-banner text-xs">
                            <AlertTriangle className="flex-shrink-0" size={14} />
                            <span>DEMO - Messages simulated</span>
                        </div>
                    </div>

                    {conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="text-muted-foreground" size={24} />
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                No conversations yet
                            </p>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="btn-primary text-sm"
                            >
                                Start New Chat
                            </button>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`w-full p-3 rounded-xl flex items-start gap-3 hover:bg-muted transition-colors text-left ${
                                        selectedConversation?.id === conv.id ? 'bg-primary/10' : ''
                                    }`}
                                >
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            conv.partner.role === UserRole.ARMY_MEDICAL_OFFICER
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        }`}>
                                            <User size={18} />
                                        </div>
                                        {conv.partner.isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-foreground truncate text-sm">
                                                {conv.partner.fullName || conv.partner.username}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${getRoleBadgeColor(conv.partner.role)} inline-block px-1.5 py-0.5 rounded mt-0.5`}>
                                            {conv.partner.role === UserRole.ARMY_MEDICAL_OFFICER ? 'Army Officer' : 'Public Official'}
                                        </p>
                                        {conv.lastMessage && (
                                            <p className="text-xs text-muted-foreground truncate mt-1">
                                                {conv.lastMessage}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Messages */}
                {selectedConversation ? (
                    <div className="flex-1 flex flex-col bg-muted/30">
                        {/* Partner Info Banner */}
                        <div className="p-3 bg-card border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        selectedConversation.partner.role === UserRole.ARMY_MEDICAL_OFFICER
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        <User size={16} />
                                    </div>
                                    {selectedConversation.partner.isOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                                    )}
                                </div>
                                <div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(selectedConversation.partner.role)}`}>
                                        {ROLE_DISPLAY_NAMES[selectedConversation.partner.role]}
                                    </span>
                                    {selectedConversation.partner.department && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {selectedConversation.partner.department}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(message => {
                                const isMe = message.senderId === user?.id || message.senderId === 'me';
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                                            {!isMe && (
                                                <div className="flex items-center gap-2 mb-1 ml-1">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {message.senderName}
                                                    </p>
                                                    <span className={`text-2xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(message.senderRole!)}`}>
                                                        {message.senderRole === UserRole.ARMY_MEDICAL_OFFICER ? 'Army' : 'Public'}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className={`p-3 rounded-2xl ${
                                                    isMe
                                                        ? 'bg-primary text-primary-foreground rounded-br-md'
                                                        : 'bg-card text-foreground border border-border rounded-bl-md'
                                                }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                                <Shield size={10} className="text-emerald-500" />
                                                <span className="text-2xs text-muted-foreground">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                                {isMe && <CheckCheck size={12} className="text-primary ml-1" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-border bg-card">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a secure message..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-xl transition-colors"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <p className="text-2xs text-muted-foreground mt-2 text-center">
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
                                onClick={() => setShowNewChat(true)}
                                className="btn-primary text-sm"
                            >
                                <Plus size={16} className="mr-1" />
                                New Chat
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* New Chat Modal */}
            {showNewChat && (
                <div
                    className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowNewChat(false)}
                >
                    <div
                        className="bg-card rounded-2xl shadow-soft-lg w-full max-w-md max-h-[80vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">New Conversation</h2>
                            <button
                                onClick={() => setShowNewChat(false)}
                                className="p-2 hover:bg-muted rounded-full"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or department..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {isArmyOfficer
                                    ? 'Select a Public Medical Official to chat with'
                                    : isPublicOfficial
                                        ? 'Select an Army Medical Officer to chat with'
                                        : 'Select a user to chat with'}
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-[50vh] p-2">
                            {filteredPartners.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No users found
                                    </p>
                                </div>
                            ) : (
                                filteredPartners.map(partner => (
                                    <button
                                        key={partner.id}
                                        onClick={() => handleStartNewChat(partner)}
                                        className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                partner.role === UserRole.ARMY_MEDICAL_OFFICER
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
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
                                            <p className={`text-xs ${getRoleBadgeColor(partner.role)} inline-block px-1.5 py-0.5 rounded mt-0.5`}>
                                                {ROLE_DISPLAY_NAMES[partner.role]}
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
                    </div>
                </div>
            )}
        </div>
    );
}
