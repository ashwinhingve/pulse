'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft, Send, AlertTriangle, Loader2, Bot, User,
    RefreshCw, Sparkles, Lock, Brain, ShieldCheck, Zap,
    BookOpen, FileText, Heart, Pill, Stethoscope, Activity,
    Clipboard, Search, Microscope, ChevronRight,
} from 'lucide-react';
import {
    useAuthStore,
    UserRole,
} from '@/lib/store/auth';
import { getStoredSession, getAccessToken } from '@/lib/mobile-auth';

interface GuidelineRef {
    id: string;
    title: string;
    category: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isAnonymized?: boolean;
    guidelines?: GuidelineRef[];
}

const getQuickPrompts = (role: UserRole) => {
    if (role === UserRole.ARMY_MEDICAL_OFFICER) {
        return [
            { icon: <Pill size={14} />, text: 'Treatment for septic shock with suspected MRSA?' },
            { icon: <Heart size={14} />, text: 'Blast injury with open fracture — emergency management?' },
            { icon: <Microscope size={14} />, text: 'Malaria vs Dengue differential diagnosis?' },
            { icon: <Pill size={14} />, text: 'Antibiotic protocol for community acquired pneumonia?' },
        ];
    }
    if (role === UserRole.PUBLIC_MEDICAL_OFFICIAL) {
        return [
            { icon: <Stethoscope size={14} />, text: 'Diabetic foot infection management?' },
            { icon: <Heart size={14} />, text: 'Pediatric pneumonia — when to hospitalize?' },
            { icon: <Pill size={14} />, text: 'UTI management in pregnancy?' },
            { icon: <Microscope size={14} />, text: 'How to treat drug-resistant tuberculosis?' },
        ];
    }
    return [
        { icon: <Search size={14} />, text: 'Differential diagnosis for acute abdominal pain?' },
        { icon: <Pill size={14} />, text: 'Empiric antibiotic therapy for sepsis?' },
        { icon: <Heart size={14} />, text: 'How to manage acute myocardial infarction?' },
        { icon: <Activity size={14} />, text: 'Treatment protocol for status epilepticus?' },
    ];
};

const capabilityCards = [
    { icon: <Brain size={18} />, title: 'Clinical Reasoning', desc: 'Differential diagnosis & symptom analysis', color: 'from-violet-500 to-purple-500' },
    { icon: <Pill size={18} />, title: 'Drug Protocols', desc: 'Dosages, interactions & alternatives', color: 'from-blue-500 to-cyan-500' },
    { icon: <BookOpen size={18} />, title: 'AIIMS Guidelines', desc: 'Evidence-based antibiotic policies', color: 'from-emerald-500 to-teal-500' },
    { icon: <Clipboard size={18} />, title: 'Emergency Protocols', desc: 'Step-by-step critical care', color: 'from-red-500 to-pink-500' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AssistantPage() {
    const router = useRouter();
    const { user, accessToken } = useAuthStore();
    const { data: nextAuthSession } = useSession();
    const [mobileUser, setMobileUser] = useState<any>(null);

    useEffect(() => {
        const session = getStoredSession();
        if (session?.user) setMobileUser(session.user);
    }, []);

    const userRole = (user?.role || mobileUser?.role || nextAuthSession?.user?.role) as UserRole;
    const userName = user?.fullName || nextAuthSession?.user?.name;

    const getToken = async (): Promise<string | null> => {
        if (accessToken) return accessToken;
        const mobileToken = getAccessToken();
        if (mobileToken) return mobileToken;
        if ((nextAuthSession as any)?.accessToken) return (nextAuthSession as any).accessToken;
        try {
            const { getSession } = await import('next-auth/react');
            const s = await getSession();
            return (s as any)?.accessToken ?? null;
        } catch { return null; }
    };

    const quickPrompts = getQuickPrompts(userRole);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSend = async (text?: string) => {
        const messageText = text || input;
        if (!messageText.trim() || isLoading) return;

        const authToken = await getToken();
        if (!authToken) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(), role: 'assistant',
                content: 'Authentication token not available. Please refresh the page and log in again.',
                timestamp: new Date(),
            }]);
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(), role: 'user',
            content: messageText, timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const callApi = async (token: string) =>
                fetch(`${API_URL}/ai/query-protocol`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ query: messageText }),
                });

            let response = await callApi(authToken);

            if (response.status === 401) {
                try {
                    const { getSession } = await import('next-auth/react');
                    const freshSession = await getSession();
                    const freshToken = (freshSession as any)?.accessToken;
                    if (freshToken && freshToken !== authToken) response = await callApi(freshToken);
                } catch {}
            }

            let assistantContent: string;
            let guidelines: GuidelineRef[] = [];

            if (response.ok) {
                const data = await response.json();
                assistantContent = data.protocol;
                if (data.guidelines?.length > 0) guidelines = data.guidelines;
                if (data.references?.length > 0) assistantContent += `\n\n**References:** ${data.references.join(', ')}`;
                assistantContent += `\n\n*${data.disclaimer}*`;
            } else if (response.status === 401) {
                assistantContent = '**Authentication failed.** Your session has expired.\n\nPlease **log out and log back in** to continue.';
            } else {
                try {
                    const gRes = await fetch(`${API_URL}/ai/guidelines/search?q=${encodeURIComponent(messageText)}`, {
                        headers: { 'Authorization': `Bearer ${authToken}` },
                    });
                    if (gRes.ok) {
                        const gData = await gRes.json();
                        if (gData.length > 0) {
                            guidelines = gData.map((g: any) => ({ id: g.id, title: g.title, category: g.category }));
                            const top = gData[0];
                            assistantContent = `## ${top.title}\n\n${top.content}\n\n**Source:** ${top.source}`;
                        } else {
                            assistantContent = `No specific guidelines found for "${messageText}". Try asking about conditions like pneumonia, sepsis, UTI, meningitis, or malaria.`;
                        }
                    } else {
                        assistantContent = generateFallbackResponse(messageText);
                    }
                } catch {
                    assistantContent = generateFallbackResponse(messageText);
                }
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(), role: 'assistant',
                content: assistantContent, timestamp: new Date(),
                isAnonymized: true, guidelines,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(), role: 'assistant',
                content: 'Unable to connect to the AI service. Please ensure the backend is running.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const generateFallbackResponse = (query: string): string =>
        `I'm currently unable to connect to the medical AI model.\n\n**Your query:** "${query.slice(0, 100)}..."\n\nPlease try:\n1. Check that the backend is running\n2. Verify the HuggingFace API key is configured\n3. Try again in 30 seconds (cold start)\n\n*The model may be loading.*`;

    const handleReset = () => {
        setMessages([]);
        inputRef.current?.focus();
    };

    const handleViewGuideline = async (id: string) => {
        try {
            const authToken = await getToken();
            const res = await fetch(`${API_URL}/ai/guidelines/${id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    id: Date.now().toString(), role: 'assistant',
                    content: `## ${data.title}\n**Category:** ${data.category}\n\n${data.content}\n\n**Source:** ${data.source}`,
                    timestamp: new Date(), isAnonymized: true,
                }]);
            }
        } catch { /* silent */ }
    };

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            const renderBold = (str: string) => {
                const parts = str.split(/\*\*(.+?)\*\*/g);
                return parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part);
            };
            const renderItalic = (str: string) => {
                const parts = str.split(/\*(.+?)\*/g);
                return parts.map((part, j) =>
                    j % 2 === 1 ? <em key={j} className="text-muted-foreground">{part}</em> : <span key={j}>{typeof part === 'string' ? renderBold(part) : part}</span>
                );
            };

            if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold mt-3 mb-1 text-foreground">{renderBold(line.replace('## ', ''))}</h3>;
            if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-semibold mt-2 mb-1 text-foreground">{renderBold(line.replace('### ', ''))}</h4>;
            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-foreground/90">{renderItalic(line.replace('- ', ''))}</li>;
            if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal text-foreground/90">{renderItalic(line.replace(/^\d+\.\s/, ''))}</li>;
            if (!line.trim()) return <div key={i} className="h-2" />;
            return <p key={i} className="text-foreground/90">{renderItalic(line)}</p>;
        });
    };

    const isEmptyChat = messages.length === 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="glass border-b border-border sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-foreground" />
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                                <Bot size={20} />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold text-foreground flex items-center gap-2 leading-tight">
                                Medical AI
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/40 text-violet-700 dark:text-violet-300 rounded-full flex items-center gap-1">
                                    <Sparkles size={9} /> BioMistral
                                </span>
                            </h1>
                            <p className="text-[11px] text-muted-foreground truncate">
                                AIIMS Guidelines · Evidence-Based · Encrypted
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {messages.length > 0 && (
                            <button onClick={handleReset} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors" title="New chat">
                                <RefreshCw size={16} />
                            </button>
                        )}
                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full font-medium">
                            <ShieldCheck size={11} /> E2E Encrypted
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col overflow-hidden">
                {/* Chat area */}
                <div className="flex-1 overflow-y-auto">
                    {isEmptyChat ? (
                        /* Empty state — landing */
                        <div className="px-4 py-8 space-y-8 animate-fade-in">
                            {/* Welcome */}
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-violet-500/20">
                                    <Bot size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Hello{userName ? `, ${userName}` : ''}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        How can I help you today?
                                    </p>
                                </div>
                            </div>

                            {/* Capabilities */}
                            <div className="grid grid-cols-2 gap-3">
                                {capabilityCards.map((card, i) => (
                                    <div key={i} className="glass-card p-4 hover:border-primary/30 transition-all group cursor-default">
                                        <div className={`w-9 h-9 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-soft group-hover:scale-105 transition-transform`}>
                                            {card.icon}
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Quick prompts */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                                    <Zap size={12} className="text-amber-500" /> Suggested Questions
                                </p>
                                <div className="space-y-2">
                                    {quickPrompts.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(prompt.text)}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 bg-card border border-border rounded-2xl text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                                        >
                                            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
                                                {prompt.icon}
                                            </div>
                                            <span className="text-sm text-foreground flex-1">{prompt.text}</span>
                                            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                    <strong>Decision Support Only.</strong> AI guidance based on AIIMS Antibiotic Policy. Not a substitute for clinical judgement. Patient data is anonymized.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Messages */
                        <div className="p-4 space-y-5">
                            {messages.map(message => (
                                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                    <div className={`flex gap-2.5 max-w-[88%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                                            message.role === 'assistant'
                                                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/20'
                                                : 'bg-primary text-primary-foreground'
                                        }`}>
                                            {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                        </div>

                                        <div className="flex flex-col gap-1 min-w-0">
                                            {/* Bubble */}
                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-md'
                                                    : 'bg-card text-foreground border border-border rounded-tl-md shadow-sm'
                                            }`}>
                                                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                                    {renderMarkdown(message.content)}
                                                </div>
                                            </div>

                                            {/* Guideline tags */}
                                            {message.guidelines && message.guidelines.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {message.guidelines.map(g => (
                                                        <button
                                                            key={g.id}
                                                            onClick={() => handleViewGuideline(g.id)}
                                                            className="flex items-center gap-1 text-[10px] px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors font-medium"
                                                        >
                                                            <FileText size={10} />
                                                            {g.title.length > 35 ? g.title.slice(0, 35) + '…' : g.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Meta */}
                                            <div className={`flex items-center gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                                {message.role === 'assistant' && message.isAnonymized && (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-violet-500/70">
                                                        <ShieldCheck size={9} /> Encrypted
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground/60">{formatTime(message.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="flex gap-2.5">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/20 mt-1">
                                            <Bot size={16} />
                                        </div>
                                        <div className="px-5 py-4 rounded-2xl bg-card border border-border rounded-tl-md shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground">Analyzing with medical knowledge base…</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask any medical question..."
                                className="w-full pl-4 pr-4 py-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-sm placeholder:text-muted-foreground/60"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="p-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 disabled:from-muted disabled:to-muted disabled:shadow-none text-white rounded-2xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-95"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-2.5 text-[10px] text-muted-foreground/50">
                        <span className="flex items-center gap-1"><Brain size={10} /> BioMistral AI</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><BookOpen size={10} /> AIIMS Guidelines</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Lock size={10} /> End-to-End Encrypted</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
