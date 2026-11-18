'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Shield,
    Users,
    Clock,
    Activity,
    Brain,
    RefreshCw,
    Plus,
    Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
    useAuthStore,
    UserRole,
    ROLE_DISPLAY_NAMES,
    CLEARANCE_NAMES,
    ClearanceLevel,
} from '@/lib/store/auth';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import ErrorBanner from '@/components/ui/ErrorBanner';

interface Personnel {
    id: string;
    username: string;
    fullName?: string;
    department?: string;
    role: UserRole;
    clearanceLevel: ClearanceLevel;
    isActive: boolean;
    status: string;
    mfaEnabled?: boolean;
    createdAt: string;
    lastLoginAt?: string;
    metadata?: Record<string, string>;
}
interface AuditEntry {
    id: string;
    timestamp: string;
    username?: string;
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    success: boolean;
    errorMessage?: string;
    ipAddress: string;
}
interface AIStatus {
    status: string;
    provider: string;
    model: string | null;
    visionModel: string | null;
    error?: string;
    bioMistralProvider: string;
    guidelinesLoaded: number;
    source: string;
    guidelineCategories: string[];
}
interface Integrity {
    intact: boolean;
    currentChainIntact: boolean;
    verifiedEntries: number;
    legacyCount: number;
    message: string;
}
const sections = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'pending', label: 'Pending Approvals', icon: Clock },
    { id: 'audit', label: 'Audit Activity', icon: Activity },
    { id: 'ai', label: 'AI Status', icon: Brain },
] as const;
type Section = (typeof sections)[number]['id'];
const message = (error: any) => {
    const value =
        error.response?.data?.message ||
        error.message ||
        'Request failed. Please retry.';
    return Array.isArray(value) ? value.join(', ') : String(value);
};
const roleName = (role: UserRole) => ROLE_DISPLAY_NAMES[role] || role;
const date = (value?: string) =>
    value ? new Date(value).toLocaleString() : 'Never';

export default function AdminPage() {
    const currentUser = useAuthStore((s) => s.user);
    const [section, setSection] = useState<Section>('overview');
    const [users, setUsers] = useState<Personnel[]>([]);
    const [userTotal, setUserTotal] = useState(0);
    const [summary, setSummary] = useState({ total: 0, active: 0 });
    const [pending, setPending] = useState<Personnel[]>([]);
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [ai, setAI] = useState<AIStatus | null>(null);
    const [integrity, setIntegrity] = useState<Integrity | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('all');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(0);
    const [hasMoreLogs, setHasMoreLogs] = useState(false);
    const [editing, setEditing] = useState<Personnel | null | undefined>(
        undefined,
    );
    const [viewing, setViewing] = useState<Personnel | null>(null);
    const [history, setHistory] = useState<AuditEntry[] | null>(null);
    const [historyError, setHistoryError] = useState('');
    const [approval, setApproval] = useState<
        Record<string, { role: UserRole; clearanceLevel: number }>
    >({});
    const [confirmation, setConfirmation] = useState<{
        title: string;
        description: string;
        run: () => Promise<void>;
    } | null>(null);

    useEffect(() => {
        const update = () => {
            const aliases: Record<string, Section> = {
                logs: 'audit',
                'ai-config': 'ai',
                tracking: 'users',
                'profile-detail': 'users',
            };
            const hash = window.location.hash.slice(1);
            setSection(
                sections.some((s) => s.id === hash)
                    ? (hash as Section)
                    : aliases[hash] || 'overview',
            );
        };
        update();
        window.addEventListener('hashchange', update);
        return () => window.removeEventListener('hashchange', update);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [personnel, approvals, counts] = await Promise.all([
                api.get('/users', {
                    params: {
                        page: page + 1,
                        limit: 20,
                        search: section === 'users' ? search : '',
                        role,
                        status,
                    },
                }),
                api.get('/users/pending'),
                api.get('/users/summary'),
            ]);
            setUsers(personnel.data.items);
            setUserTotal(personnel.data.total);
            setPending(approvals.data);
            setSummary(counts.data);
            if (section === 'audit') {
                const response = await api.get('/audit/logs?limit=50&offset=0');
                setLogs(response.data);
                setHasMoreLogs(response.data.length === 50);
            }
            if (section === 'ai') setAI((await api.get('/ai/status')).data);
        } catch (err) {
            setError(message(err));
        } finally {
            setLoading(false);
        }
    }, [section, page, search, role, status]);
    useEffect(() => {
        if (currentUser?.role === UserRole.ADMIN) load();
    }, [load, currentUser?.role]);
    useEffect(() => {
        setPage(0);
    }, [search, role, status]);
    useEffect(() => {
        if (!viewing) return;
        let cancelled = false;
        setHistory(null);
        setHistoryError('');
        api.get(`/audit/logs/user/${viewing.id}?limit=50`)
            .then((r) => {
                if (!cancelled) setHistory(r.data);
            })
            .catch((err) => {
                if (!cancelled) setHistoryError(message(err));
            });
        return () => {
            cancelled = true;
        };
    }, [viewing]);

    const perform = async (action: () => Promise<void>, text: string) => {
        setBusy(true);
        setError('');
        setSuccess('');
        try {
            await action();
            if (text) setSuccess(text);
            return true;
        } catch (err) {
            setError(message(err));
            return false;
        } finally {
            setBusy(false);
        }
    };
    const changeStatus = (user: Personnel) =>
        setConfirmation({
            title: user.isActive ? 'Deactivate account?' : 'Activate account?',
            description: `${user.fullName || user.username} will ${user.isActive ? 'lose' : 'gain'} access to the application.`,
            run: async () => {
                await api.patch(`/users/${user.id}`, {
                    isActive: !user.isActive,
                });
                await load();
            },
        });
    const filtered = users;
    const visible = filtered;
    const pendingForm = (user: Personnel) =>
        approval[user.id] || {
            role:
                user.metadata?.requestedRole === UserRole.ARMY_MEDICAL_OFFICER
                    ? UserRole.ARMY_MEDICAL_OFFICER
                    : UserRole.PUBLIC_MEDICAL_OFFICIAL,
            clearanceLevel: 0,
        };
    if (currentUser?.role !== UserRole.ADMIN)
        return (
            <main className="p-8">
                <h1 className="text-xl font-bold">
                    Administrator access required
                </h1>
                <Link href="/dashboard" className="btn-secondary mt-4">
                    Return to dashboard
                </Link>
            </main>
        );
    return (
        <div className="min-h-screen bg-background safe-all">
            <header className="border-b border-border bg-card/90 sticky top-0 z-30">
                <div className="container-app flex items-center justify-between gap-3 py-4">
                    <div>
                        <Link
                            href="/dashboard"
                            className="text-xs text-primary"
                        >
                            ← Clinical dashboard
                        </Link>
                        <h1 className="text-xl font-bold mt-1">
                            Admin Console
                        </h1>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading || busy}
                        className="btn-secondary"
                        aria-label="Refresh admin data"
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            </header>
            <div className="flex flex-col lg:flex-row">
                <nav
                    aria-label="Administration"
                    className="lg:w-60 shrink-0 bg-card border-b lg:border-r border-border p-3 flex overflow-x-auto lg:flex-col gap-2 lg:sticky lg:top-24 lg:self-start"
                >
                    {sections.map(({ id, label, icon: Icon }) => (
                        <a
                            key={id}
                            href={`#${id}`}
                            aria-current={section === id ? 'page' : undefined}
                            className={`flex items-center gap-2 p-3 rounded-xl whitespace-nowrap text-sm ${section === id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            <Icon size={18} />
                            {label}
                            {id === 'pending' && pending.length > 0 && (
                                <span className="rounded-full bg-amber-500/20 px-2">
                                    {pending.length}
                                </span>
                            )}
                        </a>
                    ))}
                </nav>
                <main className="flex-1 min-w-0 p-4 lg:p-8 max-w-7xl space-y-5">
                    {error && (
                        <ErrorBanner
                            message={error}
                            onDismiss={() => setError('')}
                        />
                    )}
                    {error && (
                        <button onClick={load} className="btn-secondary">
                            Retry loading
                        </button>
                    )}
                    {success && (
                        <p
                            role="status"
                            className="rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-3"
                        >
                            {success}
                        </p>
                    )}
                    {loading && (
                        <p
                            role="status"
                            className="text-sm text-muted-foreground"
                        >
                            Refreshing data…
                        </p>
                    )}
                    {section === 'overview' && (
                        <>
                            <h2 className="text-lg font-semibold">
                                System Overview
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    ['Registered users', summary.total],
                                    ['Active users', summary.active],
                                    ['Pending approvals', pending.length],
                                ].map(([label, count]) => (
                                    <div className="card p-5" key={label}>
                                        <p className="text-sm text-muted-foreground">
                                            {label}
                                        </p>
                                        <p className="text-3xl font-bold mt-2">
                                            {loading || error ? '—' : count}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="card p-5 space-y-3">
                                <h3 className="font-semibold">
                                    Administration tasks
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Review registrations, manage personnel
                                    access, and inspect recorded activity.
                                    Patient records remain shared across
                                    clinical roles; cases and documents also use
                                    clearance checks.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <a href="#pending" className="btn-primary">
                                        Review approvals
                                    </a>
                                    <a href="#users" className="btn-secondary">
                                        Manage users
                                    </a>
                                    <a href="#audit" className="btn-secondary">
                                        Inspect audit activity
                                    </a>
                                </div>
                            </div>
                            <details className="card p-5">
                                <summary className="cursor-pointer font-semibold">
                                    Demo maintenance
                                </summary>
                                <p className="text-sm text-muted-foreground my-3">
                                    Reset deletes application data and recreates
                                    demonstration records. Use only in a
                                    disposable demo environment.
                                </p>
                                <button
                                    className="btn-secondary text-destructive"
                                    disabled={busy}
                                    onClick={() =>
                                        setConfirmation({
                                            title: 'Reset all demonstration data?',
                                            description:
                                                'All application data will be deleted and demo records will be re-created. This cannot be undone.',
                                            run: async () => {
                                                await api.post('/demo/reset');
                                                await load();
                                            },
                                        })
                                    }
                                >
                                    Reset demo data
                                </button>
                            </details>
                        </>
                    )}
                    {section === 'users' && (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold">
                                    Users & Personnel Status
                                </h2>
                                <button
                                    className="btn-primary"
                                    onClick={() => setEditing(null)}
                                >
                                    <Plus size={16} /> Add user
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                                <label
                                    className="sr-only"
                                    htmlFor="personnel-search"
                                >
                                    Search users
                                </label>
                                <input
                                    id="personnel-search"
                                    className="form-input"
                                    placeholder="Search name or department"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <select
                                    className="form-input"
                                    aria-label="Filter role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="all">All roles</option>
                                    {Object.values(UserRole).map((r) => (
                                        <option key={r} value={r}>
                                            {roleName(r)}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="form-input"
                                    aria-label="Filter account status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="all">All statuses</option>
                                    {['pending', 'active', 'suspended'].map(
                                        (s) => (
                                            <option key={s}>{s}</option>
                                        ),
                                    )}
                                </select>
                            </div>
                            {!loading && !error && !filtered.length && (
                                <p className="card p-5 text-muted-foreground">
                                    No users match these filters.
                                </p>
                            )}
                            <div className="hidden md:block card overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-border">
                                            {[
                                                'Personnel',
                                                'Role / Clearance',
                                                'Status',
                                                'Last login',
                                                'Actions',
                                            ].map((h) => (
                                                <th className="p-4" key={h}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="p-4">
                                                    <button
                                                        className="text-primary text-left font-semibold"
                                                        onClick={() =>
                                                            setViewing(user)
                                                        }
                                                    >
                                                        {user.fullName ||
                                                            user.username}
                                                    </button>
                                                    <p className="text-xs text-muted-foreground">
                                                        @{user.username} ·{' '}
                                                        {user.department ||
                                                            'No department'}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    {roleName(user.role)}
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            CLEARANCE_NAMES[
                                                                user
                                                                    .clearanceLevel
                                                            ]
                                                        }
                                                    </p>
                                                </td>
                                                <td className="p-4 capitalize">
                                                    {user.status}
                                                </td>
                                                <td className="p-4">
                                                    {date(user.lastLoginAt)}
                                                </td>
                                                <td className="p-4">
                                                    <UserActions
                                                        user={user}
                                                        currentId={
                                                            currentUser.id
                                                        }
                                                        busy={busy}
                                                        onEdit={() =>
                                                            setEditing(user)
                                                        }
                                                        onStatus={() =>
                                                            changeStatus(user)
                                                        }
                                                        onDelete={() =>
                                                            setConfirmation({
                                                                title: 'Delete user?',
                                                                description: `Remove ${user.username}'s access? Their recorded audit history is retained.`,
                                                                run: async () => {
                                                                    await api.delete(
                                                                        `/users/${user.id}`,
                                                                    );
                                                                    await load();
                                                                },
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden space-y-3">
                                {visible.map((user) => (
                                    <article
                                        key={user.id}
                                        className="card p-4 space-y-3"
                                    >
                                        <button
                                            onClick={() => setViewing(user)}
                                            className="font-semibold text-primary"
                                        >
                                            {user.fullName || user.username}
                                        </button>
                                        <p className="text-sm">
                                            {roleName(user.role)} ·{' '}
                                            {user.status}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {
                                                CLEARANCE_NAMES[
                                                    user.clearanceLevel
                                                ]
                                            }{' '}
                                            · Last login:{' '}
                                            {date(user.lastLoginAt)}
                                        </p>
                                        <UserActions
                                            user={user}
                                            currentId={currentUser.id}
                                            busy={busy}
                                            onEdit={() => setEditing(user)}
                                            onStatus={() => changeStatus(user)}
                                            onDelete={() =>
                                                setConfirmation({
                                                    title: 'Delete user?',
                                                    description: `Remove access for ${user.username}?`,
                                                    run: async () => {
                                                        await api.delete(
                                                            `/users/${user.id}`,
                                                        );
                                                        await load();
                                                    },
                                                })
                                            }
                                        />
                                    </article>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    disabled={!page}
                                    className="btn-secondary"
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </button>
                                <span className="text-sm">
                                    Page {page + 1} · {userTotal} users
                                </span>
                                <button
                                    disabled={(page + 1) * 20 >= userTotal}
                                    className="btn-secondary"
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                    {section === 'pending' && (
                        <>
                            <h2 className="text-lg font-semibold">
                                Pending Approvals
                            </h2>
                            {!loading && !error && !pending.length && (
                                <p className="card p-5">
                                    No registrations await approval.
                                </p>
                            )}
                            {pending.map((user) => {
                                const form = pendingForm(user);
                                return (
                                    <article
                                        key={user.id}
                                        className="card p-5 space-y-4"
                                    >
                                        <div>
                                            <h3 className="font-semibold">
                                                {user.fullName || user.username}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                @{user.username} · Submitted{' '}
                                                {date(user.createdAt)}
                                            </p>
                                            <p className="text-sm mt-2">
                                                {user.department ||
                                                    'No department'}{' '}
                                                · Requested:{' '}
                                                {user.metadata?.requestedRole ||
                                                    'public_medical_official'}
                                            </p>
                                            <dl className="text-xs text-muted-foreground mt-2">
                                                {Object.entries(
                                                    user.metadata || {},
                                                )
                                                    .filter(
                                                        ([key]) =>
                                                            key !==
                                                            'requestedRole',
                                                    )
                                                    .map(([key, value]) => (
                                                        <div key={key}>
                                                            <dt className="inline font-medium">
                                                                {key}:{' '}
                                                            </dt>
                                                            <dd className="inline">
                                                                {value}
                                                            </dd>
                                                        </div>
                                                    ))}
                                            </dl>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <select
                                                aria-label={`Approved role for ${user.username}`}
                                                className="form-input"
                                                value={form.role}
                                                onChange={(e) =>
                                                    setApproval((p) => ({
                                                        ...p,
                                                        [user.id]: {
                                                            ...form,
                                                            role: e.target
                                                                .value as UserRole,
                                                        },
                                                    }))
                                                }
                                            >
                                                {Object.values(UserRole).map(
                                                    (r) => (
                                                        <option
                                                            key={r}
                                                            value={r}
                                                        >
                                                            {roleName(r)}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <select
                                                aria-label={`Clearance for ${user.username}`}
                                                className="form-input"
                                                value={form.clearanceLevel}
                                                onChange={(e) =>
                                                    setApproval((p) => ({
                                                        ...p,
                                                        [user.id]: {
                                                            ...form,
                                                            clearanceLevel:
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        },
                                                    }))
                                                }
                                            >
                                                {Object.entries(
                                                    CLEARANCE_NAMES,
                                                ).map(([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                disabled={busy}
                                                className="btn-primary"
                                                onClick={() =>
                                                    setConfirmation({
                                                        title: 'Approve registration?',
                                                        description: `Grant ${user.username} the ${roleName(form.role)} role and ${CLEARANCE_NAMES[form.clearanceLevel as ClearanceLevel]} clearance?`,
                                                        run: async () => {
                                                            await api.post(
                                                                `/users/${user.id}/approve`,
                                                                form,
                                                            );
                                                            await load();
                                                        },
                                                    })
                                                }
                                            >
                                                Approve
                                            </button>
                                            <button
                                                disabled={busy}
                                                className="btn-secondary text-destructive"
                                                onClick={() =>
                                                    setConfirmation({
                                                        title: 'Reject registration?',
                                                        description: `Reject ${user.username}'s registration?`,
                                                        run: async () => {
                                                            await api.post(
                                                                `/users/${user.id}/reject`,
                                                            );
                                                            await load();
                                                        },
                                                    })
                                                }
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </>
                    )}
                    {section === 'audit' && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold">
                                    Audit Activity
                                </h2>
                                <button
                                    disabled={busy}
                                    className="btn-secondary"
                                    onClick={() =>
                                        perform(async () => {
                                            setIntegrity(
                                                (await api.get('/audit/verify'))
                                                    .data,
                                            );
                                        }, 'Integrity check completed.')
                                    }
                                >
                                    Verify integrity
                                </button>
                            </div>
                            {integrity && (
                                <div className="card p-4" role="status">
                                    <p
                                        className={
                                            integrity.currentChainIntact
                                                ? 'text-primary'
                                                : 'text-destructive'
                                        }
                                    >
                                        {integrity.message}
                                    </p>
                                    <p className="text-sm">
                                        {integrity.verifiedEntries} verified
                                        entries · {integrity.legacyCount} legacy
                                        entries
                                    </p>
                                </div>
                            )}
                            <input
                                className="form-input"
                                aria-label="Search loaded audit entries"
                                placeholder="Search loaded activity"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <AuditList
                                logs={logs.filter((log) =>
                                    `${log.action} ${log.username || log.userId || ''}`
                                        .toLowerCase()
                                        .includes(search.toLowerCase()),
                                )}
                            />
                            {hasMoreLogs && (
                                <button
                                    className="btn-secondary"
                                    disabled={busy}
                                    onClick={() =>
                                        perform(async () => {
                                            const response = await api.get(
                                                `/audit/logs?limit=50&offset=${logs.length}`,
                                            );
                                            setLogs((previous) => [
                                                ...previous,
                                                ...response.data,
                                            ]);
                                            setHasMoreLogs(
                                                response.data.length === 50,
                                            );
                                        }, 'More activity loaded.')
                                    }
                                >
                                    Load older activity
                                </button>
                            )}
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    const rows = [
                                        [
                                            'Timestamp',
                                            'Actor',
                                            'Action',
                                            'Result',
                                        ],
                                        ...logs.map((log) => [
                                            log.timestamp,
                                            log.username ||
                                                log.userId ||
                                                'system',
                                            log.action,
                                            log.success ? 'success' : 'failed',
                                        ]),
                                    ];
                                    const csv = rows
                                        .map((row) =>
                                            row
                                                .map(
                                                    (value) =>
                                                        `"${String(value)
                                                            .replace(
                                                                /^[=+@-]/,
                                                                "'$&",
                                                            )
                                                            .replace(
                                                                /"/g,
                                                                '""',
                                                            )}"`,
                                                )
                                                .join(','),
                                        )
                                        .join('\n');
                                    const url = URL.createObjectURL(
                                        new Blob([csv], { type: 'text/csv' }),
                                    );
                                    const a = Object.assign(
                                        document.createElement('a'),
                                        {
                                            href: url,
                                            download: 'audit-activity.csv',
                                        },
                                    );
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                Export loaded entries
                            </button>
                        </>
                    )}
                    {section === 'ai' && (
                        <>
                            <h2 className="text-lg font-semibold">AI Status</h2>
                            <div className="card p-5 space-y-3">
                                {ai ? (
                                    <>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Text provider:{' '}
                                            </span>
                                            {ai.bioMistralProvider}
                                        </p>
                                        <p className="capitalize">
                                            Status: {ai.status}
                                        </p>
                                        <p>
                                            Model:{' '}
                                            {ai.model || 'Not configured'}
                                        </p>
                                        <p>
                                            Vision:{' '}
                                            {ai.visionModel || 'Not configured'}
                                        </p>
                                        {ai.error && (
                                            <p className="text-amber-600 dark:text-amber-300">
                                                {ai.error}
                                            </p>
                                        )}
                                        <p>
                                            {ai.guidelinesLoaded} guideline
                                            entries · {ai.source}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Provider availability is reported by
                                            the backend. API credentials and
                                            prompts are managed on the server.
                                        </p>
                                    </>
                                ) : (
                                    <p>Status unavailable.</p>
                                )}
                                <button
                                    className="btn-secondary"
                                    disabled={busy}
                                    onClick={() =>
                                        perform(async () => {
                                            const result = (
                                                await api.post(
                                                    '/ai/query-protocol',
                                                    {
                                                        query: 'What guideline sources are available?',
                                                    },
                                                )
                                            ).data;
                                            setSuccess(
                                                result.source ===
                                                    'guidelines-fallback'
                                                    ? 'Guideline fallback responded. The text model is unavailable.'
                                                    : 'Text provider responded.',
                                            );
                                        }, '')
                                    }
                                >
                                    Test response
                                </button>
                                <div className="flex gap-3">
                                    <Link
                                        className="text-primary"
                                        href="/dashboard/assistant"
                                    >
                                        Open assistant
                                    </Link>
                                    <Link
                                        className="text-primary"
                                        href="/dashboard/education"
                                    >
                                        Open medical library
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
            {editing !== undefined && (
                <UserEditor
                    user={editing}
                    onClose={() => setEditing(undefined)}
                    onSave={async (data) => {
                        if (editing)
                            await api.patch(`/users/${editing.id}`, data);
                        else await api.post('/users', data);
                        setSuccess('User saved.');
                        setEditing(undefined);
                        await load();
                    }}
                />
            )}
            {viewing && (
                <Modal
                    open
                    onClose={() => setViewing(null)}
                    title={viewing.fullName || viewing.username}
                    size="lg"
                >
                    <div className="space-y-4">
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            {Object.entries({
                                Username: viewing.username,
                                Role: roleName(viewing.role),
                                Clearance:
                                    CLEARANCE_NAMES[viewing.clearanceLevel],
                                Status: viewing.status,
                                Department: viewing.department || '—',
                                MFA: viewing.mfaEnabled
                                    ? 'Enabled'
                                    : 'Not enabled',
                                Created: date(viewing.createdAt),
                                'Last login': date(viewing.lastLoginAt),
                                ...viewing.metadata,
                            }).map(([key, value]) => (
                                <div key={key}>
                                    <dt className="text-muted-foreground">
                                        {key}
                                    </dt>
                                    <dd className="break-words">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        <h3 className="font-semibold">
                            Last 50 recorded actions
                        </h3>
                        {historyError && <ErrorBanner message={historyError} />}
                        {history ? (
                            <AuditList logs={history} />
                        ) : (
                            !historyError && (
                                <p role="status">Loading history…</p>
                            )
                        )}
                    </div>
                </Modal>
            )}
            {confirmation && (
                <Modal
                    open
                    onClose={() => {
                        if (!busy) setConfirmation(null);
                    }}
                    title={confirmation.title}
                    footer={
                        <div className="flex gap-3">
                            <button
                                className="btn-secondary"
                                disabled={busy}
                                onClick={() => setConfirmation(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                disabled={busy}
                                onClick={async () => {
                                    if (
                                        await perform(
                                            confirmation.run,
                                            'Action completed.',
                                        )
                                    )
                                        setConfirmation(null);
                                }}
                            >
                                {busy ? 'Working…' : 'Confirm'}
                            </button>
                        </div>
                    }
                >
                    <p>{confirmation.description}</p>
                    {error && <ErrorBanner message={error} />}
                </Modal>
            )}
        </div>
    );
}

function UserActions({
    user,
    currentId,
    busy,
    onEdit,
    onStatus,
    onDelete,
}: {
    user: Personnel;
    currentId: string;
    busy: boolean;
    onEdit: () => void;
    onStatus: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-xs" onClick={onEdit}>
                Edit
            </button>
            {user.status !== 'pending' && (
                <button
                    className="btn-secondary text-xs"
                    disabled={busy || user.id === currentId}
                    onClick={onStatus}
                >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
            )}
            <button
                className="btn-secondary text-xs text-destructive"
                disabled={busy || user.id === currentId}
                onClick={onDelete}
            >
                Delete
            </button>
        </div>
    );
}
function AuditList({ logs }: { logs: AuditEntry[] }) {
    return (
        <div className="space-y-2">
            {!logs.length && (
                <p className="text-muted-foreground text-sm p-4">
                    No recorded activity in this view.
                </p>
            )}
            {logs.map((log) => (
                <article key={log.id} className="card p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-medium break-all">
                            {log.action}
                        </span>
                        <span
                            className={
                                log.success
                                    ? 'text-primary'
                                    : 'text-destructive'
                            }
                        >
                            {log.success ? 'Success' : 'Failed'}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {date(log.timestamp)} ·{' '}
                        {log.username || log.userId || 'system'} ·{' '}
                        {log.ipAddress}
                    </p>
                    {log.errorMessage && (
                        <p className="text-destructive text-xs">
                            {log.errorMessage}
                        </p>
                    )}
                </article>
            ))}
        </div>
    );
}
function UserEditor({
    user,
    onClose,
    onSave,
}: {
    user: Personnel | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}) {
    const [form, setForm] = useState({
        username: user?.username || '',
        fullName: user?.fullName || '',
        department: user?.department || '',
        password: '',
        role: user?.role || UserRole.PUBLIC_MEDICAL_OFFICIAL,
        clearanceLevel: user?.clearanceLevel || 0,
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const { password, ...data } = form;
            await onSave(password ? { ...data, password } : data);
        } catch (err) {
            setError(message(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <Modal
            open
            onClose={() => {
                if (!busy) onClose();
            }}
            title={user ? 'Edit user' : 'Add user'}
            footer={
                <div className="flex gap-3">
                    <button
                        disabled={busy}
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        form="user-editor"
                        type="submit"
                        disabled={busy}
                        className="btn-primary"
                    >
                        {busy ? 'Saving…' : 'Save user'}
                    </button>
                </div>
            }
        >
            <form id="user-editor" onSubmit={submit} className="space-y-4">
                {error && <ErrorBanner message={error} />}
                {(['username', 'fullName', 'department'] as const).map(
                    (key) => (
                        <FormInput
                            key={key}
                            label={
                                key === 'fullName'
                                    ? 'Full name'
                                    : key === 'username'
                                      ? 'Username'
                                      : 'Department'
                            }
                            required={key === 'username'}
                            value={form[key]}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    [key]: e.target.value,
                                }))
                            }
                        />
                    ),
                )}
                <FormInput
                    label={user ? 'New password (optional)' : 'Password'}
                    type="password"
                    minLength={8}
                    required={!user}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) =>
                        setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    hint="At least 8 characters"
                />
                <label className="block text-sm">
                    Role
                    <select
                        className="form-input mt-1"
                        value={form.role}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                role: e.target.value as UserRole,
                            }))
                        }
                    >
                        {Object.values(UserRole).map((r) => (
                            <option key={r} value={r}>
                                {roleName(r)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block text-sm">
                    Clearance
                    <select
                        className="form-input mt-1"
                        value={form.clearanceLevel}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                clearanceLevel: Number(e.target.value),
                            }))
                        }
                    >
                        {Object.entries(CLEARANCE_NAMES).map(
                            ([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ),
                        )}
                    </select>
                </label>
            </form>
        </Modal>
    );
}
