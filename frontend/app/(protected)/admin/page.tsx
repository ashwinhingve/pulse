'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Shield, Users, Activity, FileText, Settings, ArrowLeft, RefreshCw,
    Search, UserPlus, Trash2, Edit, Eye, X, CheckCircle, XCircle,
    ChevronRight, Wifi, Download, Zap, Bot,
    Brain, Lock, AlertTriangle, Loader2, Server, Cpu, Database,
    Power, Radio, LayoutDashboard, User, Clock, CheckCircle2,
} from 'lucide-react';
import {
    useAuthStore, UserRole, ROLE_DISPLAY_NAMES,
    ClearanceLevel, CLEARANCE_NAMES,
} from '@/lib/store/auth';
import { getAccessToken, getStoredSession } from '@/lib/mobile-auth';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
    id: string;
    username: string;
    fullName: string;
    role: string;
    clearanceLevel: number;
    department?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt?: string;
    mfaEnabled?: boolean;
    metadata?: {
        rank?: string;
        serviceNumber?: string;
        title?: string;
        licenseNumber?: string;
        specialization?: string;
        unit?: string;
    };
}

interface AuditEntry {
    id: string;
    timestamp: string;
    action: string;
    resource?: string;
    resourceId?: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
}

interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    source: string;
    message: string;
}

type Tab = 'overview' | 'users' | 'pending' | 'profile-detail' | 'tracking' | 'logs' | 'ai-config';

interface PendingUser {
    id: string;
    username: string;
    fullName?: string;
    department?: string;
    createdAt: string;
    metadata?: {
        rank?: string;
        serviceNumber?: string;
        title?: string;
        licenseNumber?: string;
        specialization?: string;
        unit?: string;
        requestedRole?: string;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ─── Sub: User Profile Slide-over ────────────────────────────────────────────

const UserProfilePanel = ({
    user, onClose, getToken, onToggleStatus,
}: {
    user: AdminUser;
    onClose: () => void;
    getToken: () => Promise<string | null>;
    onToggleStatus: (user: AdminUser) => Promise<void>;
}) => {
    const [panelTab, setPanelTab] = useState<'profile' | 'history'>('profile');
    const [history, setHistory] = useState<AuditEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFetched, setHistoryFetched] = useState(false);
    const [toggling, setToggling] = useState(false);

    const initials = (user.fullName || user.username)
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const roleName = ROLE_DISPLAY_NAMES[user.role as UserRole] || user.role;
    const clearName = CLEARANCE_NAMES[user.clearanceLevel as ClearanceLevel] || 'UNKNOWN';
    const roleGrad =
        user.role.includes('army') ? 'from-green-600 to-emerald-700' :
        user.role.includes('public') ? 'from-blue-600 to-indigo-700' :
        'from-purple-600 to-pink-700';

    const fetchHistory = useCallback(async () => {
        if (historyLoading) return;
        setHistoryLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/audit/logs/user/${user.id}?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setHistory(await res.json());
                setHistoryFetched(true);
            }
        } catch { /* silent */ } finally {
            setHistoryLoading(false);
        }
    }, [getToken, user.id, historyLoading]);

    useEffect(() => {
        if (panelTab === 'history' && !historyFetched) {
            fetchHistory();
        }
    }, [panelTab, historyFetched, fetchHistory]);

    const handleToggle = async () => {
        setToggling(true);
        try { await onToggleStatus(user); }
        finally { setToggling(false); }
    };

    // Role-specific metadata rows
    const metadataRows: { label: string; val: string }[] = [];
    if (user.metadata) {
        if (user.role.includes('army')) {
            if (user.metadata.rank) metadataRows.push({ label: 'Rank', val: user.metadata.rank });
            if (user.metadata.serviceNumber) metadataRows.push({ label: 'Service Number', val: user.metadata.serviceNumber });
            if (user.metadata.unit) metadataRows.push({ label: 'Unit', val: user.metadata.unit });
        } else {
            if (user.metadata.title) metadataRows.push({ label: 'Title', val: user.metadata.title });
            if (user.metadata.licenseNumber) metadataRows.push({ label: 'License Number', val: user.metadata.licenseNumber });
            if (user.metadata.specialization) metadataRows.push({ label: 'Specialization', val: user.metadata.specialization });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
            <div className="w-full max-w-md bg-card border-l border-border overflow-y-auto p-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Personnel Dossier</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Avatar + Identity */}
                <div className="flex flex-col items-center text-center gap-2 py-2">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${roleGrad} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>
                        {initials}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{user.fullName || user.username}</h3>
                    <p className="text-sm text-primary font-medium">{roleName}</p>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            user.isActive
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                user.isActive
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            }`}>
                            {toggling && <Loader2 size={10} className="animate-spin" />}
                            {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-muted rounded-xl p-1">
                    {(['profile', 'history'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setPanelTab(t)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                panelTab === t
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            {t === 'profile' ? 'Profile Details' : 'Activity History'}
                        </button>
                    ))}
                </div>

                {/* ── Profile Details Tab ── */}
                {panelTab === 'profile' && (
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="bg-muted rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Basic Information</h4>
                            {[
                                { label: 'Username', val: `@${user.username}` },
                                { label: 'Account ID', val: user.id.slice(0, 18) + '…', mono: true },
                                { label: 'Department', val: user.department || '—' },
                                { label: 'Last Login', val: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never' },
                                { label: 'Created', val: new Date(user.createdAt).toLocaleDateString() },
                                ...(user.updatedAt ? [{ label: 'Last Updated', val: new Date(user.updatedAt).toLocaleDateString(), mono: false }] : []),
                            ].map(({ label, val, mono }) => (
                                <div key={label} className="flex justify-between items-start gap-2">
                                    <span className="text-muted-foreground text-xs uppercase font-bold shrink-0">{label}</span>
                                    <span className={`text-foreground font-medium text-sm text-right ${mono ? 'font-mono text-xs' : ''}`}>{val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Role-Specific Details */}
                        {metadataRows.length > 0 && (
                            <div className="bg-muted rounded-2xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {user.role.includes('army') ? 'Military Details' : 'Professional Details'}
                                </h4>
                                {metadataRows.map(({ label, val }) => (
                                    <div key={label} className="flex justify-between items-start gap-2">
                                        <span className="text-muted-foreground text-xs uppercase font-bold shrink-0">{label}</span>
                                        <span className="text-foreground font-medium text-sm text-right">{val}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Security & Access */}
                        <div className="bg-muted rounded-2xl p-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Security & Access</h4>
                            <div className="space-y-2.5">
                                {[
                                    { label: 'Clearance Level', val: clearName, ok: true },
                                    { label: 'Medical Data Access', val: 'Authorized', ok: true },
                                    { label: 'Admin Console', val: user.role === 'admin' ? 'Authorized' : 'Restricted', ok: user.role === 'admin' },
                                    { label: 'MFA Enabled', val: user.mfaEnabled ? 'Yes' : 'No', ok: !!user.mfaEnabled },
                                ].map(({ label, val, ok }) => (
                                    <div key={label} className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className={`font-semibold flex items-center gap-1 ${ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                            {ok
                                                ? <CheckCircle size={11} />
                                                : <XCircle size={11} />
                                            }
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Activity History Tab ── */}
                {panelTab === 'history' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Last 50 recorded actions</p>
                            <button
                                onClick={() => { setHistoryFetched(false); }}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                                <RefreshCw size={13} className={historyLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-primary" size={22} />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Activity size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No activity recorded.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {history.map(entry => (
                                    <div key={entry.id} className="bg-muted rounded-xl p-3 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                entry.success
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}>
                                                {entry.success ? 'Success' : 'Failed'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-foreground">{entry.action}</p>
                                        {entry.resource && (
                                            <p className="text-[10px] text-muted-foreground">
                                                {entry.resource}
                                                {entry.resourceId ? ` · ${entry.resourceId.slice(0, 8)}…` : ''}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground font-mono">{entry.ipAddress}</span>
                                            {entry.errorMessage && (
                                                <span className="text-[10px] text-destructive truncate ml-2">{entry.errorMessage}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Sub: Create/Edit Modal ───────────────────────────────────────────────────

const CreateEditModal = ({
    user, onClose, onSave,
}: {
    user: AdminUser | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}) => {
    const [form, setForm] = useState({
        username: user?.username || '',
        fullName: user?.fullName || '',
        password: '',
        role: (user?.role || UserRole.ARMY_MEDICAL_OFFICER) as string,
        clearanceLevel: user?.clearanceLevel ?? 0,
        department: user?.department || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handle = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user && form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setSaving(true);
        try {
            const payload: any = { ...form };
            if (user) delete payload.password;
            await onSave(payload);
        } catch (err: any) {
            setError(err?.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-soft-lg animate-scale-in">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-foreground">{user ? 'Edit Personnel' : 'Create Personnel'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handle} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Username *</label>
                            <input
                                required
                                value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Full Name</label>
                            <input
                                value={form.fullName}
                                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>

                    {!user && (
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Password *</label>
                            <input
                                required
                                type="password"
                                placeholder="Min 6 characters"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Role</label>
                            <select
                                value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {Object.values(UserRole).map(r => (
                                    <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Clearance</label>
                            <select
                                value={form.clearanceLevel}
                                onChange={e => setForm(f => ({ ...f, clearanceLevel: Number(e.target.value) }))}
                                className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {([0, 1, 2, 3] as ClearanceLevel[]).map(l => (
                                    <option key={l} value={l}>{CLEARANCE_NAMES[l]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Department</label>
                        <input
                            value={form.department}
                            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                            placeholder="e.g. Field Medicine, Public Health"
                            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-xl text-sm">{error}</div>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={saving}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="btn-primary text-sm flex items-center gap-2">
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {user ? 'Save Changes' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
    const router = useRouter();
    const { user, accessToken } = useAuthStore();
    const { data: nextAuthSession } = useSession();

    const [tab, setTab] = useState<Tab>('overview');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Users tab
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [viewUser, setViewUser] = useState<AdminUser | null>(null);
    const [profileDetailSearch, setProfileDetailSearch] = useState('');

    // Pending approvals tab
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [approveForm, setApproveForm] = useState<Record<string, { role: string; clearanceLevel: number }>>({});

    // Logs tab
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsFetched, setLogsFetched] = useState(false);
    const [logFilter, setLogFilter] = useState('ALL');
    const [logSearch, setLogSearch] = useState('');

    // Demo data reset
    const [resetLoading, setResetLoading] = useState(false);

    // AI Config tab
    const [aiStatus, setAiStatus] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [aiTesting, setAiTesting] = useState(false);
    const [hfKey, setHfKey] = useState('');
    const [sysPrompt, setSysPrompt] = useState('');

    const isAdmin = user?.role === UserRole.ADMIN ||
        getStoredSession()?.user?.role === 'admin';

    const getToken = useCallback(async (): Promise<string | null> => {
        if (accessToken) return accessToken;
        const t = getAccessToken();
        if (t) return t;
        if ((nextAuthSession as any)?.accessToken) return (nextAuthSession as any).accessToken;
        try {
            const { getSession } = await import('next-auth/react');
            const s = await getSession();
            return (s as any)?.accessToken ?? null;
        } catch { return null; }
    }, [accessToken, nextAuthSession]);

    const fetchUsers = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setUsers(await res.json());
        } catch { /* silent */ } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    const fetchPendingUsers = useCallback(async () => {
        setPendingLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: PendingUser[] = await res.json();
                setPendingUsers(data);
                // Pre-populate approve form with defaults
                const defaults: Record<string, { role: string; clearanceLevel: number }> = {};
                data.forEach(u => {
                    defaults[u.id] = {
                        role: u.metadata?.requestedRole || 'public_medical_official',
                        clearanceLevel: 0,
                    };
                });
                setApproveForm(prev => ({ ...defaults, ...prev }));
            }
        } catch { /* silent */ } finally {
            setPendingLoading(false);
        }
    }, [getToken]);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/audit/logs?limit=200`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: any[] = await res.json();
                const mapped: SystemLog[] = data.map(l => ({
                    id: l.id,
                    timestamp: l.timestamp || l.createdAt,
                    level: l.success === false ? 'ERROR' : l.action?.includes('fail') ? 'WARNING' : 'INFO',
                    source: l.username || l.userId || 'system',
                    message: `${l.action}${l.resource ? ` → ${l.resource}` : ''}${l.errorMessage ? ` (${l.errorMessage})` : ''}`,
                }));
                setLogs(mapped);
                setLogsFetched(true);
            } else {
                setLogs([{
                    id: 'err', timestamp: new Date().toISOString(),
                    level: 'WARNING', source: 'admin', message: `Failed to fetch logs (${res.status})`,
                }]);
                setLogsFetched(true);
            }
        } catch {
            setLogs([{
                id: 'err', timestamp: new Date().toISOString(),
                level: 'ERROR', source: 'admin', message: 'Network error fetching logs',
            }]);
            setLogsFetched(true);
        } finally {
            setLogsLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (!isAdmin) { router.replace('/dashboard'); return; }
        fetchUsers();
        fetchPendingUsers();
    }, [isAdmin, fetchUsers, fetchPendingUsers, router]);

    useEffect(() => {
        if (tab === 'logs' && !logsFetched) {
            fetchLogs();
        }
        if (tab === 'pending') {
            fetchPendingUsers();
        }
    }, [tab, logsFetched, fetchLogs, fetchPendingUsers]);

    useEffect(() => {
        if (tab !== 'ai-config') return;
        setAiLoading(true);
        getToken().then(token => {
            fetch(`${API_URL}/ai/status`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.ok ? r.json() : null)
                .then(d => setAiStatus(d))
                .catch(() => { })
                .finally(() => setAiLoading(false));
        });
    }, [tab, getToken]);

    const handleApproveUser = async (userId: string) => {
        const form = approveForm[userId];
        if (!form) return;
        setApprovingId(userId);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/${userId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: form.role, clearanceLevel: form.clearanceLevel }),
            });
            if (res.ok) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
                fetchUsers();
            }
        } catch { /* silent */ } finally {
            setApprovingId(null);
        }
    };

    const handleRejectUser = async (userId: string, username: string) => {
        if (!confirm(`Reject and delete registration for "${username}"?`)) return;
        setRejectingId(userId);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/${userId}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
            }
        } catch { /* silent */ } finally {
            setRejectingId(null);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchUsers();
        fetchPendingUsers();
        if (tab === 'logs') {
            setLogsFetched(false);
        }
    };

    const handleResetDemo = async () => {
        if (!confirm('This will delete ALL data and re-seed demo users. Are you sure?')) return;
        setResetLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/demo/reset`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                await fetchUsers();
                await fetchPendingUsers();
                setLogsFetched(false);
            } else {
                alert('Reset failed. Check server logs.');
            }
        } catch {
            alert('Network error during reset.');
        } finally {
            setResetLoading(false);
        }
    };

    const filtUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.fullName || '').toLowerCase().includes(search.toLowerCase()),
    );
    const filtLogs = logs.filter(l =>
        (logFilter === 'ALL' || l.level === logFilter) &&
        (l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
            l.source.toLowerCase().includes(logSearch.toLowerCase())),
    );

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        pending: pendingUsers.length,
    };

    const roleBadge = (role: string) =>
        role.includes('army') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
        role.includes('public') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';

    const clearBadge = (level: number) => {
        const names = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];
        const colors = [
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        ];
        return { name: names[level] ?? 'UNKNOWN', color: colors[level] ?? colors[0] };
    };

    const handleToggleStatus = async (u: AdminUser) => {
        const token = await getToken();
        const res = await fetch(`${API_URL}/users/${u.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isActive: !u.isActive }),
        });
        if (res.ok) {
            const updated = await res.json();
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...updated } : x));
            setViewUser(prev => prev && prev.id === u.id ? { ...prev, ...updated } : prev);
        }
    };

    const handleDeleteUser = async (u: AdminUser) => {
        if (!confirm(`Delete ${u.fullName || u.username}?`)) return;
        const token = await getToken();
        const res = await fetch(`${API_URL}/users/${u.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id));
    };

    const handleSaveUser = async (data: any) => {
        const token = await getToken();
        if (editUser) {
            const res = await fetch(`${API_URL}/users/${editUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updated } : u));
            } else throw new Error('Update failed');
        } else {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (res.ok) { const created = await res.json(); setUsers(prev => [...prev, created]); }
            else { const e = await res.json(); throw new Error(e.message || 'Create failed'); }
        }
        setShowModal(false);
        setEditUser(null);
    };

    const testAI = async () => {
        setAiTesting(true);
        setAiTestResult(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/ai/query-protocol`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ query: 'Confirm Clinical Logic Engine is operational. Respond with OK.' }),
            });
            if (res.ok) {
                const d = await res.json();
                setAiTestResult({ success: true, message: d.protocol?.slice(0, 300) || 'Connection successful.' });
            } else {
                setAiTestResult({ success: false, message: `HTTP ${res.status} — AI service offline or misconfigured.` });
            }
        } catch (e: any) {
            setAiTestResult({ success: false, message: e.message || 'Network error.' });
        } finally {
            setAiTesting(false);
        }
    };

    const exportCSV = () => {
        const rows = filtLogs.map(l => [l.timestamp, l.level, l.source, `"${l.message.replace(/"/g, '""')}"`]);
        const csv = [['Timestamp', 'Level', 'Source', 'Message'].join(','), ...rows.map(r => r.join(','))].join('\n');
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
            download: `pulselogic_logs_${new Date().toISOString().slice(0, 10)}.csv`,
        });
        a.click();
    };

    if (!isAdmin) return null;

    const TABS: { id: Tab; label: string; Icon: any; badge?: number; badgeColor?: string }[] = [
        { id: 'overview', label: 'Dashboard', Icon: LayoutDashboard },
        { id: 'users', label: 'User Management', Icon: Users, badge: users.length },
        { id: 'pending', label: 'Pending Approval', Icon: Clock, badge: pendingUsers.length, badgeColor: pendingUsers.length > 0 ? 'bg-amber-500 text-white' : undefined },
        { id: 'profile-detail', label: 'Profile Detail', Icon: User },
        { id: 'tracking', label: 'Live Tracking', Icon: Radio },
        { id: 'logs', label: 'System Logs', Icon: FileText },
        { id: 'ai-config', label: 'AI Configuration', Icon: Brain },
    ];

    return (
        <div className="min-h-screen bg-background safe-all">

            {/* ─── Header ─── */}
            <header className="glass border-b border-border sticky top-0 z-30 h-16">
                <div className="container-app h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-muted rounded-xl touch-target transition-colors">
                            <ArrowLeft size={22} />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-soft">
                                <Shield size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="font-bold text-foreground text-lg">Admin Console</span>
                                <p className="text-2xs text-muted-foreground">System Management</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRefresh}
                            className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-xl touch-target transition-colors">
                            <RefreshCw size={18} className={(loading || refreshing) ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Body (Sidebar + Content) ─── */}
            <div className="flex">

                {/* ── Desktop Sidebar ── */}
                <aside className="hidden sm:flex flex-col w-56 border-r border-border bg-card shrink-0 sticky top-16 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
                    <nav className="p-3 pt-4 space-y-0.5">
                        {TABS.map(({ id, label, Icon, badge, badgeColor }) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left relative ${
                                    tab === id
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                                }`}>
                                {tab === id && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                )}
                                <Icon size={18} className="shrink-0" />
                                <span className="flex-1 truncate">{label}</span>
                                {badge !== undefined && badge > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        badgeColor || (tab === id ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20')
                                    }`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* ── Content Column ── */}
                <div className="flex-1 min-w-0">

                    {/* Mobile tabs */}
                    <div className="sm:hidden border-b border-border bg-card overflow-x-auto scrollbar-hidden">
                        <div className="flex gap-1 py-2 px-4 min-w-max">
                            {TABS.map(({ id, label, Icon, badge, badgeColor }) => (
                                <button key={id} onClick={() => setTab(id)}
                                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                        tab === id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}>
                                    <Icon size={13} />
                                    <span>{label}</span>
                                    {badge !== undefined && badge > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                            badgeColor || (tab === id ? 'bg-white/20 text-white' : 'bg-muted-foreground/20')
                                        }`}>
                                            {badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── Content ─── */}
                    <main className="px-4 sm:px-6 py-6">

                {/* ══════════ OVERVIEW ══════════ */}
                {tab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Pending alert */}
                        {stats.pending > 0 && (
                            <button
                                onClick={() => setTab('pending')}
                                className="w-full flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left hover:bg-amber-500/15 transition-colors">
                                <Clock size={18} className="text-amber-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-amber-200 text-sm">
                                        {stats.pending} account request{stats.pending > 1 ? 's' : ''} pending approval
                                    </p>
                                    <p className="text-xs text-amber-300/70">Review and approve or reject new registrations</p>
                                </div>
                                <ChevronRight size={16} className="text-amber-400 shrink-0" />
                            </button>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Users', val: stats.total, Icon: Users, c: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', onClick: undefined },
                                { label: 'Active Users', val: stats.active, Icon: CheckCircle, c: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', onClick: undefined },
                                { label: 'Pending Approval', val: stats.pending, Icon: Clock, c: stats.pending > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground', onClick: stats.pending > 0 ? () => setTab('pending') : undefined },
                                { label: 'Audit Logs', val: logs.length || '—', Icon: FileText, c: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', onClick: undefined },
                            ].map(({ label, val, Icon: Ic, c, onClick }) => (
                                <div key={label} className={`card p-4 ${onClick ? 'cursor-pointer hover:border-amber-500/50 transition-all' : ''}`} onClick={onClick}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c}`}><Ic size={20} /></div>
                                        <div>
                                            <p className="text-2xs text-muted-foreground uppercase tracking-wide">{label}</p>
                                            <p className="text-2xl font-bold text-foreground">{val}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick nav */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {TABS.slice(1).map(({ id, label, Icon }) => (
                                <button key={id} onClick={() => setTab(id)}
                                    className="card p-5 text-left hover:border-primary/50 transition-all group">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                                        <Icon size={20} />
                                    </div>
                                    <p className="font-semibold text-foreground text-sm">{label}</p>
                                    <ChevronRight size={14} className="text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>

                        {/* Registered users */}
                        <div className="card p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-foreground">Registered Personnel</h2>
                                <button onClick={() => setTab('users')} className="text-sm text-primary flex items-center gap-1 hover:opacity-80">
                                    View all <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {users.slice(0, 6).map(u => {
                                    const cl = clearBadge(u.clearanceLevel);
                                    return (
                                        <div key={u.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                                    {(u.fullName || u.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">{u.fullName || u.username}</p>
                                                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>
                                                    {ROLE_DISPLAY_NAMES[u.role as UserRole] || u.role}
                                                </span>
                                                <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full ${cl.color}`}>{cl.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20} /></div>}
                            </div>
                        </div>

                        {/* Reset Demo Data */}
                        <div className="card p-5 border-red-500/20">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                        <RefreshCw size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground text-sm">Reset Demo Data</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Delete all records and re-seed demo users with correct statuses</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleResetDemo}
                                    disabled={resetLoading}
                                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                                    {resetLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    {resetLoading ? 'Resetting…' : 'Reset'}
                                </button>
                            </div>
                        </div>

                        {/* Shortcuts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => router.push('/dashboard/assistant')}
                                className="card p-5 text-left hover:border-purple-400/50 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                        <Bot size={20} />
                                    </div>
                                    <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">LIVE</span>
                                </div>
                                <h3 className="font-semibold text-foreground">Clinical Logic Engine</h3>
                                <p className="text-sm text-muted-foreground">BioMistral-7B + AIIMS Antibiotic Guidelines</p>
                            </button>
                            <button onClick={() => router.push('/dashboard/education')}
                                className="card p-5 text-left hover:border-emerald-400/50 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-[#0f766e] rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <Brain size={18} />
                                    </div>
                                    <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">AIIMS</span>
                                </div>
                                <h3 className="font-semibold text-foreground">Antibiotic Policy Library</h3>
                                <p className="text-sm text-muted-foreground">Clinical reference + diagnostic assistant</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════ USERS ══════════ */}
                {tab === 'users' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    placeholder="Search personnel..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>
                            <button
                                onClick={() => { setEditUser(null); setShowModal(true); }}
                                className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
                                <UserPlus size={16} /> Create User
                            </button>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            {['Personnel', 'Role', 'Clearance', 'Status', 'Actions'].map(h => (
                                                <th key={h} className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={5} className="p-8 text-center">
                                                <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                                            </td></tr>
                                        ) : filtUsers.map(u => {
                                            const cl = clearBadge(u.clearanceLevel);
                                            return (
                                                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => setViewUser(u)}
                                                            className="flex items-center gap-3 text-left group">
                                                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                                                {(u.fullName || u.username).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{u.fullName || u.username}</p>
                                                                <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${roleBadge(u.role)}`}>
                                                            {ROLE_DISPLAY_NAMES[u.role as UserRole] || u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${cl.color}`}>{cl.name}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`flex items-center gap-1.5 text-xs ${u.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setViewUser(u)}
                                                                className="p-2 hover:bg-muted rounded-lg transition-colors" title="View Profile">
                                                                <Eye size={15} className="text-muted-foreground" />
                                                            </button>
                                                            <button onClick={() => { setEditUser(u); setShowModal(true); }}
                                                                className="p-2 hover:bg-muted rounded-lg transition-colors" title="Edit">
                                                                <Edit size={15} className="text-primary" />
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(u)}
                                                                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                                                                <Trash2 size={15} className="text-destructive" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!loading && filtUsers.length === 0 && (
                                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No users found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════ PENDING APPROVAL ══════════ */}
                {tab === 'pending' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Pending Approvals</h2>
                                <p className="text-sm text-muted-foreground">Review and approve or reject new account requests</p>
                            </div>
                            <button onClick={fetchPendingUsers}
                                className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-xl touch-target transition-colors">
                                <RefreshCw size={16} className={pendingLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {pendingLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="animate-spin text-primary" size={28} />
                            </div>
                        ) : pendingUsers.length === 0 ? (
                            <div className="card p-12 text-center">
                                <CheckCircle2 size={40} className="mx-auto mb-3 text-green-500 opacity-60" />
                                <h3 className="font-semibold text-foreground mb-1">No Pending Requests</h3>
                                <p className="text-sm text-muted-foreground">All account requests have been processed.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingUsers.map(u => {
                                    const form = approveForm[u.id] || { role: 'public_medical_official', clearanceLevel: 0 };
                                    const requestedRole = u.metadata?.requestedRole || 'public_medical_official';
                                    const isArmy = requestedRole === 'army_medical_officer';
                                    const roleGrad = isArmy ? 'from-green-600 to-emerald-700' : 'from-blue-600 to-indigo-700';
                                    const initials = (u.fullName || u.username).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

                                    return (
                                        <div key={u.id} className="card p-5 border-l-4 border-l-amber-500">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleGrad} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                                    {initials}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h3 className="font-semibold text-foreground">{u.fullName || u.username}</h3>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                                                            PENDING
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-mono">@{u.username}</p>
                                                    {u.department && <p className="text-xs text-muted-foreground mt-0.5">{u.department}</p>}

                                                    {/* Requested role tag */}
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs text-muted-foreground">Requested:</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isArmy ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                            {ROLE_DISPLAY_NAMES[requestedRole as UserRole] || requestedRole}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">·</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                                                    </div>

                                                    {/* Role-specific metadata */}
                                                    {u.metadata && (
                                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                                            {u.metadata.rank && <span className="text-xs text-muted-foreground">Rank: <strong className="text-foreground">{u.metadata.rank}</strong></span>}
                                                            {u.metadata.serviceNumber && <span className="text-xs text-muted-foreground">SN: <strong className="text-foreground font-mono">{u.metadata.serviceNumber}</strong></span>}
                                                            {u.metadata.unit && <span className="text-xs text-muted-foreground">Unit: <strong className="text-foreground">{u.metadata.unit}</strong></span>}
                                                            {u.metadata.title && <span className="text-xs text-muted-foreground">Title: <strong className="text-foreground">{u.metadata.title}</strong></span>}
                                                            {u.metadata.licenseNumber && <span className="text-xs text-muted-foreground">License: <strong className="text-foreground font-mono">{u.metadata.licenseNumber}</strong></span>}
                                                            {u.metadata.specialization && <span className="text-xs text-muted-foreground">Specialization: <strong className="text-foreground">{u.metadata.specialization}</strong></span>}
                                                        </div>
                                                    )}

                                                    {/* Approval controls */}
                                                    <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                                                            <select
                                                                value={form.role}
                                                                onChange={e => setApproveForm(prev => ({ ...prev, [u.id]: { ...form, role: e.target.value } }))}
                                                                className="px-3 py-2 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/50">
                                                                <option value="army_medical_officer">Army Medical Officer</option>
                                                                <option value="public_medical_official">Public Medical Official</option>
                                                            </select>
                                                            <select
                                                                value={form.clearanceLevel}
                                                                onChange={e => setApproveForm(prev => ({ ...prev, [u.id]: { ...form, clearanceLevel: Number(e.target.value) } }))}
                                                                className="px-3 py-2 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/50">
                                                                <option value={0}>UNCLASSIFIED</option>
                                                                <option value={1}>CONFIDENTIAL</option>
                                                                <option value={2}>SECRET</option>
                                                                <option value={3}>TOP SECRET</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleApproveUser(u.id)}
                                                                disabled={approvingId === u.id || rejectingId === u.id}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors">
                                                                {approvingId === u.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectUser(u.id, u.username)}
                                                                disabled={approvingId === u.id || rejectingId === u.id}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50 text-destructive rounded-xl text-xs font-semibold transition-colors">
                                                                {rejectingId === u.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ PERSONNEL STATUS ══════════ */}
                {tab === 'tracking' && (
                    <div className="animate-fade-in space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Personnel Status</h2>
                            <p className="text-sm text-muted-foreground">Current status of all registered system users</p>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            {['Name', 'Role', 'Clearance', 'Department', 'Status', 'Last Login'].map(h => (
                                                <th key={h} className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={6} className="p-8 text-center">
                                                <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                                            </td></tr>
                                        ) : users.map(u => {
                                            const cl = clearBadge(u.clearanceLevel);
                                            return (
                                                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                                                                {(u.fullName || u.username).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground text-sm">{u.fullName || u.username}</p>
                                                                <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>
                                                            {ROLE_DISPLAY_NAMES[u.role as UserRole] || u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${cl.color}`}>{cl.name}</span>
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground">
                                                        {u.department || '—'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`flex items-center gap-1.5 text-xs ${u.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs text-muted-foreground">
                                                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!loading && users.length === 0 && (
                                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">No personnel found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════ SYSTEM LOGS ══════════ */}
                {tab === 'logs' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">System Logs</h2>
                                <p className="text-sm text-muted-foreground">Hash-chained audit trail · {filtLogs.length} entries shown</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        placeholder="Search message/source..."
                                        value={logSearch}
                                        onChange={e => setLogSearch(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 w-52 transition-all"
                                    />
                                </div>
                                <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                                    className="bg-muted border border-border text-sm rounded-xl px-3 py-2 outline-none">
                                    {['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <button onClick={exportCSV}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm font-medium transition-colors">
                                    <Download size={14} /> Export CSV
                                </button>
                                <button
                                    onClick={() => { setLogsFetched(false); fetchLogs(); }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm font-medium transition-colors">
                                    <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} /> Refresh
                                </button>
                            </div>
                        </div>

                        {logsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : (
                            <div className="card overflow-hidden">
                                <div className="overflow-x-auto" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                    <table className="w-full">
                                        <thead className="bg-muted sticky top-0 z-10">
                                            <tr>
                                                {['Timestamp', 'Level', 'Source', 'Message'].map(h => (
                                                    <th key={h} className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border font-mono text-xs">
                                            {filtLogs.map(l => (
                                                <tr key={l.id} className="hover:bg-muted/40 transition-colors even:bg-muted/20">
                                                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                                            l.level === 'CRITICAL' ? 'bg-red-900/40 text-red-400' :
                                                            l.level === 'ERROR' ? 'bg-orange-900/40 text-orange-400' :
                                                            l.level === 'WARNING' ? 'bg-yellow-900/30 text-yellow-500 dark:text-yellow-400' :
                                                            'bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                        }`}>{l.level}</span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{l.source}</td>
                                                    <td className="p-3 text-foreground">{l.message}</td>
                                                </tr>
                                            ))}
                                            {filtLogs.length === 0 && (
                                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                                                    {logsFetched ? 'No logs match the current filter.' : 'Loading audit logs...'}
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ AI CONFIG ══════════ */}
                {tab === 'ai-config' && (
                    <div className="space-y-6 max-w-4xl animate-fade-in">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">AI Integration Settings</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Configure the Clinical Logic Engine (BioMistral-7B + AIIMS Guidelines)
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Engine Status */}
                            <div className="card p-6 space-y-4">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Cpu size={18} className="text-primary" /> Engine Status
                                </h3>
                                {aiLoading ? (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                                        <Loader2 size={16} className="animate-spin" /> Fetching status…
                                    </div>
                                ) : aiStatus ? (
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Model', val: aiStatus.model || 'BioMistral-7B', Icon: Brain },
                                            { label: 'Provider', val: 'HuggingFace Inference API', Icon: Server },
                                            { label: 'HF API Key', val: aiStatus.hfApiKeyConfigured ? 'Configured ✓' : 'Not configured', Icon: Lock },
                                            { label: 'Guidelines Loaded', val: `${aiStatus.guidelinesCount ?? 0} entries`, Icon: Database },
                                            { label: 'Data Anonymization', val: 'Active', Icon: Shield },
                                        ].map(({ label, val, Icon: Ic }) => (
                                            <div key={label} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground"><Ic size={14} />{label}</div>
                                                <span className="font-medium text-foreground">{val}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                                            <span className={`w-2.5 h-2.5 rounded-full ${aiStatus.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                                            <span className={`text-sm font-semibold ${aiStatus.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {aiStatus.status === 'online' ? 'Operational' : 'Degraded / Cold Start'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Unable to reach AI status endpoint.</p>
                                )}
                                <button onClick={() => {
                                    setAiLoading(true);
                                    setAiStatus(null);
                                    getToken().then(t => fetch(`${API_URL}/ai/status`, { headers: { Authorization: `Bearer ${t}` } })
                                        .then(r => r.ok ? r.json() : null)
                                        .then(d => setAiStatus(d))
                                        .catch(() => { })
                                        .finally(() => setAiLoading(false)));
                                }} className="btn-secondary text-sm flex items-center gap-2 w-full justify-center">
                                    <RefreshCw size={14} /> Refresh Status
                                </button>
                            </div>

                            {/* Connection Test */}
                            <div className="card p-6 space-y-4">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Zap size={18} className="text-green-500" /> Connection Test
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Sends a live test packet to the Clinical Logic Engine to verify BioMistral-7B connectivity.
                                </p>
                                <button
                                    onClick={testAI} disabled={aiTesting}
                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                                        aiTesting ? 'bg-muted text-muted-foreground cursor-wait' : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                                    }`}>
                                    {aiTesting ? <><Loader2 size={16} className="animate-spin" /> Connecting…</> : 'Test Connection'}
                                </button>
                                {aiTestResult && (
                                    <div className={`p-4 rounded-xl border ${
                                        aiTestResult.success
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`w-2 h-2 rounded-full ${aiTestResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className={`font-bold text-sm ${aiTestResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                                {aiTestResult.success ? 'Connection Successful' : 'Connection Failed'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-foreground/80 line-clamp-4">{aiTestResult.message}</p>
                                    </div>
                                )}
                            </div>

                            {/* Endpoint Config — full width */}
                            <div className="card p-6 space-y-5 md:col-span-2">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Settings size={18} className="text-blue-500" /> Endpoint Configuration
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Backend Endpoint</label>
                                        <input readOnly value={API_URL}
                                            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm font-mono text-muted-foreground outline-none" />
                                        <p className="text-xs text-muted-foreground mt-1">Set via NEXT_PUBLIC_API_URL env</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Clinical Logic Engine</label>
                                        <input readOnly value="BioMistral-7B — HuggingFace Inference API"
                                            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm font-mono text-muted-foreground outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">HuggingFace API Key</label>
                                        <input type="password" placeholder="hf_xxxxxxxxxx (stored on backend)"
                                            value={hfKey} onChange={e => setHfKey(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                                        <p className="text-xs text-muted-foreground mt-1">Requires backend restart to take effect</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Data Anonymization</label>
                                        <div className="flex items-center gap-3 px-3 py-2.5 bg-muted border border-border rounded-xl">
                                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-sm text-foreground font-medium">Enabled — all patient data anonymized</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">System Prompt Override</label>
                                    <textarea rows={4}
                                        placeholder="Leave blank to use default BioMistral-7B system prompt configured server-side…"
                                        value={sysPrompt} onChange={e => setSysPrompt(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all" />
                                </div>

                                {/* AIIMS Guidelines quick link */}
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-muted rounded-xl border border-border">
                                    <div className="w-10 h-10 bg-[#0f766e] rounded-xl flex items-center justify-center text-white shrink-0">
                                        <Brain size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground text-sm">AIIMS Antibiotic Policy</p>
                                        <p className="text-xs text-muted-foreground">9 clinical articles loaded · CAP, Endocarditis, BSI, ABRS, and more</p>
                                    </div>
                                    <button onClick={() => router.push('/dashboard/education')}
                                        className="text-sm text-[#0f766e] dark:text-emerald-400 font-semibold flex items-center gap-1 hover:opacity-80 whitespace-nowrap">
                                        Open Library <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3 pt-1">
                                    <button onClick={() => router.push('/dashboard/assistant')}
                                        className="btn-secondary text-sm flex items-center gap-2">
                                        <Bot size={14} /> Open Logic Engine
                                    </button>
                                    <button
                                        onClick={() => alert('Configuration saved locally. Restart backend to apply HF key changes.')}
                                        className="btn-primary text-sm flex items-center gap-2">
                                        <Power size={14} /> Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════ PROFILE DETAIL ══════════ */}
                {tab === 'profile-detail' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Profile Detail</h2>
                            <p className="text-sm text-muted-foreground">Click any personnel card to view their full dossier and activity history</p>
                        </div>

                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                placeholder="Search personnel..."
                                value={profileDetailSearch}
                                onChange={e => setProfileDetailSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users
                                    .filter(u =>
                                        u.username.toLowerCase().includes(profileDetailSearch.toLowerCase()) ||
                                        (u.fullName || '').toLowerCase().includes(profileDetailSearch.toLowerCase())
                                    )
                                    .map(u => {
                                        const cl = clearBadge(u.clearanceLevel);
                                        const roleGrad =
                                            u.role.includes('army') ? 'from-green-600 to-emerald-700' :
                                            u.role.includes('public') ? 'from-blue-600 to-indigo-700' :
                                            'from-purple-600 to-pink-700';
                                        const initials = (u.fullName || u.username)
                                            .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => setViewUser(u)}
                                                className="card p-5 text-left hover:border-primary/50 transition-all group">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${roleGrad} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground truncate">{u.fullName || u.username}</p>
                                                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge(u.role)}`}>
                                                        {ROLE_DISPLAY_NAMES[u.role as UserRole] || u.role}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${cl.color}`}>{cl.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`flex items-center gap-1.5 text-xs ${u.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        {u.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                                                        View Dossier <ChevronRight size={12} />
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                {users.filter(u =>
                                    u.username.toLowerCase().includes(profileDetailSearch.toLowerCase()) ||
                                    (u.fullName || '').toLowerCase().includes(profileDetailSearch.toLowerCase())
                                ).length === 0 && (
                                    <div className="col-span-full text-center py-10 text-muted-foreground text-sm">
                                        No personnel found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                    </main>
                </div>
            </div>

            {/* User Profile Slide-over */}
            {viewUser && (
                <UserProfilePanel
                    user={viewUser}
                    onClose={() => setViewUser(null)}
                    getToken={getToken}
                    onToggleStatus={handleToggleStatus}
                />
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <CreateEditModal
                    user={editUser}
                    onClose={() => { setShowModal(false); setEditUser(null); }}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
