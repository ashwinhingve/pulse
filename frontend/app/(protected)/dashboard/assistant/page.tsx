'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Stethoscope,
    Send,
    Shield,
    AlertTriangle,
    Loader2,
    Bot,
    User,
    RefreshCw,
    Sparkles,
    Lock,
    Brain,
    ShieldCheck,
    Zap,
} from 'lucide-react';
import {
    useAuthStore,
    UserRole,
    ROLE_DISPLAY_NAMES,
} from '@/lib/store/auth';
import { getStoredSession, getAccessToken } from '@/lib/mobile-auth';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isAnonymized?: boolean;
}

// Role-specific quick prompts
const getQuickPrompts = (role: UserRole) => {
    if (role === UserRole.ARMY_MEDICAL_OFFICER) {
        return [
            'What is the TCCC protocol for hemorrhage control?',
            'How do I assess a patient with suspected TBI?',
            'What are the signs of tension pneumothorax?',
            'Field treatment for blast injuries?',
        ];
    }
    if (role === UserRole.PUBLIC_MEDICAL_OFFICIAL) {
        return [
            'Mass casualty triage protocols?',
            'Disease outbreak response procedures?',
            'Community health assessment guidelines?',
            'Emergency coordination protocols?',
        ];
    }
    return [
        'What are the signs of sepsis?',
        'How to assess patient vital signs?',
        'Emergency response protocols?',
        'Medical documentation best practices?',
    ];
};

export default function AssistantPage() {
    const router = useRouter();
    const { user, accessToken } = useAuthStore();
    const [mobileUser, setMobileUser] = useState<any>(null);

    useEffect(() => {
        const session = getStoredSession();
        if (session?.user) {
            setMobileUser(session.user);
        }
    }, []);

    const userRole = (user?.role || mobileUser?.role) as UserRole;
    const token = accessToken || getAccessToken();
    const isArmyOfficer = userRole === UserRole.ARMY_MEDICAL_OFFICER;
    const isPublicOfficial = userRole === UserRole.PUBLIC_MEDICAL_OFFICIAL;

    const quickPrompts = getQuickPrompts(userRole);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: `Hello${user?.fullName ? `, ${user.fullName}` : ''}! I'm your AI Medical Assistant, powered by Gemini.

I can help you with:
${isArmyOfficer ? `
• **TCCC protocols** and field medical procedures
• **Combat casualty care** guidelines
• **Tactical evacuation** planning
• **Field triage** decision support
` : isPublicOfficial ? `
• **Public health protocols** and guidelines
• **Mass casualty** response planning
• **Disease outbreak** procedures
• **Inter-agency coordination** support
` : `
• **Clinical protocols** and guidelines
• **Symptom assessment** guidance
• **Medical procedure** references
• **Treatment considerations**
`}
How can I assist you today?

**Important:** All patient data is automatically anonymized before processing. I provide decision support only - always consult qualified medical personnel for clinical decisions.`,
            timestamp: new Date(),
            isAnonymized: true,
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageText = text || input;
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/ai/query-protocol`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ query: messageText }),
            });

            let assistantContent: string;

            if (response.ok) {
                const data = await response.json();
                assistantContent = `${data.protocol}\n\n📚 **References:** ${data.references?.join(', ') || 'Military Medical Guidelines'}\n\n⚠️ ${data.disclaimer}`;
            } else {
                assistantContent = generateMockResponse(messageText, userRole);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
                isAnonymized: true,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateMockResponse(messageText, userRole),
                timestamp: new Date(),
                isAnonymized: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateMockResponse = (query: string, role: UserRole): string => {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('tccc') || lowerQuery.includes('hemorrhage')) {
            return `## TCCC Hemorrhage Control Protocol

### 1. Massive Hemorrhage Control
- Apply tourniquet **2-3 inches above wound**
- Use Combat Application Tourniquet (CAT)
- Note time of application
- If bleeding continues, apply second tourniquet

### 2. Direct Pressure
- For wounds not amenable to tourniquet
- Pack wound with hemostatic gauze
- Apply direct pressure for **3 minutes minimum**

### 3. Reassess
- Check for additional wounds
- Monitor vital signs
- Document interventions

📚 **References:** TCCC Guidelines, FM 4-02

⚠️ *AI-generated guidance. Data anonymized. Always follow official military medical protocols and consult qualified personnel.*`;
        }

        if (lowerQuery.includes('tbi') || lowerQuery.includes('head')) {
            return `## TBI Assessment Protocol

### Initial Assessment
- Assess level of consciousness (AVPU/GCS)
- Check pupil response
- Evaluate motor function

### Warning Signs
- Loss of consciousness
- Amnesia
- Altered mental status
- Unequal pupils
- Clear fluid from ears/nose

### Management
- Maintain airway
- Cervical spine precautions
- Monitor closely
- Evacuate if signs worsen

📚 **References:** TCCC Guidelines, Brain Trauma Foundation

⚠️ *AI-generated guidance. Data anonymized. Always follow official military medical protocols and consult qualified personnel.*`;
        }

        if (lowerQuery.includes('mass casualty') || lowerQuery.includes('triage')) {
            return `## Mass Casualty Triage Protocol

### START Triage System
1. **Walking Wounded (Green)** - Minor injuries, can wait
2. **Immediate (Red)** - Life-threatening, immediate care needed
3. **Delayed (Yellow)** - Serious but can wait 4-6 hours
4. **Expectant (Black)** - Unlikely to survive given resources

### Initial Actions
- Establish triage area
- Assign triage officer
- Set up treatment areas by priority
- Coordinate with transport

### Documentation
- Tag all patients
- Track patient flow
- Report to incident command

📚 **References:** SALT Triage, START Triage System

⚠️ *AI-generated guidance. Data anonymized. Always follow official protocols and consult qualified personnel.*`;
        }

        return `## Response to: "${query.slice(0, 50)}..."

### Assessment Considerations
Based on your query, here are key considerations:

1. **Initial Assessment**
   - Evaluate the patient's overall condition
   - Check vital signs
   - Document findings

2. **Protocol Reference**
   - Reference applicable clinical guidelines
   - Consider environmental factors
   - Coordinate with available medical assets

3. **Documentation**
   - Record all interventions
   - Note times and responses
   - Prepare for handoff

### Next Steps
For specific protocols, please consult your unit's standing medical orders or contact medical command.

📚 **References:** Military Medical Guidelines, FM 4-02

⚠️ *AI-generated guidance. Data anonymized. Always follow official protocols and consult qualified personnel.*`;
    };

    const handleReset = () => {
        setMessages([
            {
                id: '0',
                role: 'assistant',
                content: `Conversation reset. How can I assist you today?

**Remember:** All patient data is automatically anonymized before processing. I provide decision support only.`,
                timestamp: new Date(),
                isAnonymized: true,
            },
        ]);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-background dark:from-purple-950/20 dark:to-background flex flex-col">
            {/* Header with distinct AI branding */}
            <header className="glass border-b border-purple-200 dark:border-purple-900/50 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <Bot size={22} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                                AI Assistant
                                <span className="text-xs font-normal px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-1">
                                    <Sparkles size={10} />
                                    Gemini
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Medical Decision Support
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full text-muted-foreground"
                            title="Reset conversation"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                            <ShieldCheck size={12} />
                            <span className="hidden sm:inline">Anonymized</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
                {/* AI Distinction Banner */}
                <div className="p-3 border-b border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300">
                            <Brain size={14} />
                            <span className="font-medium">AI-Powered</span>
                        </div>
                        <div className="w-px h-4 bg-purple-300 dark:bg-purple-700" />
                        <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300">
                            <Lock size={14} />
                            <span>Data Protected</span>
                        </div>
                        <div className="w-px h-4 bg-purple-300 dark:bg-purple-700" />
                        <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300">
                            <Zap size={14} />
                            <span>Real-time</span>
                        </div>
                    </div>
                </div>

                {/* Demo Banner */}
                <div className="p-3 border-b border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            <strong>DEMO MODE</strong> - AI provides decision support only, not medical diagnoses. Patient data is automatically anonymized. Always consult qualified medical personnel.
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    message.role === 'assistant'
                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-primary/10 text-primary'
                                }`}>
                                    {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <div
                                        className={`p-4 rounded-2xl ${
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                                : 'bg-card text-foreground border-2 border-purple-200 dark:border-purple-900/50 rounded-bl-md shadow-sm'
                                        }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                                            {message.content.split('\n').map((line, i) => {
                                                // Simple markdown-like rendering
                                                if (line.startsWith('## ')) {
                                                    return <h3 key={i} className="text-base font-bold mt-2 mb-1">{line.replace('## ', '')}</h3>;
                                                }
                                                if (line.startsWith('### ')) {
                                                    return <h4 key={i} className="text-sm font-semibold mt-2 mb-1">{line.replace('### ', '')}</h4>;
                                                }
                                                if (line.startsWith('- ')) {
                                                    return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                                                }
                                                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                                                    return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d\. /, '')}</li>;
                                                }
                                                return <p key={i} className={line ? '' : 'h-2'}>{line}</p>;
                                            })}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 mt-1 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                        {message.role === 'assistant' && message.isAnonymized && (
                                            <span className="flex items-center gap-1 text-2xs text-purple-600 dark:text-purple-400">
                                                <ShieldCheck size={10} />
                                                Anonymized
                                            </span>
                                        )}
                                        <span className="text-2xs text-muted-foreground">
                                            {formatTime(message.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20">
                                    <Bot size={18} />
                                </div>
                                <div className="p-4 rounded-2xl bg-card border-2 border-purple-200 dark:border-purple-900/50 rounded-bl-md">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin text-purple-600" size={16} />
                                        <span className="text-sm text-muted-foreground">Analyzing (data anonymized)...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length === 1 && (
                    <div className="px-4 pb-4">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Zap size={12} />
                            Quick prompts:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(prompt)}
                                    className="px-3 py-2 bg-card border border-purple-200 dark:border-purple-900/50 rounded-lg text-sm text-foreground hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-purple-200 dark:border-purple-900/50 bg-card">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about protocols, symptoms, or procedures..."
                            className="flex-1 px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-background text-foreground focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-muted disabled:to-muted text-white rounded-xl transition-colors shadow-lg shadow-purple-500/20"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <p className="text-2xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                        <ShieldCheck size={10} className="text-purple-500" />
                        Patient data is automatically anonymized before AI processing
                    </p>
                </div>
            </main>
        </div>
    );
}
