'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, CheckCircle2, AlertTriangle, Search, RefreshCw,
    ChevronLeft, ChevronRight, User, Globe, Monitor,
    Clock, Hash, FileText, Filter, Download, Lock,
    Activity, Eye, LogIn, LogOut, Trash2, Edit, Plus, X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useAuthStore, UserRole } from '@/lib/store/auth';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';

/* ── Types ── */

interface AuditLog {
    id: string;
    timestamp: string;
    userId?: string;
    username?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    ipAddress: string;
    userAgent?: string;
    deviceId?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    previousHash?: string;
    currentHash: string;
}

interface AuditResponse {
    logs: AuditLog[];
    total: number;
}

const ACTION_ICON: Record<string, React.ElementType> = {
    LOGIN: LogIn,
    LOGOUT: LogOut,
    CREATE: Plus,
    UPDATE: Edit,
    DELETE: Trash2,
    VIEW: Eye,
    REGISTER: User,
    UPLOAD: FileText,
    ANALYZE: Activity,
    VERIFY: Shield,
};

const ACTION_COLOR: Record<string, string> = {
    LOGIN: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    LOGOUT: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    CREATE: 'text-medical-teal-400 bg-medical-teal-500/10 border-medical-teal-500/20',
    UPDATE: 'text-medical-blue-400 bg-medical-blue-500/10 border-medical-blue-500/20',
    DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
    VIEW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    REGISTER: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    UPLOAD: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    ANALYZE: 'text-medical-cyan-400 bg-medical-cyan-500/10 border-medical-cyan-500/20',
    VERIFY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function getActionBase(action: string): string {
    return action.split('_')[0].toUpperCase();
}

function formatDt(iso: string): { date: string; time: string } {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    };
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const PAGE_SIZE = 25;

/* ── Component ── */

export default function AuditLogsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [integrityOk, setIntegrityOk] = useState<boolean | null>(null);
    const [integrityLoading, setIntegrityLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failed'>('all');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== UserRole.ADMIN) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const fetchLogs = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await api.get<AuditLog[] | AuditResponse>(`/audit/logs`, {
                params: { limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE },
            });
            // API returns array or {logs, total}
            if (Array.isArray(res.data)) {
                setLogs(res.data);
                setTotal(res.data.length);
            } else {
                setLogs((res.data as AuditResponse).logs || []);
                setTotal((res.data as AuditResponse).total || 0);
            }
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

    const verifyIntegrity = async () => {
        setIntegrityLoading(true);
        try {
            const res = await api.get<{ intact: boolean }>('/audit/verify');
            setIntegrityOk(res.data.intact);
        } catch {
            setIntegrityOk(false);
        } finally {
            setIntegrityLoading(false);
        }
    };

    const exportCsv = () => {
        if (!logs.length) return;
        const header = ['Timestamp', 'Username', 'Action', 'Resource', 'IP Address', 'Success'].join(',');
        const rows = logs.map(l =>
            [
                new Date(l.timestamp).toISOString(),
                l.username || '',
                l.action,
                l.resource || '',
                l.ipAddress,
                l.success ? 'Yes' : 'No',
            ].join(','),
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Client-side filter
    const filtered = logs.filter(l => {
        if (filterSuccess === 'success' && !l.success) return false;
        if (filterSuccess === 'failed' && l.success) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                l.action?.toLowerCase().includes(q) ||
                l.username?.toLowerCase().includes(q) ||
                l.resource?.toLowerCase().includes(q) ||
                l.ipAddress?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="flex flex-col min-h-full safe-top">
            {/* Header */}
            <header
                className="relative lg:sticky lg:top-0 z-30 h-16 flex-shrink-0 border-b border-border/40"
                style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)' }}
            >
                <div className="h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between max-w-[1600px] w-full mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-soft">
                            <Shield size={18} />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-foreground font-display">Audit Logs</h1>
                            <p className="text-2xs text-muted-foreground">Tamper-evident activity trail</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Integrity badge */}
                        {integrityOk !== null && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${integrityOk
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    : 'text-red-500 bg-red-500/10 border-red-500/20'
                                    }`}
                            >
                                {integrityOk ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                                {integrityOk ? 'Chain Intact' : 'Chain Broken'}
                            </motion.span>
                        )}
                        <button
                            id="audit-verify-btn"
                            onClick={verifyIntegrity}
                            disabled={integrityLoading}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-60"
                        >
                            {integrityLoading ? (
                                <RefreshCw size={13} className="animate-spin" />
                            ) : (
                                <Shield size={13} />
                            )}
                            Verify Integrity
                        </button>
                        <button
                            id="audit-export-btn"
                            onClick={exportCsv}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-muted/50 text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                        >
                            <Download size={13} /> Export CSV
                        </button>
                        <button
                            onClick={() => fetchLogs(page)}
                            className="p-2 hover:bg-muted/50 rounded-xl text-muted-foreground transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-20 lg:pb-6 max-w-[1600px]">

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Logs', value: total.toLocaleString(), icon: Hash, color: 'text-primary' },
                            { label: 'Shown on page', value: filtered.length.toString(), icon: Eye, color: 'text-medical-teal-500' },
                            { label: 'Failures', value: filtered.filter(l => !l.success).length.toString(), icon: AlertTriangle, color: 'text-red-400' },
                            { label: 'Chain', value: integrityOk === null ? 'Unverified' : integrityOk ? 'Intact ✓' : '⚠ Broken', icon: Shield, color: integrityOk === null ? 'text-muted-foreground' : integrityOk ? 'text-emerald-500' : 'text-red-500' },
                        ].map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className="glass-card p-3.5 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center ${s.color} flex-shrink-0`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-base font-bold font-display ${s.color}`}>{s.value}</p>
                                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div className="glass-card p-3 flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                id="audit-search-input"
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search action, user, resource, IP…"
                                className="w-full pl-8 pr-3 py-2 text-sm bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1">
                            {(['all', 'success', 'failed'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilterSuccess(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterSuccess === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-4">
                                    <LoadingSkeleton variant="row" count={8} />
                                </div>
                            ) : filtered.length === 0 ? (
                                <EmptyState
                                    icon={Shield}
                                    title="No audit logs found"
                                    description="Audit entries will appear here as actions are performed"
                                    className="py-16"
                                />
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/30 bg-muted/20">
                                            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Timestamp</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">User</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Action</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Resource</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">IP</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
                                            <th className="w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {filtered.map((log, i) => {
                                            const actionBase = getActionBase(log.action);
                                            const ActionIcon = ACTION_ICON[actionBase] || Activity;
                                            const actionColor = ACTION_COLOR[actionBase] || 'text-muted-foreground bg-muted/30 border-border/30';
                                            const { date, time } = formatDt(log.timestamp);

                                            return (
                                                <motion.tr
                                                    key={log.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                                                    className="hover:bg-primary/[0.02] transition-colors group"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium text-foreground">{time}</span>
                                                            <span className="text-[10px] text-muted-foreground">{date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                <User size={11} className="text-primary" />
                                                            </div>
                                                            <span className="text-xs font-medium text-foreground">{log.username || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-semibold ${actionColor}`}>
                                                            <ActionIcon size={10} />
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-muted-foreground">{log.resource || '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <Globe size={11} className="text-muted-foreground/50 flex-shrink-0" />
                                                            <span className="text-xs text-muted-foreground font-mono">{log.ipAddress}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {log.success ? (
                                                            <span className="flex items-center gap-1 text-emerald-500 text-[11px] font-semibold">
                                                                <CheckCircle2 size={12} /> OK
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-red-400 text-[11px] font-semibold">
                                                                <AlertTriangle size={12} /> Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-2">
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground transition-all"
                                                            title="View details"
                                                        >
                                                            <Eye size={13} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
                                <p className="text-xs text-muted-foreground">
                                    Page {page + 1} of {totalPages} · {total.toLocaleString()} total
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-medium text-foreground px-2">{page + 1}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hash chain notice */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-muted/5">
                        <Lock size={14} className="text-muted-foreground/40 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground/55 leading-relaxed flex-1">
                            Every audit log is linked with a SHA-256 hash chain. Tampering with any record will be detected by the Verify Integrity check.
                        </p>
                        <Shield size={14} className="text-primary/30 flex-shrink-0" />
                    </div>
                </div>
            </main>

            {/* Detail Drawer */}
            <AnimatePresence>
                {selectedLog && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                                <h2 className="font-semibold text-foreground text-sm">Log Detail</h2>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-1.5 rounded-xl hover:bg-muted/50 text-muted-foreground transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
                                {/* Action header */}
                                {(() => {
                                    const ab = getActionBase(selectedLog.action);
                                    const Ico = ACTION_ICON[ab] || Activity;
                                    const col = ACTION_COLOR[ab] || 'text-muted-foreground bg-muted/30 border-border/30';
                                    return (
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${col}`}>
                                            <div className="w-10 h-10 rounded-xl bg-background/30 flex items-center justify-center">
                                                <Ico size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{selectedLog.action}</p>
                                                <p className="text-[11px] mt-0.5 opacity-70">{timeAgo(selectedLog.timestamp)}</p>
                                            </div>
                                            <div className="ml-auto">
                                                {selectedLog.success
                                                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                                                    : <AlertTriangle size={18} className="text-red-400" />}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Fields */}
                                {[
                                    { label: 'Log ID', value: selectedLog.id, icon: Hash, mono: true },
                                    { label: 'Timestamp', value: new Date(selectedLog.timestamp).toLocaleString(), icon: Clock },
                                    { label: 'User', value: selectedLog.username || selectedLog.userId || '—', icon: User },
                                    { label: 'Resource', value: selectedLog.resource || '—', icon: FileText },
                                    { label: 'Resource ID', value: selectedLog.resourceId || '—', icon: Hash, mono: true },
                                    { label: 'IP Address', value: selectedLog.ipAddress, icon: Globe, mono: true },
                                    { label: 'Device ID', value: selectedLog.deviceId || '—', icon: Monitor, mono: true },
                                ].map(({ label, value, icon: Icon, mono }) => (
                                    <div key={label} className="flex items-start gap-3 py-2.5 border-b border-border/20 last:border-0">
                                        <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Icon size={12} className="text-muted-foreground/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-0.5">{label}</p>
                                            <p className={`text-sm text-foreground/85 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                                        </div>
                                    </div>
                                ))}

                                {selectedLog.errorMessage && (
                                    <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400">
                                        <p className="font-bold mb-1">Error</p>
                                        <p>{selectedLog.errorMessage}</p>
                                    </div>
                                )}

                                {/* Hash chain */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Hash Chain</p>
                                    {selectedLog.previousHash && (
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                                            <p className="text-[10px] text-muted-foreground mb-1">Previous Hash</p>
                                            <p className="text-[10px] font-mono text-foreground/60 break-all">{selectedLog.previousHash}</p>
                                        </div>
                                    )}
                                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-400/80 mb-1">Current Hash</p>
                                        <p className="text-[10px] font-mono text-emerald-400/70 break-all">{selectedLog.currentHash}</p>
                                    </div>
                                </div>

                                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Metadata</p>
                                        <pre className="text-[10px] font-mono bg-muted/20 rounded-xl p-3 border border-border/30 text-foreground/70 overflow-auto max-h-48 scrollbar-thin">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile spacer */}
            <div className="h-[70px] lg:hidden w-full flex-shrink-0" aria-hidden="true" />
        </div>
    );
}
