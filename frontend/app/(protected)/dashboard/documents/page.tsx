'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, X, FileText, Activity, Droplets, Scan,
    HeartPulse, Search, Download, RefreshCw, Trash2, Eye,
    AlertTriangle, CheckCircle, Clock, ChevronUp, ChevronDown,
    ZoomIn, ZoomOut, RotateCcw, FolderSearch, Loader2, BarChart3,
    Plus, FileX, TrendingUp, Info,
    ScanLine, BrainCircuit, User, Building2, CalendarDays,
    Stethoscope, Shield, Hash, MessageSquare, Timer,
    BadgeAlert, CheckCircle2, XCircle, FileBarChart2,
    Lock, Fingerprint, ChevronRight, Microscope, Star,
    TrendingDown, Zap, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

/* ─────────────────────────── Types ──────────────────────────── */

type DocumentType = 'xray' | 'ecg' | 'blood_report' | 'mri' | 'ct_scan' | 'ultrasound_echo';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type DetailTab = 'overview' | 'analysis' | 'file';

interface KeyMeasurement {
    name: string;
    value: string | number;
    unit?: string;
    normalRange?: string;
    isAbnormal: boolean;
}

interface AIAnalysis {
    summary: string;
    riskLevel: RiskLevel;
    riskIndicators: string[];
    abnormalFindings: string[];
    normalFindings: string[];
    confidenceScore: number;
    keyMeasurements: KeyMeasurement[];
    recommendations: string[];
    rawAnalysis: string;
    model: string;
    analyzedAt: string;
}

interface MedicalDocument {
    id: string;
    documentType: DocumentType;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    patientId?: string;
    caseId?: string;
    reportDate?: string;
    hospitalName?: string;
    doctorName?: string;
    notes?: string;
    aiAnalysis?: AIAnalysis;
    isAnalyzed: boolean;
    isAnalyzing: boolean;
    uploadedBy: string;
    createdAt: string;
    updatedAt?: string;
    accessCount: number;
}

interface UploadForm {
    documentType: DocumentType;
    patientId: string;
    reportDate: string;
    hospitalName: string;
    doctorName: string;
    notes: string;
    analyzeAfterUpload: boolean;
}

/* ─────────────────────────── Constants ──────────────────────── */

const DOC_TYPE_CONFIG: Record<DocumentType, {
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    accentHex: string;
    studyContext: string;
}> = {
    xray: {
        label: 'X-Ray',
        shortLabel: 'X-Ray',
        icon: Scan,
        color: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/25',
        accentHex: '#38bdf8',
        studyContext: 'Radiographic Study',
    },
    ecg: {
        label: 'ECG / EKG',
        shortLabel: 'ECG',
        icon: Activity,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        accentHex: '#34d399',
        studyContext: 'Electrocardiography',
    },
    blood_report: {
        label: 'Blood Report',
        shortLabel: 'Blood',
        icon: Droplets,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/25',
        accentHex: '#fb7185',
        studyContext: 'Laboratory Analysis',
    },
    mri: {
        label: 'MRI',
        shortLabel: 'MRI',
        icon: BrainCircuit,
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/25',
        accentHex: '#a78bfa',
        studyContext: 'Magnetic Resonance Imaging',
    },
    ct_scan: {
        label: 'CT Scan',
        shortLabel: 'CT',
        icon: ScanLine,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/25',
        accentHex: '#fbbf24',
        studyContext: 'Computed Tomography',
    },
    ultrasound_echo: {
        label: 'Ultrasound / Echo',
        shortLabel: 'US/Echo',
        icon: HeartPulse,
        color: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/25',
        accentHex: '#2dd4bf',
        studyContext: 'Ultrasonography',
    },
};

const RISK_CONFIG: Record<RiskLevel, {
    label: string;
    desc: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ElementType;
    hex: string;
    barColor: string;
}> = {
    low: {
        label: 'Low Risk',
        desc: 'Within normal parameters',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/12',
        border: 'border-emerald-500/25',
        icon: CheckCircle2,
        hex: '#10b981',
        barColor: 'bg-emerald-500',
    },
    medium: {
        label: 'Medium Risk',
        desc: 'Requires clinical review',
        color: 'text-amber-400',
        bg: 'bg-amber-500/12',
        border: 'border-amber-500/25',
        icon: AlertTriangle,
        hex: '#f59e0b',
        barColor: 'bg-amber-500',
    },
    high: {
        label: 'High Risk',
        desc: 'Abnormal findings present',
        color: 'text-orange-400',
        bg: 'bg-orange-500/12',
        border: 'border-orange-500/25',
        icon: AlertTriangle,
        hex: '#f97316',
        barColor: 'bg-orange-500',
    },
    critical: {
        label: 'Critical',
        desc: 'Immediate attention required',
        color: 'text-red-400',
        bg: 'bg-red-500/12',
        border: 'border-red-500/25',
        icon: XCircle,
        hex: '#ef4444',
        barColor: 'bg-red-500',
    },
};

const DEFAULT_FORM: UploadForm = {
    documentType: 'xray',
    patientId: '',
    reportDate: '',
    hospitalName: '',
    doctorName: '',
    notes: '',
    analyzeAfterUpload: true,
};

const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.dcm';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/* ─────────────────────────── Helpers ────────────────────────── */

async function getToken(): Promise<string | null> {
    const storeToken = useAuthStore.getState().accessToken;
    if (storeToken) return storeToken;
    try {
        const { getStoredSession } = await import('@/lib/mobile-auth');
        const m = getStoredSession();
        if (m?.tokens?.accessToken) return m.tokens.accessToken;
    } catch {}
    try {
        const { getSession } = await import('next-auth/react');
        const s = await getSession();
        return (s as any)?.accessToken || null;
    } catch {}
    return null;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function formatDateTime(iso?: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function timeAgo(iso?: string | null): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
}

/* ─────────────────────────── UI Atoms ───────────────────────── */

function RiskBadge({ level, size = 'sm' }: { level: RiskLevel; size?: 'xs' | 'sm' | 'md' }) {
    const cfg = RISK_CONFIG[level];
    const Icon = cfg.icon;
    const cls = {
        xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
        sm: 'text-xs px-2.5 py-1 gap-1',
        md: 'text-sm px-3 py-1.5 gap-1.5',
    }[size];
    return (
        <span className={`inline-flex items-center font-semibold rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border} ${cls}`}>
            <Icon size={size === 'md' ? 13 : 9} />
            {cfg.label}
        </span>
    );
}

function ConfidenceRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
    const pct = Math.round(Math.min(1, Math.max(0, score)) * 100);
    const dims = { sm: 52, md: 72, lg: 88 }[size];
    const r = dims / 2 - 7;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = score >= 0.75 ? '#10b981' : score >= 0.5 ? '#f59e0b' : '#ef4444';
    const label = score >= 0.75 ? 'High' : score >= 0.5 ? 'Moderate' : 'Low';
    const fSize = { sm: 11, md: 15, lg: 18 }[size];

    return (
        <div className="flex flex-col items-center gap-1.5">
            <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`}>
                <circle cx={dims / 2} cy={dims / 2} r={r} fill="none"
                    stroke="currentColor" strokeWidth="6" className="text-border/20" />
                <circle cx={dims / 2} cy={dims / 2} r={r} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform={`rotate(-90 ${dims / 2} ${dims / 2})`} />
                <text x={dims / 2} y={dims / 2 + 1} textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fSize} fontWeight="700" fill={color}>
                    {pct}%
                </text>
            </svg>
            <p className="text-[11px] text-muted-foreground font-semibold">{label} confidence</p>
        </div>
    );
}

function SectionBlock({
    icon: Icon, label, count, accent, children,
}: {
    icon: React.ElementType;
    label: string;
    count?: number;
    accent?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className={accent || 'text-muted-foreground'} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</h4>
                {count !== undefined && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground font-semibold">
                        {count}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-border/15 last:border-0">
            <div className="w-7 h-7 rounded-lg bg-muted/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={13} className="text-muted-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-foreground/85 truncate">
                    {value || <span className="text-muted-foreground/35 font-normal italic">Not provided</span>}
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────── Image Viewer ───────────────────── */

function ImageViewer({ src }: { src: string }) {
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setScale(s => Math.min(5, Math.max(0.5, s - e.deltaY * 0.002)));
    };

    const onMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        setPos({ x: dragStart.current.px + e.clientX - dragStart.current.x, y: dragStart.current.py + e.clientY - dragStart.current.y });
    };
    const onMouseUp = () => setDragging(false);

    return (
        <div className="relative w-full h-full bg-black/80 rounded-xl overflow-hidden select-none">
            <div
                className={`w-full h-full flex items-center justify-center overflow-hidden ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src} alt="Medical document"
                    className="max-w-none pointer-events-none"
                    style={{ transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`, transition: dragging ? 'none' : 'transform 0.1s ease' }}
                    draggable={false}
                />
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 rounded-lg p-1 backdrop-blur-sm">
                <button onClick={() => setScale(s => Math.min(5, s + 0.25))} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><ZoomIn size={13} /></button>
                <span className="text-white/50 text-xs w-9 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><ZoomOut size={13} /></button>
                <div className="w-px h-4 bg-white/20 mx-0.5" />
                <button onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }} className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><RotateCcw size={13} /></button>
            </div>
            <p className="absolute bottom-3 left-3 text-white/30 text-[9px] font-medium">Scroll to zoom · Drag to pan</p>
        </div>
    );
}

/* ─────────────────────────── File Viewer ────────────────────── */

function FilePanel({ doc, onDownload }: { doc: MedicalDocument; onDownload: () => void }) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const isImage = doc.mimeType?.startsWith('image/');
    const isPdf = doc.mimeType === 'application/pdf';
    const isDicom = doc.mimeType?.includes('dicom') || doc.originalFileName?.endsWith('.dcm');

    useEffect(() => {
        let url: string | null = null;
        const load = async () => {
            setLoading(true);
            setErr('');
            try {
                const token = await getToken();
                const res = await fetch(`${apiUrl}/documents/${doc.id}/file`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                url = URL.createObjectURL(blob);
                setFileUrl(url);
            } catch (e: any) {
                setErr(e.message || 'Failed to load file');
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [doc.id, apiUrl]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Loader2 size={22} className="text-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Decrypting & loading file…</p>
                <p className="text-xs text-muted-foreground/50">AES-256 decryption in progress</p>
            </div>
        </div>
    );

    if (err) return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-xs">
                <FileX size={36} className="text-muted-foreground/30 mx-auto" />
                <div>
                    <p className="text-sm font-semibold text-foreground">Preview unavailable</p>
                    <p className="text-xs text-muted-foreground mt-1">{err}</p>
                </div>
                <button onClick={onDownload}
                    className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                    <Download size={14} /> Download Instead
                </button>
            </div>
        </div>
    );

    if (isDicom) return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto border border-border/30">
                    <ScanLine size={28} className="text-muted-foreground/50" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">DICOM File</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        DICOM files require a dedicated viewer such as OsiriX, Horos, or RadiAnt DICOM Viewer.
                    </p>
                </div>
                <button onClick={onDownload}
                    className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-soft">
                    <Download size={14} /> Download DICOM File
                </button>
            </div>
        </div>
    );

    if (isImage && fileUrl) return <ImageViewer src={fileUrl} />;

    if (isPdf && fileUrl) return (
        <iframe src={fileUrl} className="w-full flex-1 min-h-0 rounded-xl border border-border/30" title="PDF Viewer" />
    );

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-3">
                <FileText size={36} className="text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                <button onClick={onDownload}
                    className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                    <Download size={14} /> Download File
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────── Overview Panel ─────────────────── */

function OverviewPanel({ doc }: { doc: MedicalDocument }) {
    const cfg = DOC_TYPE_CONFIG[doc.documentType];
    const Icon = cfg.icon;

    return (
        <div className="space-y-4">

            {/* Document identity */}
            <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
                <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(90deg, ${cfg.accentHex}90, ${cfg.accentHex}20)` }}
                />
                <div className={`px-4 py-4 ${cfg.bg}`}>
                    <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
                            <Icon size={20} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-bold uppercase tracking-widest ${cfg.color} mb-1`}>
                                {cfg.studyContext}
                            </p>
                            <p className="text-sm font-semibold text-foreground leading-snug break-all">
                                {doc.originalFileName}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CalendarDays size={11} />
                                    {formatDate(doc.reportDate || doc.createdAt)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.fileSize)}
                                </span>
                                {doc.isAnalyzed && doc.aiAnalysis && (
                                    <RiskBadge level={doc.aiAnalysis.riskLevel} size="xs" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient & Provider */}
            <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                    <User size={13} className="text-muted-foreground/60" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                        Patient &amp; Provider
                    </span>
                </div>
                <div className="px-4 divide-y divide-border/10">
                    <MetaRow icon={Hash} label="Patient ID" value={doc.patientId} />
                    <MetaRow icon={Fingerprint} label="Case ID" value={doc.caseId} />
                    <MetaRow icon={Stethoscope} label="Ordering Doctor" value={doc.doctorName} />
                    <MetaRow icon={Building2} label="Hospital / Facility" value={doc.hospitalName} />
                </div>
            </div>

            {/* Clinical Notes */}
            {doc.notes && (
                <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                        <MessageSquare size={13} className="text-muted-foreground/60" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Clinical Notes</span>
                    </div>
                    <div className="px-4 py-3.5">
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{doc.notes}</p>
                    </div>
                </div>
            )}

            {/* AI Status */}
            <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                    <Microscope size={13} className="text-muted-foreground/60" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Analysis Status</span>
                </div>
                <div className="px-4 py-4">
                    {doc.isAnalyzing ? (
                        <div className="flex items-center gap-3">
                            <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">Analysis in progress</p>
                                <p className="text-xs text-muted-foreground mt-0.5">MedGemma AI is processing this document…</p>
                            </div>
                        </div>
                    ) : doc.isAnalyzed && doc.aiAnalysis ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <p className="text-sm font-semibold text-foreground">Analysis complete</p>
                                </div>
                                <RiskBadge level={doc.aiAnalysis.riskLevel} size="sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-muted/20 border border-border/20 px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">Model</p>
                                    <p className="text-xs font-semibold text-foreground/80">
                                        {doc.aiAnalysis.model?.split('/').pop() || 'AI'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-muted/20 border border-border/20 px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">Analyzed</p>
                                    <p className="text-xs font-semibold text-foreground/80">
                                        {timeAgo(doc.aiAnalysis.analyzedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-muted-foreground/40 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-foreground/70">Not yet analyzed</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Switch to AI Analysis tab to run analysis</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* File Details */}
            <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                    <FileText size={13} className="text-muted-foreground/60" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">File Details</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border/15 overflow-hidden rounded-b-2xl">
                    {[
                        { label: 'Format', value: doc.mimeType?.split('/').pop()?.toUpperCase() || '—' },
                        { label: 'File Size', value: formatFileSize(doc.fileSize) },
                        { label: 'Access Count', value: `${doc.accessCount ?? 0}×` },
                        { label: 'Document ID', value: doc.id?.slice(0, 8) + '…', mono: true },
                    ].map(({ label, value, mono }) => (
                        <div key={label} className="bg-card/30 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">{label}</p>
                            <p className={`text-sm font-semibold text-foreground/80 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                    <Timer size={13} className="text-muted-foreground/60" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Timeline</span>
                </div>
                <div className="px-4 py-3 space-y-0 divide-y divide-border/10">
                    {[
                        { label: 'Report Date', value: formatDateTime(doc.reportDate), icon: CalendarDays },
                        { label: 'Uploaded At', value: formatDateTime(doc.createdAt), icon: Upload },
                        { label: 'Last Updated', value: formatDateTime(doc.updatedAt), icon: RefreshCw },
                        doc.aiAnalysis?.analyzedAt
                            ? { label: 'AI Analyzed At', value: formatDateTime(doc.aiAnalysis.analyzedAt), icon: Zap }
                            : null,
                    ].filter(Boolean).map((item) => {
                        const FieldIcon = item!.icon;
                        return (
                            <div key={item!.label} className="flex items-center gap-3 py-2.5">
                                <div className="w-7 h-7 rounded-lg bg-muted/25 flex items-center justify-center flex-shrink-0">
                                    <FieldIcon size={12} className="text-muted-foreground/50" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">{item!.label}</p>
                                    <p className="text-xs font-medium text-foreground/75 mt-0.5">{item!.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Security notice */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-muted/5">
                <Lock size={14} className="text-muted-foreground/40 flex-shrink-0" />
                <p className="text-xs text-muted-foreground/55 leading-relaxed flex-1">
                    Stored with AES-256-CBC encryption. Access is restricted to authorized personnel only.
                </p>
                <Shield size={14} className="text-primary/30 flex-shrink-0" />
            </div>
        </div>
    );
}

/* ─────────────────────────── AI Analysis Panel ──────────────── */

function AIAnalysisPanel({
    doc, onAnalyze, analyzing,
}: {
    doc: MedicalDocument;
    onAnalyze: () => void;
    analyzing: boolean;
}) {
    const analysis = doc.aiAnalysis;
    const [showRaw, setShowRaw] = useState(false);
    const cfg = DOC_TYPE_CONFIG[doc.documentType];
    const DocIcon = cfg.icon;

    if (!analysis && !doc.isAnalyzing && !analyzing) {
        return (
            <div className="flex flex-col items-center gap-5 py-12 text-center">
                <div className="w-20 h-20 rounded-2xl border border-border/30 bg-muted/20 flex items-center justify-center">
                    <FileBarChart2 size={32} className="text-muted-foreground/30" />
                </div>
                <div className="max-w-[260px]">
                    <p className="text-base font-semibold text-foreground">No AI Analysis Yet</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Run AI analysis to receive structured clinical insights, risk stratification, key measurements, and actionable recommendations.
                    </p>
                </div>
                <button onClick={onAnalyze}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-soft">
                    <Zap size={15} /> Run AI Analysis
                </button>
                <p className="text-xs text-muted-foreground/40 max-w-[220px]">
                    Clinical decision support only — not a substitute for physician evaluation.
                </p>
            </div>
        );
    }

    if (doc.isAnalyzing || analyzing) {
        return (
            <div className="flex flex-col items-center gap-5 py-12 text-center">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-center">
                        <Loader2 size={32} className="text-primary animate-spin" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                        <DocIcon size={14} className={cfg.color} />
                    </div>
                </div>
                <div>
                    <p className="text-base font-semibold text-foreground">AI Analysis in Progress</p>
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-[240px] leading-relaxed">
                        MedGemma is analyzing your {cfg.label} — this may take up to 60 seconds.
                    </p>
                </div>
                <div className="w-52 space-y-2">
                    <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full animate-pulse" style={{ width: '65%' }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground/50">Processing document…</p>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const riskCfg = RISK_CONFIG[analysis.riskLevel] ?? RISK_CONFIG.medium;
    const RiskIcon = riskCfg.icon;
    const abnormalCount = analysis.abnormalFindings.length;
    const normalCount = analysis.normalFindings.length;

    return (
        <div className="space-y-5">

            {/* ── Results Header ── */}
            <div className="rounded-2xl border border-border/40 overflow-hidden">
                <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(90deg, ${riskCfg.hex}80, ${riskCfg.hex}10)` }}
                />
                <div className={`px-4 py-4 ${riskCfg.bg} border-b border-border/20`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${riskCfg.border} ${riskCfg.bg} flex-shrink-0`}>
                                <RiskIcon size={18} className={riskCfg.color} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">{cfg.label} Analysis Results</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {analysis.model?.split('/').pop() || 'AI'} · {formatDateTime(analysis.analyzedAt)}
                                </p>
                            </div>
                        </div>
                        <ConfidenceRing score={analysis.confidenceScore} size="md" />
                    </div>

                    {/* Risk level bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Risk Level</span>
                            <span className={`text-xs font-bold ${riskCfg.color}`}>{riskCfg.label}</span>
                        </div>
                        <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${riskCfg.barColor} transition-all duration-700`}
                                style={{
                                    width: analysis.riskLevel === 'low' ? '20%'
                                        : analysis.riskLevel === 'medium' ? '45%'
                                        : analysis.riskLevel === 'high' ? '72%'
                                        : '100%',
                                }}
                            />
                        </div>
                        <p className={`text-xs mt-1.5 ${riskCfg.color} opacity-80`}>{riskCfg.desc}</p>
                    </div>
                </div>

                {/* Summary */}
                <div className="px-4 py-4 bg-card/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Clinical Summary</p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
                </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-3 gap-2.5">
                {[
                    {
                        label: 'Abnormal',
                        value: abnormalCount,
                        color: 'text-red-400',
                        bg: 'bg-red-500/10',
                        border: 'border-red-500/20',
                        icon: XCircle,
                    },
                    {
                        label: 'Normal',
                        value: normalCount,
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/20',
                        icon: CheckCircle2,
                    },
                    {
                        label: 'Measurements',
                        value: analysis.keyMeasurements.length,
                        color: 'text-sky-400',
                        bg: 'bg-sky-500/10',
                        border: 'border-sky-500/20',
                        icon: BarChart3,
                    },
                ].map(s => {
                    const SI = s.icon;
                    return (
                        <div key={s.label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${s.border} ${s.bg}`}>
                            <SI size={16} className={s.color} />
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground/60">{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── Risk Indicators ── */}
            {analysis.riskIndicators.length > 0 && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                    <SectionBlock icon={BadgeAlert} label="Risk Indicators" count={analysis.riskIndicators.length} accent="text-orange-400">
                        <div className="flex flex-wrap gap-2">
                            {analysis.riskIndicators.map((r, i) => (
                                <span key={i}
                                    className="text-xs px-3 py-1.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25 font-medium">
                                    {r}
                                </span>
                            ))}
                        </div>
                    </SectionBlock>
                </div>
            )}

            {/* ── Abnormal Findings ── */}
            {analysis.abnormalFindings.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <SectionBlock icon={XCircle} label="Abnormal Findings" count={analysis.abnormalFindings.length} accent="text-red-400">
                        <ul className="space-y-2.5">
                            {analysis.abnormalFindings.map((f, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <XCircle size={10} className="text-red-400" />
                                    </div>
                                    <span className="text-sm text-foreground/85 leading-relaxed">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionBlock>
                </div>
            )}

            {/* ── Normal Findings ── */}
            {analysis.normalFindings.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <SectionBlock icon={CheckCircle2} label="Normal Findings" count={analysis.normalFindings.length} accent="text-emerald-400">
                        <ul className="space-y-2.5">
                            {analysis.normalFindings.map((f, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 size={10} className="text-emerald-400" />
                                    </div>
                                    <span className="text-sm text-muted-foreground leading-relaxed">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionBlock>
                </div>
            )}

            {/* ── Key Measurements ── */}
            {analysis.keyMeasurements.length > 0 && (
                <div className="rounded-2xl border border-border/30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/20 bg-muted/10 flex items-center gap-2">
                        <BarChart3 size={13} className="text-muted-foreground/60" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Key Measurements</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground font-semibold">
                            {analysis.keyMeasurements.length}
                        </span>
                    </div>

                    {/* Mobile: cards */}
                    <div className="sm:hidden divide-y divide-border/15">
                        {analysis.keyMeasurements.map((m, i) => (
                            <div key={i} className={`px-4 py-3 ${m.isAbnormal ? 'bg-red-500/5' : 'bg-card/20'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-foreground/85">{m.name}</p>
                                    {m.isAbnormal ? (
                                        <span className="flex items-center gap-1 text-[11px] text-red-400 font-bold flex-shrink-0">
                                            <TrendingUp size={11} /> Abnormal
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold flex-shrink-0">
                                            <CheckCircle size={11} /> Normal
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <p className={`text-base font-bold ${m.isAbnormal ? 'text-red-400' : 'text-foreground'}`}>
                                        {m.value}{m.unit ? ` ${m.unit}` : ''}
                                    </p>
                                    {m.normalRange && (
                                        <p className="text-xs text-muted-foreground">
                                            Range: <span className="font-medium">{m.normalRange}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/20 bg-muted/15">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-4 py-2.5">Parameter</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-3 py-2.5">Value</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-3 py-2.5">Normal Range</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-3 py-2.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {analysis.keyMeasurements.map((m, i) => (
                                    <tr key={i} className={`transition-colors ${m.isAbnormal ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-muted/10'}`}>
                                        <td className="px-4 py-3 text-sm font-medium text-foreground/85">{m.name}</td>
                                        <td className={`px-3 py-3 text-sm font-bold ${m.isAbnormal ? 'text-red-400' : 'text-foreground'}`}>
                                            {m.value}{m.unit ? ` ${m.unit}` : ''}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-muted-foreground">{m.normalRange || '—'}</td>
                                        <td className="px-3 py-3">
                                            {m.isAbnormal ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                                                    <TrendingUp size={11} /> Abnormal
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                                                    <CheckCircle size={11} /> Normal
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Recommendations ── */}
            {analysis.recommendations.length > 0 && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                    <SectionBlock icon={ClipboardList} label="Clinical Recommendations" count={analysis.recommendations.length} accent="text-sky-400">
                        <ol className="space-y-3">
                            {analysis.recommendations.map((r, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0 mt-0.5 text-sky-400 text-[10px] font-bold">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm text-foreground/85 leading-relaxed">{r}</span>
                                </li>
                            ))}
                        </ol>
                    </SectionBlock>
                </div>
            )}

            {/* ── Footer meta ── */}
            <div className="flex items-center justify-between text-xs text-muted-foreground/40 px-1">
                <span className="flex items-center gap-1.5">
                    <Star size={11} />
                    {analysis.model?.split('/').pop() || 'AI Model'}
                </span>
                <span>{formatDateTime(analysis.analyzedAt)}</span>
            </div>

            {/* Raw output toggle */}
            <button
                onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full py-1"
            >
                {showRaw ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showRaw ? 'Hide' : 'View'} raw AI output
            </button>
            {showRaw && (
                <pre className="p-4 text-[11px] bg-muted/20 rounded-xl overflow-auto max-h-56 text-muted-foreground/70 whitespace-pre-wrap break-all border border-border/20 leading-relaxed">
                    {analysis.rawAnalysis}
                </pre>
            )}

            {/* Re-analyze */}
            <button onClick={onAnalyze}
                className="w-full flex items-center justify-center gap-2 py-3 border border-border/40 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/20 transition-all">
                <RefreshCw size={13} /> Re-analyze Document
            </button>

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-muted/10 border border-border/20">
                <Shield size={13} className="text-primary/40 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground/50 leading-relaxed italic">
                    AI analysis is for clinical decision support only. Not a substitute for physician evaluation, clinical judgment, or established diagnostic protocols.
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────── Document Card ──────────────────── */

function DocumentCard({
    doc, onView, onDelete, onAnalyze, isAnalyzing,
}: {
    doc: MedicalDocument;
    onView: () => void;
    onDelete: () => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
}) {
    const cfg = DOC_TYPE_CONFIG[doc.documentType];
    const Icon = cfg.icon;
    const riskCfg = doc.aiAnalysis ? RISK_CONFIG[doc.aiAnalysis.riskLevel] : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="group relative flex flex-col rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm hover:border-border/60 hover:shadow-lg hover:shadow-black/5 transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={onView}
        >
            {/* Type color accent */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${cfg.accentHex}70, ${cfg.accentHex}15)` }} />

            {/* Header band */}
            <div className={`relative px-4 pt-4 pb-3 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
                        <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {cfg.shortLabel}
                        </span>
                        {(isAnalyzing || doc.isAnalyzing) ? (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                                <Loader2 size={8} className="animate-spin" /> Analyzing
                            </span>
                        ) : doc.isAnalyzed && doc.aiAnalysis ? (
                            <RiskBadge level={doc.aiAnalysis.riskLevel} size="xs" />
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">
                                <Clock size={8} /> Pending
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-3 space-y-2.5">
                <p className="text-sm font-semibold text-foreground truncate leading-snug" title={doc.originalFileName}>
                    {doc.originalFileName}
                </p>

                <div className="space-y-1.5">
                    {doc.patientId && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User size={10} className="text-muted-foreground/50 flex-shrink-0" />
                            <span className="truncate">Patient: <span className="text-foreground/70 font-medium">{doc.patientId}</span></span>
                        </div>
                    )}
                    {doc.doctorName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Stethoscope size={10} className="text-muted-foreground/50 flex-shrink-0" />
                            <span className="truncate">{doc.doctorName}</span>
                        </div>
                    )}
                    {doc.hospitalName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 size={10} className="text-muted-foreground/50 flex-shrink-0" />
                            <span className="truncate">{doc.hospitalName}</span>
                        </div>
                    )}
                </div>

                {/* AI summary snippet */}
                {doc.aiAnalysis?.summary && (
                    <p className="text-xs text-muted-foreground/75 leading-relaxed line-clamp-2 border-t border-border/20 pt-2">
                        {doc.aiAnalysis.summary}
                    </p>
                )}

                {/* Measurement count if analyzed */}
                {doc.isAnalyzed && doc.aiAnalysis && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50 border-t border-border/15 pt-2">
                        {doc.aiAnalysis.keyMeasurements.length > 0 && (
                            <span className="flex items-center gap-1">
                                <BarChart3 size={10} />
                                {doc.aiAnalysis.keyMeasurements.length} measurements
                            </span>
                        )}
                        {doc.aiAnalysis.abnormalFindings.length > 0 && (
                            <span className="flex items-center gap-1 text-red-400/70">
                                <XCircle size={10} />
                                {doc.aiAnalysis.abnormalFindings.length} abnormal
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/50 border-t border-border/15 pt-2">
                    <span className="flex items-center gap-1">
                        <CalendarDays size={10} />
                        {formatDate(doc.reportDate || doc.createdAt)}
                    </span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                </div>
            </div>

            {/* Hover action bar */}
            <div className="px-3 pb-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 -mt-1">
                <button
                    onClick={e => { e.stopPropagation(); onView(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-colors"
                >
                    <Eye size={11} /> View Report
                </button>
                {!doc.isAnalyzed && !doc.isAnalyzing && !isAnalyzing && (
                    <button
                        onClick={e => { e.stopPropagation(); onAnalyze(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Zap size={11} /> Analyze
                    </button>
                )}
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="p-2 hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 rounded-lg transition-colors"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────── Detail Modal ───────────────────── */

function DetailModal({
    doc, onClose, onAnalyze, onDelete, onDownload, analyzing,
}: {
    doc: MedicalDocument;
    onClose: () => void;
    onAnalyze: () => void;
    onDelete: () => void;
    onDownload: () => void;
    analyzing: boolean;
}) {
    const [tab, setTab] = useState<DetailTab>(() => doc.isAnalyzed ? 'analysis' : 'overview');
    const cfg = DOC_TYPE_CONFIG[doc.documentType];
    const Icon = cfg.icon;

    const TABS: { id: DetailTab; label: string; icon: React.ElementType; badge?: boolean }[] = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'analysis', label: 'AI Analysis', icon: BarChart3, badge: !doc.isAnalyzed && !doc.isAnalyzing },
        { id: 'file', label: 'File', icon: Eye },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full sm:max-w-5xl h-[96dvh] sm:h-[90vh] bg-card border border-border/50 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden rounded-t-2xl"
                >
                    {/* ── Modal Header ── */}
                    <div className="relative flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border/40 flex-shrink-0">
                        <div
                            className="absolute top-0 left-0 right-0 h-0.5 opacity-70"
                            style={{ background: `linear-gradient(90deg, ${cfg.accentHex}, transparent)` }}
                        />
                        <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={16} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-foreground truncate leading-tight">{doc.originalFileName}</h2>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                                <ChevronRight size={9} className="text-muted-foreground/30" />
                                <span className="text-xs text-muted-foreground">{formatDate(doc.reportDate || doc.createdAt)}</span>
                                <ChevronRight size={9} className="text-muted-foreground/30" />
                                <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                                {doc.aiAnalysis && (
                                    <>
                                        <ChevronRight size={9} className="text-muted-foreground/30" />
                                        <RiskBadge level={doc.aiAnalysis.riskLevel} size="xs" />
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={onDownload}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border/70 rounded-lg transition-all">
                                <Download size={12} /> Download
                            </button>
                            <button onClick={onDelete}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all">
                                <Trash2 size={12} /> Delete
                            </button>
                            <button onClick={onDownload} className="sm:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                                <Download size={16} />
                            </button>
                            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ── Tab Nav ── */}
                    <div className="flex items-center gap-0.5 px-4 sm:px-5 py-2.5 border-b border-border/30 bg-muted/10 flex-shrink-0">
                        {TABS.map(t => {
                            const TabIcon = t.icon;
                            const isActive = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-card text-foreground shadow-sm border border-border/30'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                    }`}
                                >
                                    <TabIcon size={12} />
                                    {t.label}
                                    {t.badge && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                    )}
                                    {t.id === 'analysis' && doc.isAnalyzed && doc.aiAnalysis && (
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_CONFIG[doc.aiAnalysis.riskLevel].barColor}`} />
                                    )}
                                </button>
                            );
                        })}
                        <div className="ml-auto flex items-center gap-1.5">
                            {(doc.isAnalyzing || analyzing) && (
                                <span className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                                    <Loader2 size={9} className="animate-spin" /> Analyzing…
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 min-h-0 flex">
                        {/* Desktop: left file viewer */}
                        <div className="hidden lg:flex flex-1 min-w-0 p-3 flex-col">
                            <FilePanel doc={doc} onDownload={onDownload} />
                        </div>

                        {/* Desktop divider */}
                        <div className="hidden lg:block w-px bg-border/25 flex-shrink-0" />

                        {/* Right panel / Mobile full */}
                        <div className="flex-1 lg:w-[420px] lg:flex-none flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-5">
                                <AnimatePresence mode="wait">
                                    {tab === 'overview' && (
                                        <motion.div key="overview"
                                            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                                            <OverviewPanel doc={doc} />
                                        </motion.div>
                                    )}
                                    {tab === 'analysis' && (
                                        <motion.div key="analysis"
                                            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                                            <AIAnalysisPanel doc={doc} onAnalyze={onAnalyze} analyzing={analyzing} />
                                        </motion.div>
                                    )}
                                    {tab === 'file' && (
                                        <motion.div key="file"
                                            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                                            className="flex flex-col h-full min-h-[400px]">
                                            <FilePanel doc={doc} onDownload={onDownload} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile footer actions */}
                            <div className="sm:hidden flex items-center gap-2 px-4 py-3 border-t border-border/30 bg-muted/10 flex-shrink-0">
                                <button onClick={onDownload}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-border/40 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                    <Download size={12} /> Download
                                </button>
                                <button onClick={onDelete}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─────────────────────────── Upload Modal ───────────────────── */

function UploadModal({
    onClose, onUploaded,
}: {
    onClose: () => void;
    onUploaded: (doc: MedicalDocument, autoAnalyze: boolean) => void;
}) {
    const [form, setForm] = useState<UploadForm>(DEFAULT_FORM);
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const validateAndSetFile = (f: File) => {
        if (f.size > MAX_FILE_SIZE) { setError('File too large. Maximum size is 50 MB.'); return; }
        setError('');
        setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please select a file'); return; }
        setUploading(true);
        setError('');
        try {
            const token = await getToken();
            const fd = new FormData();
            fd.append('file', file);
            fd.append('documentType', form.documentType);
            if (form.patientId) fd.append('patientId', form.patientId);
            if (form.reportDate) fd.append('reportDate', form.reportDate);
            if (form.hospitalName) fd.append('hospitalName', form.hospitalName);
            if (form.doctorName) fd.append('doctorName', form.doctorName);
            if (form.notes) fd.append('notes', form.notes);
            fd.append('analyzeAfterUpload', String(form.analyzeAfterUpload));
            const res = await fetch(`${apiUrl}/documents/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: fd,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `Upload failed (${res.status})`);
            }
            const doc = await res.json();
            onUploaded(doc, form.analyzeAfterUpload);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const docCfg = DOC_TYPE_CONFIG[form.documentType];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full sm:max-w-lg bg-card border border-border/50 sm:rounded-2xl shadow-2xl overflow-hidden rounded-t-2xl"
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: `linear-gradient(90deg, ${docCfg.accentHex}, transparent)` }}
                    />
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Upload Medical Document</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">JPEG · PNG · WEBP · PDF · DICOM · Max 50 MB · AES-256 encrypted</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85dvh] overflow-y-auto scrollbar-thin">
                        {/* Drop zone */}
                        <div
                            className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                                dragOver ? 'border-primary/60 bg-primary/5' : 'border-border/40 hover:border-border/60 hover:bg-muted/10'
                            }`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) validateAndSetFile(f); }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }} />
                            {file ? (
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                                        <FileText size={20} className="text-primary" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground truncate px-4">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                                        className="text-xs text-red-400 hover:text-red-300 font-medium">
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center mx-auto">
                                        <Upload size={20} className="text-muted-foreground/60" />
                                    </div>
                                    <p className="text-sm text-foreground/70">Drag & drop or <span className="text-primary font-semibold">browse</span></p>
                                    <p className="text-xs text-muted-foreground/50">JPEG · PNG · WEBP · PDF · DICOM</p>
                                </div>
                            )}
                        </div>

                        {/* Document type selector */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground/70 mb-2">Document Type *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.entries(DOC_TYPE_CONFIG) as [DocumentType, typeof DOC_TYPE_CONFIG[DocumentType]][]).map(([key, c]) => {
                                    const TypeIcon = c.icon;
                                    const isSelected = form.documentType === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, documentType: key }))}
                                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                                isSelected
                                                    ? `${c.bg} ${c.border} ${c.color}`
                                                    : 'border-border/30 text-muted-foreground hover:border-border/50 hover:bg-muted/20'
                                            }`}
                                        >
                                            <TypeIcon size={16} />
                                            <span className="text-[10px] text-center leading-tight">{c.shortLabel}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Form fields */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'patientId', label: 'Patient ID', placeholder: 'e.g. P-2024-001' },
                                { key: 'reportDate', label: 'Report Date', placeholder: '', type: 'date' },
                                { key: 'doctorName', label: 'Ordering Doctor', placeholder: 'Dr. Smith' },
                                { key: 'hospitalName', label: 'Hospital / Facility', placeholder: 'City Medical Center' },
                            ].map(({ key, label, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70 mb-1">{label}</label>
                                    <input
                                        type={type || 'text'}
                                        placeholder={placeholder}
                                        value={(form as any)[key]}
                                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70 mb-1.5">Clinical Notes</label>
                            <textarea
                                placeholder="Clinical context, ordering indication, relevant history…"
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-colors"
                            />
                        </div>

                        {/* Auto-analyze toggle */}
                        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/15 border border-border/30 cursor-pointer hover:bg-muted/25 transition-colors">
                            <div
                                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${form.analyzeAfterUpload ? 'bg-primary' : 'bg-muted/50'}`}
                                onClick={() => setForm(f => ({ ...f, analyzeAfterUpload: !f.analyzeAfterUpload }))}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.analyzeAfterUpload ? 'translate-x-4' : ''}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Auto-analyze after upload</p>
                                <p className="text-xs text-muted-foreground">MedGemma AI starts processing immediately</p>
                            </div>
                        </label>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                                <AlertTriangle size={14} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 border border-border/40 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border/60 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={uploading || !file}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft">
                                {uploading
                                    ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                                    : <><Upload size={14} /> Upload Document</>
                                }
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─────────────────────────── Main Page ──────────────────────── */

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [detailDoc, setDetailDoc] = useState<MedicalDocument | null>(null);
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchDocuments = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/documents`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Failed to load documents');
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchDocuments();
        const timers = pollTimers.current;
        return () => timers.forEach(t => clearInterval(t));
    }, [fetchDocuments]);

    const startPolling = useCallback((docId: string) => {
        if (pollTimers.current.has(docId)) return;
        const t = setInterval(async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${apiUrl}/documents/${docId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) return;
                const doc: MedicalDocument = await res.json();
                if (!doc.isAnalyzing) {
                    clearInterval(t);
                    pollTimers.current.delete(docId);
                    setAnalyzingIds(prev => { const s = new Set(prev); s.delete(docId); return s; });
                    setDocuments(prev => prev.map(d => d.id === docId ? doc : d));
                    setDetailDoc(prev => prev?.id === docId ? doc : prev);
                }
            } catch {}
        }, 3000);
        pollTimers.current.set(docId, t);
    }, [apiUrl]);

    const handleAnalyze = useCallback(async (docId: string) => {
        setAnalyzingIds(prev => new Set(prev).add(docId));
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isAnalyzing: true } : d));
        setDetailDoc(prev => prev?.id === docId ? { ...prev, isAnalyzing: true } : prev);
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/documents/${docId}/analyze`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
            const updated = await res.json();
            setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
            setDetailDoc(prev => prev?.id === docId ? updated : prev);
        } catch {
            startPolling(docId);
        } finally {
            setAnalyzingIds(prev => { const s = new Set(prev); s.delete(docId); return s; });
        }
    }, [apiUrl, startPolling]);

    const handleDownload = useCallback(async (doc: MedicalDocument) => {
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/documents/${doc.id}/file`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.originalFileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message);
        }
    }, [apiUrl]);

    const handleDelete = useCallback(async (docId: string) => {
        if (!confirm('Permanently delete this document? This action cannot be undone.')) return;
        try {
            const token = await getToken();
            await fetch(`${apiUrl}/documents/${docId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setDocuments(prev => prev.filter(d => d.id !== docId));
            setDetailDoc(prev => prev?.id === docId ? null : prev);
        } catch (err: any) {
            setError(err.message);
        }
    }, [apiUrl]);

    const handleUploaded = useCallback((doc: MedicalDocument, autoAnalyze: boolean) => {
        setDocuments(prev => [doc, ...prev]);
        setShowUpload(false);
        if (autoAnalyze) startPolling(doc.id);
    }, [startPolling]);

    const filtered = useMemo(() => {
        return documents
            .filter(d => selectedType === 'all' || d.documentType === selectedType)
            .filter(d => {
                if (!search.trim()) return true;
                const s = search.toLowerCase();
                return (
                    d.originalFileName?.toLowerCase().includes(s) ||
                    d.patientId?.toLowerCase().includes(s) ||
                    d.hospitalName?.toLowerCase().includes(s) ||
                    d.doctorName?.toLowerCase().includes(s) ||
                    d.documentType?.toLowerCase().includes(s) ||
                    d.aiAnalysis?.summary?.toLowerCase().includes(s)
                );
            });
    }, [documents, selectedType, search]);

    const stats = useMemo(() => ({
        total: documents.length,
        analyzed: documents.filter(d => d.isAnalyzed).length,
        critical: documents.filter(d => d.aiAnalysis?.riskLevel === 'critical').length,
        high: documents.filter(d => d.aiAnalysis?.riskLevel === 'high').length,
    }), [documents]);

    /* ── Render ──────────────────────────────────────────────── */

    return (
        <div className="flex flex-col gap-5 p-4 lg:p-6 pb-24 lg:pb-8">

            <PageHeader
                title="Medical Documents & AI"
                subtitle="Upload, view and analyze X-rays, ECGs, blood reports, MRI, CT scans & ultrasound with MedGemma"
                icon={FolderSearch}
                actions={
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-soft"
                    >
                        <Plus size={15} /> Upload Document
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Documents', value: stats.total, sub: 'all types', icon: FolderSearch, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/15' },
                    { label: 'Analyzed', value: stats.analyzed, sub: `${stats.total ? Math.round((stats.analyzed / stats.total) * 100) : 0}% complete`, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
                    { label: 'High Risk', value: stats.high, sub: 'needs review', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/15' },
                    { label: 'Critical', value: stats.critical, sub: 'urgent attention', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15' },
                ].map(s => {
                    const StatIcon = s.icon;
                    return (
                        <div key={s.label} className={`flex items-center gap-3 p-4 rounded-2xl bg-card/60 border ${s.border} backdrop-blur-sm`}>
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                                <StatIcon size={17} className={s.color} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{s.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-xl border border-border/25 overflow-x-auto scrollbar-none flex-1">
                    {[
                        { value: 'all', label: 'All', icon: FolderSearch },
                        ...Object.entries(DOC_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.shortLabel, icon: v.icon })),
                    ].map(t => {
                        const TabIcon = t.icon;
                        const isActive = selectedType === t.value;
                        const count = t.value === 'all'
                            ? documents.length
                            : documents.filter(d => d.documentType === t.value).length;
                        return (
                            <button
                                key={t.value}
                                onClick={() => setSelectedType(t.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-card shadow-sm text-foreground border border-border/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                }`}
                            >
                                <TabIcon size={11} />
                                {t.label}
                                {count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        isActive ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="relative sm:w-64">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                        type="text"
                        placeholder="Search documents…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/20 border border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-colors"
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    <AlertTriangle size={15} className="flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError('')} className="hover:text-red-300 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Document Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-border/25 bg-card/50 overflow-hidden animate-pulse">
                            <div className="h-0.5 bg-muted/40" />
                            <div className="h-20 bg-muted/30 m-4 rounded-xl" />
                            <div className="px-4 pb-4 space-y-2.5">
                                <div className="h-4 bg-muted/40 rounded-lg w-3/4" />
                                <div className="h-3 bg-muted/30 rounded-lg w-1/2" />
                                <div className="h-3 bg-muted/30 rounded-lg w-2/3" />
                                <div className="h-8 bg-muted/20 rounded-xl w-full mt-3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={FolderSearch}
                    title={search || selectedType !== 'all' ? 'No matching documents' : 'No documents yet'}
                    description={
                        search || selectedType !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Upload X-rays, ECGs, blood reports, MRI, CT scans, or ultrasound files to get AI-powered clinical insights from MedGemma'
                    }
                    action={!search && selectedType === 'all' ? (
                        <button
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-soft"
                        >
                            <Upload size={14} /> Upload First Document
                        </button>
                    ) : undefined}
                />
            ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onView={() => setDetailDoc(doc)}
                                onDelete={() => handleDelete(doc.id)}
                                onAnalyze={() => handleAnalyze(doc.id)}
                                isAnalyzing={analyzingIds.has(doc.id)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modals */}
            {showUpload && (
                <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
            )}
            {detailDoc && (
                <DetailModal
                    doc={detailDoc}
                    onClose={() => setDetailDoc(null)}
                    onAnalyze={() => handleAnalyze(detailDoc.id)}
                    onDelete={() => handleDelete(detailDoc.id)}
                    onDownload={() => handleDownload(detailDoc)}
                    analyzing={analyzingIds.has(detailDoc.id)}
                />
            )}
        </div>
    );
}
