'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Upload, FileImage, Loader2, Trash2, Shield, CheckCircle2,
    AlertTriangle, XCircle, RefreshCw, HeartPulse, TrendingUp, TrendingDown,
    Minus, Clock, BarChart3,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import FormTextarea from '@/components/ui/FormTextarea';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { useAuthStore } from '@/lib/store/auth';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

/* ─── Types ─────────────────────────────────────────────────── */

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

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
    model: string;
    analyzedAt: string;
}

interface UploadedDoc {
    id: string;
    originalFileName: string;
    isAnalyzed: boolean;
    isAnalyzing: boolean;
    aiAnalysis: AIAnalysis | null;
}

/* ─── Helpers ───────────────────────────────────────────────── */

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
    low:      { label: 'Normal',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    medium:   { label: 'Review',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: AlertTriangle },
    high:     { label: 'Abnormal', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
    critical: { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       icon: XCircle },
};

function ConfidenceRing({ score }: { score: number }) {
    const pct = Math.min(1, Math.max(0, score));
    const r = 28, circ = 2 * Math.PI * r;
    const dash = pct * circ;
    const color = pct >= 0.8 ? '#10b981' : pct >= 0.6 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border/30" />
                <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 36 36)" />
                <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
                    {Math.round(pct * 100)}%
                </text>
            </svg>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Confidence</span>
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────────────────── */

export default function ECGPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { accessToken: storeToken } = useAuthStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [doc, setDoc] = useState<UploadedDoc | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* Token resolution: Zustand → localStorage → NextAuth */
    const getToken = useCallback(async (): Promise<string | null> => {
        if (storeToken) return storeToken;
        try {
            const { getStoredSession } = await import('@/lib/mobile-auth');
            const m = getStoredSession();
            if (m?.tokens?.accessToken) return m.tokens.accessToken;
        } catch { /* no mobile session */ }
        try {
            const { getSession } = await import('next-auth/react');
            const s = await getSession();
            return (s as any)?.accessToken ?? null;
        } catch { return null; }
    }, [storeToken]);

    /* Poll document until analysis completes */
    const startPolling = useCallback((docId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        setIsAnalyzing(true);
        pollRef.current = setInterval(async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/documents/${docId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const updated: UploadedDoc = await res.json();
                if (updated.isAnalyzed && !updated.isAnalyzing) {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setDoc(updated);
                    setIsAnalyzing(false);
                } else if (!updated.isAnalyzing) {
                    // analysis not started — retry trigger
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setIsAnalyzing(false);
                }
            } catch { /* keep polling */ }
        }, 3000);
    }, [getToken]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setError('Please select an image (PNG, JPG) or PDF file');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50 MB');
            return;
        }
        setSelectedFile(file);
        setDoc(null);
        setError('');
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleRemove = () => {
        setSelectedFile(null);
        setPreview(null);
        setDoc(null);
        setError('');
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!selectedFile) { setError('Please select a file'); return; }
        setIsUploading(true);
        setError('');
        setDoc(null);
        try {
            const token = await getToken();
            if (!token) { setError('Please log in again to use ECG analysis.'); return; }

            const form = new FormData();
            form.append('file', selectedFile);
            form.append('documentType', 'ecg');
            form.append('analyzeAfterUpload', 'true');
            if (notes.trim()) form.append('notes', notes.trim());

            const res = await fetch(`${API_URL}/documents/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody?.message || `Upload failed (${res.status})`);
            }

            const uploaded: UploadedDoc = await res.json();
            setDoc(uploaded);

            if (uploaded.isAnalyzed) {
                setIsAnalyzing(false);
            } else {
                startPolling(uploaded.id);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
                setError('Cannot reach the server. Check your connection and that the backend is running.');
            } else {
                setError(msg || 'Upload failed. Please try again.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleReAnalyze = async () => {
        if (!doc) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/documents/${doc.id}/analyze`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
            const updated: UploadedDoc = await res.json();
            setDoc(updated);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Re-analysis failed. Try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const analysis = doc?.aiAnalysis ?? null;
    const riskCfg = analysis ? RISK_CONFIG[analysis.riskLevel] ?? RISK_CONFIG.medium : null;
    const RiskIcon = riskCfg?.icon ?? CheckCircle2;

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="ECG Upload & Analysis"
                subtitle="AI-powered 12-lead ECG interpretation with encrypted storage"
                icon={Activity}
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-5 pb-8 max-w-4xl animate-fade-in">

                    {/* ── Upload Card ── */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }} className="glass-card p-6">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Upload ECG Recording</h2>

                        <input ref={fileInputRef} type="file" accept="image/*,.pdf"
                            onChange={handleFileSelect} className="hidden" />

                        {!selectedFile ? (
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:border-rose-400/40 hover:bg-rose-500/[0.03] transition-all duration-300 group">
                                <div className="w-16 h-16 bg-gradient-to-br from-rose-400/20 to-rose-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="text-rose-500" size={28} />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-foreground">Click to upload ECG image or PDF</p>
                                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, PDF · up to 50 MB · AES-256 encrypted</p>
                                </div>
                            </button>
                        ) : (
                            <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                                            <FileImage className="text-rose-500" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleRemove}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {preview && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="ECG Preview"
                                        className="w-full rounded-xl border border-border/50 max-h-64 object-contain bg-black/20" />
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* ── Clinical Notes ── */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }} className="glass-card p-6">
                        <FormTextarea
                            label="Clinical Notes (optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Patient age, symptoms, relevant history, medications…"
                            rows={3}
                        />
                    </motion.div>

                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    {/* ── Upload Button ── */}
                    <button onClick={handleUpload}
                        disabled={isUploading || isAnalyzing || !selectedFile}
                        className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50">
                        {isUploading ? (
                            <><Loader2 className="animate-spin" size={20} /> Uploading & Encrypting…</>
                        ) : isAnalyzing ? (
                            <><Loader2 className="animate-spin" size={20} /> AI Analyzing ECG…</>
                        ) : (
                            <><Shield size={20} /> Upload & Analyze (Encrypted)</>
                        )}
                    </button>

                    {/* ── Analyzing indicator ── */}
                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="glass-card p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                    <HeartPulse className="text-rose-400 animate-pulse" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">AI ECG Analysis in Progress</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Evaluating rhythm, intervals, ST changes, and morphology…
                                    </p>
                                </div>
                                <Loader2 className="animate-spin text-muted-foreground ml-auto" size={18} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Analysis Results ── */}
                    <AnimatePresence>
                        {analysis && riskCfg && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
                                className="glass-card p-6 space-y-6">

                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${riskCfg.bg}`}>
                                            <RiskIcon size={20} className={riskCfg.color} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-foreground">ECG Analysis Results</h2>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {analysis.model} · {new Date(analysis.analyzedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ConfidenceRing score={analysis.confidenceScore} />
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${riskCfg.bg} ${riskCfg.color}`}>
                                            {riskCfg.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                                    <p className="text-sm font-medium text-muted-foreground mb-1.5 uppercase tracking-wide text-[10px]">Summary</p>
                                    <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
                                </div>

                                {/* Risk indicators */}
                                {analysis.riskIndicators.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Risk Indicators
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.riskIndicators.map((r, i) => (
                                                <span key={i}
                                                    className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium">
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Abnormal + Normal findings */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {analysis.abnormalFindings.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                                <TrendingUp size={11} className="text-red-400" /> Abnormal Findings
                                            </p>
                                            <ul className="space-y-1.5">
                                                {analysis.abnormalFindings.map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                                                        <XCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {analysis.normalFindings.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                                <TrendingDown size={11} className="text-emerald-400" /> Normal Findings
                                            </p>
                                            <ul className="space-y-1.5">
                                                {analysis.normalFindings.map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                                                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Key measurements */}
                                {analysis.keyMeasurements.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <BarChart3 size={11} /> Key Measurements
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="text-left text-muted-foreground border-b border-border/30">
                                                        <th className="pb-2 pr-4 font-medium">Parameter</th>
                                                        <th className="pb-2 pr-4 font-medium">Value</th>
                                                        <th className="pb-2 pr-4 font-medium">Normal Range</th>
                                                        <th className="pb-2 font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/20">
                                                    {analysis.keyMeasurements.map((m, i) => (
                                                        <tr key={i} className={m.isAbnormal ? 'text-orange-300' : 'text-foreground/80'}>
                                                            <td className="py-2 pr-4 font-medium">{m.name}</td>
                                                            <td className="py-2 pr-4">{m.value}{m.unit ? ` ${m.unit}` : ''}</td>
                                                            <td className="py-2 pr-4 text-muted-foreground">{m.normalRange ?? '—'}</td>
                                                            <td className="py-2">
                                                                {m.isAbnormal
                                                                    ? <span className="flex items-center gap-1 text-orange-400"><AlertTriangle size={11} /> Abnormal</span>
                                                                    : <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} /> Normal</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {analysis.recommendations.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Recommendations
                                        </p>
                                        <ul className="space-y-2">
                                            {analysis.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                    <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={14} />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-border/30 flex-wrap gap-3">
                                    <p className="text-[11px] text-muted-foreground italic flex items-start gap-1.5 max-w-lg">
                                        <Shield size={13} className="flex-shrink-0 mt-0.5 text-primary/60" />
                                        AI-generated decision support only. Final interpretation must be made by qualified medical personnel.
                                    </p>
                                    <button onClick={handleReAnalyze} disabled={isAnalyzing}
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                                        <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
                                        Re-analyze
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </main>
        </div>
    );
}
