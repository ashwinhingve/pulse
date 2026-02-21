'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, X, Send, Loader2, ShieldCheck,
    Wind, Droplets, Soup, Microscope, Heart, Activity,
    Bug, Shield, BookOpen, Stethoscope,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { getAccessToken, getStoredSession } from '@/lib/mobile-auth';
import { useSession } from 'next-auth/react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EducationArticle {
    id: string;
    title: string;
    category: string;
    icon: string;
    summary: string;
    content: string;
}

// ─── Icon mapping from FA classes to Lucide components ───────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
    'fa-head-side-mask': Wind,
    'fa-lungs': Activity,
    'fa-droplet-slash': Droplets,
    'fa-stomach': Soup,
    'fa-disease': Microscope,
    'fa-heart-circle-check': Heart,
    'fa-heart-circle-bolt': Activity,
    'fa-microbe': Bug,
    'fa-shield-virus': Shield,
    'fa-microchip': Stethoscope,
    'fa-stethoscope': Stethoscope,
    'fa-university': BookOpen,
};

function ArticleIcon({ icon, size = 18, className }: { icon: string; size?: number; className?: string }) {
    const Icon = ICON_MAP[icon] ?? BookOpen;
    return <Icon size={size} className={className} />;
}

// ─── Article Database (AIIMS Antibiotic Policy) ──────────────────────────────

const ARTICLES: EducationArticle[] = [
    // SECTION 1: RESPIRATORY
    {
        id: '1.1.1',
        title: 'ABRS: Acute Bacterial Rhinosinusitis',
        category: 'Clinical',
        icon: 'fa-head-side-mask',
        summary: 'Criteria for differentiating bacterial vs viral rhinosinusitis.',
        content:
            '### When to Suspect\nABRS is diagnosed by any one of 3 clinical presentations:\n- **Persistent Symptoms**: Lasting ≥10 days without any evidence of clinical improvement;\n- **Severe Symptoms**: Signs of high fever [≥39˚C (102˚F)] and purulent nasal discharge or facial pain lasting for at least 3–4 consecutive days at the beginning of illness; or\n- **Double Sickening**: Worsening symptoms or signs characterized by the new onset of fever, headache, or increase in nasal discharge following a typical viral upper respiratory infection that lasted 5–6 days and were initially improving.\n\n### Confirmation\nDiagnosis is mainly clinical. X ray PNS or CT scan is not recommended for acute disease.\n\n### Etiology\nS. pneumoniae, H. influenzae and Moraxella catarrhalis\n\n### Empiric Treatment (Outpatient)\nPreferred: Amoxicillin-clavulanate Dose: 625mg/tab, 1 tab TDS for 5-7 days in adults.\nAlternative: Tab Doxycycline 100 mg BD for 7 days Or Azithromycin 500 mg OD for 5 days.',
    },
    {
        id: '1.2',
        title: 'Community Acquired Pneumonia (CAP)',
        category: 'Clinical',
        icon: 'fa-lungs',
        summary: 'Clinical presentation, CURB-65 assessment and management protocols.',
        content:
            '### When to Suspect\nCommunity acquired pneumonia should be suspected in patient presenting with fever, cough with expectoration, shortness of breath and bronchial breath sounds or crepitations on auscultation.\n\n### How to Confirm\n- Chest X-Ray: presence of lobar consolidation/ interstitial infiltrates and/or cavitations.\n- Confirmation of diagnosis: gram staining and culture of sputum sample.\n\n### Severity Assessment (CURB-65)\nA CURB-65 score of ≥ 2 requires inpatient care. One point each for:\n- Confusion\n- BUN > 20mg/dl\n- Respiratory rate > 30/min\n- SBP < 90mm of Hg or DBP < 60 mm of Hg\n- Age > 65 years\n\n### Empirical Treatment\nInpatient (CURB-65 ≥ 2): [Inj. Ceftriaxone 1 g IV BD or Inj. Amoxicillin-clavulanic acid 1.2 g IV TDS] PLUS Azithromycin 500 mg (IV/PO) OD for 5 days.',
    },
    {
        id: '1.4',
        title: 'Empyema Thoracis Protocol',
        category: 'Clinical',
        icon: 'fa-droplet-slash',
        summary: 'Diagnosis and management of pleural space collections.',
        content:
            '### When to Suspect\nFailure of a community or healthcare associated pneumonia to respond to antibiotic therapy.\n\n### How to Confirm\n- CXR (PA view): at least 175ml required.\n- USG: Complex septated or echogenic effusions.\n- CT Scan: Split Pleura sign.\n- Pleural Fluid: pH < 7.2, raised LDH, low glucose.\n\n### Principles of Management\n- Image guided pleural drain must be put for all patients; large bore catheters preferred.\n- Cover anaerobes empirically: [Amoxicillin-Clavulanate 1.2g IV TDS OR Ceftriaxone 1g IV 12th hourly] plus [clindamycin 600mg IV TDS OR metronidazole 500mg IV QID].',
    },
    // SECTION 2: GASTROINTESTINAL
    {
        id: '2.1',
        title: 'Gastroenteritis & CDAD',
        category: 'Clinical',
        icon: 'fa-stomach',
        summary: 'Management of acute watery, bloody, and antibiotic-associated diarrhea.',
        content:
            '### Classification\n- Acute (<14 days) watery or bloody diarrhea.\n- Persistent (14-28 days).\n- Chronic (>28 days).\n\n### Clostridium Difficile (CDAD)\nSuspect severe if TLC > 15,000 cells/ml, Serum creatinine > 1.5mg/dl. Treatment: Cap/Tab Vancomycin 125-250 mg QID for 10 days.\n\n### Bloody Diarrhea Management\nPreferred: Tab Ciprofloxacin 500 BD x 3 days. Alternative: Azithromycin 500mg OD x 3 days.',
    },
    {
        id: '2.2',
        title: 'Liver Abscess Diagnostic Pathway',
        category: 'Imaging',
        icon: 'fa-disease',
        summary: 'Pyogenic vs Amoebic liver abscess identification.',
        content:
            '### Clinical Presentation\nFever, RUQ tenderness, hepatomegaly, and leukocytosis with raised liver enzymes.\n\n### Imaging Sensitivity\n- USG: Variable echogenic lesion (86-90%).\n- CT: Hypodense lesion (>95%).\n\n### Etiology & Treatment\n- Pyogenic: GNB (E.coli, Klebsiella). Treat with Ceftriaxone 1g IV BD + Metronidazole 500mg IV TDS.\n- Amoebic: E. histolytica (72% serology positive). Metronidazole 750mg IV TDS for 7-10 days.',
    },
    // SECTION 5: CARDIOVASCULAR
    {
        id: '5.1',
        title: 'Native Valve Endocarditis',
        category: 'Criteria',
        icon: 'fa-heart-circle-check',
        summary: 'Modified Duke Criteria and empiric management for endocarditis.',
        content:
            '### When to Suspect\nUnexplained fever, night sweats, or signs of systemic illness with/without valvular disease.\n\n### Modified Dukes Criteria\nDefinitive IE requires:\n- 2 Major criteria OR\n- 1 Major + 3 Minor OR\n- 5 Minor criteria.\n\n### Empiric Logic (Subacute)\nCeftriaxone 2gm iv OD plus Gentamicin 80 mg TDS. Total duration 4-6 weeks.',
    },
    {
        id: '5.2',
        title: 'Prosthetic Valve Endocarditis (PVE)',
        category: 'Criteria',
        icon: 'fa-heart-circle-bolt',
        summary: 'Clinical classification and management of valve replacement infections.',
        content:
            '### Classification\n- Early-onset (within 60 days): Healthcare-acquired (S. aureus commonest).\n- Intermediate-onset (60-365 days): Coagulase-negative Staphylococcus (CoNS).\n- Late-onset (>1 year): Resembles native valve endocarditis.\n\n### Empiric Management\nCeftriaxone 2gm iv OD plus Gentamicin 80 mg TDS plus Vancomycin 1g BD plus Rifampicin 300mg TDS. Rifampicin to be added after 3 days.',
    },
    // SECTION 7: BSI & FEBRILE
    {
        id: '7.2.3',
        title: 'BSI - Staphylococcus aureus',
        category: 'Clinical',
        icon: 'fa-microbe',
        summary: 'Management protocols for MRSA and MSSA bloodstream infections.',
        content:
            '### MRSA Treatment\nPreferred: Inj. Vancomycin (15 mg/kg IV q8–12h) Or Inj. Teicoplanin (400mg IV every 12h for 3 doses followed by 400mg IV q24h).\n\n### MSSA Treatment\nPreferred: Cefazolin 2gm iv q8h or Cloxacillin 2gm IV q4h.\n\n### Remarks\nCatheter removal is essential. Echo to rule out IE is desirable. Beta-lactams are preferred over Vancomycin for MSSA.',
    },
    {
        id: 'penicillin_allergy',
        title: 'Penicillin Allergy Management',
        category: 'General',
        icon: 'fa-shield-virus',
        summary: 'Cross-reactivity data and skin testing protocols.',
        content:
            '### Key Data\n- Most patients reporting allergy are not truly allergic.\n- Cross-reactivity with 1st/2nd gen cephalosporins is low (~2%), and even lower for 3rd/4th gen.\n\n### Intradermal Testing\n0.02-0.04 mL injection at volar forearm. Positive if bleb increases by 3mm.',
    },
];

const CATEGORIES = ['All', 'Clinical', 'Criteria', 'Laboratory', 'Imaging', 'General'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ─── Formatted Content Renderer ──────────────────────────────────────────────

const FormattedClinicalData: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
            elements.push(
                <h4
                    key={idx}
                    className="font-bold text-slate-900 dark:text-white mt-4 mb-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-1.5"
                >
                    {trimmed.replace(/^###\s*/, '')}
                </h4>,
            );
        } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) {
            elements.push(
                <div
                    key={idx}
                    className="flex gap-2 items-start py-1.5 px-1.5 bg-white dark:bg-slate-950/20 rounded-xl my-0.5"
                >
                    <div className="w-1 h-1 bg-primary rounded-full mt-1.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {trimmed.replace(/^[*\-\d.\s]+/, '')}
                    </p>
                </div>,
            );
        } else if (trimmed !== '') {
            const parts = trimmed.split(/(\*\*.*?\*\*)/g);
            elements.push(
                <p key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed my-2">
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <span
                                    key={pIdx}
                                    className="font-bold text-slate-900 dark:text-white px-0.5 bg-primary/10 rounded"
                                >
                                    {part.slice(2, -2)}
                                </span>
                            );
                        }
                        return part;
                    })}
                </p>,
            );
        }
    });

    return <div className="animate-fade-in">{elements}</div>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HealthEducationPage() {
    const router = useRouter();
    const { user, accessToken } = useAuthStore();
    const { data: nextAuthSession } = useSession();

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chatMessages, loadingChat]);

    const filteredArticles = useMemo(() => {
        const query = search.toLowerCase().trim();
        return ARTICLES.filter(a => {
            const matchesSearch =
                query === '' ||
                a.title.toLowerCase().includes(query) ||
                a.summary.toLowerCase().includes(query) ||
                a.content.toLowerCase().includes(query) ||
                a.id.toLowerCase().includes(query);
            const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [search, selectedCategory]);

    const getToken = async (): Promise<string | null> => {
        if (accessToken) return accessToken;
        const mobileToken = getAccessToken();
        if (mobileToken) return mobileToken;
        if ((nextAuthSession as any)?.accessToken) return (nextAuthSession as any).accessToken;
        try {
            const { getSession } = await import('next-auth/react');
            const freshSession = await getSession();
            if ((freshSession as any)?.accessToken) return (freshSession as any).accessToken;
        } catch { /* ignore */ }
        return null;
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setLoadingChat(true);

        try {
            const token = await getToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/ai/query-protocol`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query: userMsg }),
            });

            let aiText: string;
            if (res.ok) {
                const data = await res.json();
                aiText = data.protocol || data.response || JSON.stringify(data);
            } else {
                // Fallback: search guidelines endpoint
                const gRes = await fetch(`${API_URL}/ai/guidelines/search?q=${encodeURIComponent(userMsg)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (gRes.ok) {
                    const gData = await gRes.json();
                    if (gData.length > 0) {
                        const top = gData[0];
                        aiText = `## ${top.title}\n\n${top.content}`;
                    } else {
                        aiText = `No specific guidelines found for "${userMsg}". Try searching the article index above.`;
                    }
                } else {
                    aiText = 'Clinical logic engine connection failed. Please ensure the AI service is online.';
                }
            }

            setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        } catch {
            setChatMessages(prev => [
                ...prev,
                { role: 'ai', text: 'Error: Clinical logic engine connection failed.' },
            ]);
        } finally {
            setLoadingChat(false);
        }
    };

    const isSearchActive = search.trim().length > 0;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 pb-24 space-y-4 sm:space-y-6 animate-fade-in">
                {/* Header */}
                <div className="bg-[#0f766e] dark:bg-slate-950 rounded-b-none sm:rounded-b-[2rem] rounded-t-none -mx-4 px-6 pt-6 pb-6 text-white shadow-xl relative overflow-hidden transition-colors">
                    <div className="relative z-10 space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-100/70 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>

                        <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                            AIIMS Antibiotic Policy
                        </h1>
                        <p className="text-xs text-emerald-100/60 font-medium">
                            Clinical reference library for infectious disease management
                        </p>

                        {/* Search */}
                        <div className="relative group">
                            <Search
                                size={16}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/50 group-focus-within:text-white transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Search (e.g. allergy, pneumonia, 5.1)..."
                                className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/10 border border-white/20 shadow-inner focus:bg-white/20 outline-none transition-all placeholder:text-emerald-100/40 text-sm text-white"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {isSearchActive && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Article List or Detail */}
                {!selectedArticle && (
                    <div className="space-y-6">
                        {isSearchActive ? (
                            /* Search Results */
                            <div className="space-y-4 animate-fade-in">
                                <div className="px-1 flex justify-between items-center">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {filteredArticles.length} results found
                                    </p>
                                </div>
                                <div className="space-y-3 px-1">
                                    {filteredArticles.map(article => (
                                        <button
                                            key={article.id}
                                            onClick={() => setSelectedArticle(article)}
                                            className="w-full glass-card p-5 rounded-2xl hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900 transition-all text-left flex flex-col gap-2 group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded border border-primary/20">
                                                    {article.id}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    {article.category}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight group-hover:text-emerald-600 transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                                                {article.summary}
                                            </p>
                                        </button>
                                    ))}
                                    {filteredArticles.length === 0 && (
                                        <div className="py-12 text-center">
                                            <p className="text-sm text-slate-400">No articles match your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Category Grid */
                            <div className="space-y-4">
                                <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hidden px-1 snap-x snap-mandatory">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                                                selectedCategory === cat
                                                    ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-lg shadow-emerald-600/20'
                                                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
                                    {filteredArticles.map(article => (
                                        <button
                                            key={article.id}
                                            onClick={() => setSelectedArticle(article)}
                                            className="glass-card p-4 rounded-2xl hover:shadow-md transition-all text-left flex items-start gap-4 group"
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#0f766e] group-hover:text-white transition-all shrink-0">
                                                <ArticleIcon icon={article.icon} size={18} />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <span className="text-[7px] font-black uppercase tracking-widest text-[#0f766e] dark:text-emerald-400 mb-0.5 block">
                                                    {article.id} • {article.category}
                                                </span>
                                                <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight group-hover:text-[#0f766e] transition-colors truncate">
                                                    {article.title}
                                                </h3>
                                                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                                                    {article.summary}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Article Detail */}
                {selectedArticle && (
                    <div className="glass-card rounded-[2rem] overflow-hidden shadow-xl animate-slide-up transition-colors">
                        <div className="px-6 pt-6 pb-4 flex items-center">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-[#0f766e] dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
                            >
                                <ArrowLeft size={12} /> Back to Index
                            </button>
                        </div>

                        <div className="px-6 sm:px-10 pb-12 space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                        <ArticleIcon icon={selectedArticle.icon} size={14} />
                                    </div>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-[8px] uppercase tracking-widest">
                                        {selectedArticle.id} • {selectedArticle.category}
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                    {selectedArticle.title}
                                </h2>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border-l-4 border-emerald-600 text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs italic font-medium leading-relaxed">
                                {selectedArticle.summary}
                            </div>

                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <FormattedClinicalData text={selectedArticle.content} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Diagnostic Assistant Chat */}
                {!selectedArticle && !isSearchActive && (
                    <div className="glass-card rounded-[1.5rem] shadow-xl overflow-hidden flex flex-col h-[380px] transition-all">
                        {/* Chat Header */}
                        <div className="bg-slate-900 dark:bg-slate-950 p-4 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                        loadingChat
                                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-105'
                                            : 'bg-[#0f766e]'
                                    }`}
                                >
                                    <Stethoscope size={14} className={loadingChat ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <p className="font-black text-[10px] uppercase tracking-tight leading-none">
                                        Diagnostic Assistant
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1 leading-none">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-soft" />
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                            Logic Live
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-emerald-400">
                                <ShieldCheck size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Anonymized</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={chatScrollRef}
                            className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 scroll-smooth"
                        >
                            {chatMessages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                                    <Stethoscope size={32} className="text-emerald-600 mb-3" />
                                    <p className="text-slate-800 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest">
                                        Logic Query
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-1 font-medium">
                                        Ask about institutional logic or drug doses.
                                    </p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    <div
                                        className={`max-w-[90%] p-3 rounded-2xl shadow-sm text-[11px] ${
                                            msg.role === 'user'
                                                ? 'bg-[#0f766e] text-white rounded-tr-none font-bold'
                                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800'
                                        }`}
                                    >
                                        {msg.role === 'ai' ? (
                                            <FormattedClinicalData text={msg.text} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loadingChat && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                                        <div className="flex gap-1 items-center">
                                            <Loader2 size={12} className="animate-spin text-emerald-500" />
                                            <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                                                Syncing Logic...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Query clinical library..."
                                disabled={loadingChat}
                                className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[11px] font-bold focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white shadow-inner"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || loadingChat}
                                className="w-10 h-10 bg-[#0f766e] text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-[#0d6059] shadow-xl active:scale-95 shrink-0 transition-all"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Credits */}
                {!selectedArticle && (
                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                            Resource Frameworks & References
                        </h3>
                        <div className="p-4 glass-card rounded-2xl flex gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0">
                                <BookOpen size={14} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    Institutional Reference: AIIMS Antibiotic Policy
                                </p>
                                <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                                    This application is a digital reference guide for medical professionals. Always verify
                                    with the official AIIMS New Delhi Antibiotic Policy document and use clinical
                                    judgment.
                                </p>
                            </div>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-6 text-center font-bold uppercase tracking-widest italic opacity-50">
                            PulseLogic Clinical Repository v2.5.0
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
