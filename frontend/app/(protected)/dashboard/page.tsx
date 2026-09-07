'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Shield, Thermometer, Activity, MessageSquare, Stethoscope,
    Lock, Menu, Sun, Moon, LogOut, FileText,
    Settings, User as UserIcon, ChevronRight, Users, Bot,
    Briefcase, BookOpen, ClipboardList, GraduationCap, Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
    useAuthStore, UserRole, ClearanceLevel, ROLE_DISPLAY_NAMES, CLEARANCE_NAMES,
} from '@/lib/store/auth';
import { isMobileBuild, mobileLogout, getStoredSession } from '@/lib/mobile-auth';
import { useSidebar } from '@/components/layouts/AppShell';
import { api } from '@/lib/api';
import { LogoIcon } from '@/components/ui/Logo';
import StatCard from '@/components/ui/StatCard';
import { CaseVolumeChart, CaseCompletionChart } from '@/components/ui/DashboardCharts';
import { NotificationBell } from '@/components/ui/NotificationPanel';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';

/* ── Types ─────────────────────────────────── */

type StatColor = 'teal' | 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'red';

interface DashboardStats {
    patients: number;
    doctors: number;
    reports: number;
    diagnoses: number;
    cases: number;
    symptoms: number;
    users: number;
    recentActivity: { action: string; time: string; type: string }[];
    charts?: {
        monthlyCaseVolume: { month: string; cases: number }[];
        caseCompletionRate: {
            closed: number;
            open: number;
            inProgress: number;
            total: number;
            completionPct: number;
        };
    };
}

/* ── Component ─────────────────────────────── */

export default function DashboardPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user, clearAuth } = useAuthStore();
    const { openMobile } = useSidebar();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [mobileUser, setMobileUser] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (isMobileBuild()) {
            const session = getStoredSession();
            if (session?.user) setMobileUser(session.user);
        }
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch {
                setStats({ patients: 0, doctors: 0, reports: 0, diagnoses: 0, cases: 0, symptoms: 0, users: 0, recentActivity: [] });
            } finally { setStatsLoading(false); }
        };
        fetchStats();
    }, []);

    const handleLogout = async () => {
        clearAuth();
        if (isMobileBuild()) { mobileLogout(); router.push('/auth/login'); }
        else { const { signOut } = await import('next-auth/react'); await signOut({ callbackUrl: '/auth/login' }); }
    };

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const userRole = (user?.role || mobileUser?.role) as UserRole;
    const isArmyOfficer = userRole === UserRole.ARMY_MEDICAL_OFFICER;
    const isPublicOfficial = userRole === UserRole.PUBLIC_MEDICAL_OFFICIAL;
    const isAdmin = userRole === UserRole.ADMIN;

    /* ── Stat cards ── */
    const getStatCards = (): { label: string; value: number; icon: any; color: StatColor }[] => {
        if (!stats) return [];
        if (isArmyOfficer) return [
            { label: 'Patients', value: stats.patients, icon: Users, color: 'teal' },
            { label: 'Active Cases', value: stats.cases, icon: FileText, color: 'blue' },
            { label: 'Reports', value: stats.reports, icon: ClipboardList, color: 'purple' },
            { label: 'Diagnoses', value: stats.diagnoses, icon: Stethoscope, color: 'cyan' },
        ];
        if (isPublicOfficial) return [
            { label: 'Patients', value: stats.patients, icon: Users, color: 'teal' },
            { label: 'Doctors', value: stats.doctors, icon: Stethoscope, color: 'blue' },
            { label: 'Reports', value: stats.reports, icon: ClipboardList, color: 'purple' },
            { label: 'Cases', value: stats.cases, icon: FileText, color: 'cyan' },
        ];
        return [
            { label: 'Total Users', value: stats.users, icon: Users, color: 'teal' },
            { label: 'Patients', value: stats.patients, icon: Users, color: 'blue' },
            { label: 'Doctors', value: stats.doctors, icon: Stethoscope, color: 'purple' },
            { label: 'Cases', value: stats.cases, icon: FileText, color: 'cyan' },
        ];
    };

    /* ── Feature cards ── */
    const getFeatures = () => {
        const common = [
            { icon: Users, title: 'Patients', desc: 'Manage patient profiles', gradient: 'from-medical-teal-400 to-medical-teal-600', href: '/dashboard/patients' },
            { icon: Stethoscope, title: 'Doctors', desc: 'Doctor directory & profiles', gradient: 'from-medical-blue-400 to-medical-blue-600', href: '/dashboard/doctors' },
            { icon: ClipboardList, title: 'Reports', desc: 'Medical reports & findings', gradient: 'from-medical-purple-400 to-medical-purple-500', href: '/dashboard/reports' },
            { icon: FileText, title: 'Diagnoses', desc: 'Diagnosis records & ICD codes', gradient: 'from-rose-400 to-rose-600', href: '/dashboard/diagnoses' },
            { icon: Thermometer, title: 'Symptom Assessment', desc: 'AI-assisted symptom analysis', gradient: 'from-amber-400 to-orange-500', href: '/dashboard/symptoms' },
            { icon: FileText, title: 'Medical Cases', desc: 'View & manage patient cases', gradient: 'from-medical-cyan-400 to-medical-cyan-500', href: '/dashboard/cases' },
        ];
        if (isArmyOfficer) common.push({ icon: Activity, title: 'ECG Analysis', desc: 'Upload & analyze recordings', gradient: 'from-red-400 to-red-600', href: '/dashboard/ecg' });
        common.push(
            { icon: MessageSquare, title: 'Secure Chat', desc: isArmyOfficer ? 'Chat with Public Officials' : isPublicOfficial ? 'Chat with Army Officers' : 'Chat with all users', gradient: 'from-indigo-400 to-indigo-600', href: '/dashboard/chat' },
            { icon: Bot, title: 'AI Assistant', desc: 'Medical guidance (BioMistral)', gradient: 'from-violet-400 to-purple-600', href: '/dashboard/assistant' },
            { icon: BookOpen, title: 'Medical Library', desc: 'AIIMS Antibiotic Policy', gradient: 'from-emerald-400 to-emerald-600', href: '/dashboard/education' },
        );
        if (isAdmin) common.push({ icon: Shield, title: 'Admin Panel', desc: 'Manage system users', gradient: 'from-slate-400 to-slate-600', href: '/admin' });
        return common;
    };

    /* ── Helpers ── */
    const formatTimeAgo = (isoStr: string) => {
        const diff = Date.now() - new Date(isoStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const activityIcon = (type: string) => {
        switch (type) {
            case 'patient': return <Users size={15} />;
            case 'case': return <FileText size={15} />;
            case 'diagnosis': return <ClipboardList size={15} />;
            case 'report': return <FileText size={15} />;
            default: return <Activity size={15} />;
        }
    };

    const activityColor = (type: string) => {
        switch (type) {
            case 'patient': return 'bg-medical-teal-100 dark:bg-medical-teal-900/30 text-medical-teal-600 dark:text-medical-teal-400';
            case 'case': return 'bg-medical-blue-100 dark:bg-medical-blue-600/20 text-medical-blue-600 dark:text-medical-blue-400';
            case 'diagnosis': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400';
            case 'report': return 'bg-medical-purple-100 dark:bg-medical-purple-500/20 text-medical-purple-500 dark:text-medical-purple-400';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const displayName = user?.fullName || mobileUser?.fullName || user?.username || mobileUser?.username || 'User';
    const clearanceLevel: ClearanceLevel = user?.clearanceLevel ?? mobileUser?.clearanceLevel ?? ClearanceLevel.UNCLASSIFIED;
    const statCards = getStatCards();
    const features = getFeatures();

    return (
        <div className="flex flex-col min-h-full safe-top">
            {/* ── Header ── */}
            <header className="relative lg:sticky lg:top-0 z-30 h-16 flex-shrink-0 border-b border-border/40" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)' }}>
                <div className="h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between max-w-[1600px] w-full mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={openMobile} className="p-2 hover:bg-muted/50 rounded-xl lg:hidden touch-target" aria-label="Open menu">
                            <Menu size={22} className="text-foreground" />
                        </button>
                        <div className="flex items-center gap-2.5 lg:hidden">
                            <LogoIcon size={36} />
                            <div className="hidden sm:block">
                                <span className="font-bold text-foreground text-base font-display">
                                    <span>Pulse</span><span className="text-primary">Logic</span>
                                </span>
                                <p className="text-2xs text-muted-foreground">Medical Platform</p>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <h1 className="text-lg font-semibold text-foreground font-display">
                                {isArmyOfficer ? 'Field Medical Dashboard' : isPublicOfficial ? 'Public Health Dashboard' : 'System Dashboard'}
                            </h1>
                            <p className="text-2xs text-muted-foreground">{userRole ? ROLE_DISPLAY_NAMES[userRole] : 'Secure Medical Platform'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button onClick={toggleTheme} className="p-2.5 hover:bg-muted/50 rounded-xl touch-target transition-colors" aria-label="Toggle theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <div className="relative">
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="h-10 w-10 bg-gradient-to-br from-medical-teal-400 to-medical-blue-500 rounded-xl flex items-center justify-center text-white font-bold touch-target hover:shadow-glow-teal transition-all" aria-label="User menu">
                                {displayName.charAt(0).toUpperCase()}
                            </button>
                            {isProfileMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 top-12 w-60 bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-border/50 bg-primary/[0.03]">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-medical-teal-400 to-medical-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground truncate text-sm">{displayName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{userRole ? ROLE_DISPLAY_NAMES[userRole] : 'User'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <button onClick={() => { setIsProfileMenuOpen(false); router.push('/dashboard/profile'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted/50 transition-colors">
                                                <UserIcon size={16} className="text-muted-foreground" />
                                                <span className="text-sm font-medium">Profile</span>
                                            </button>
                                            <button onClick={() => { setIsProfileMenuOpen(false); router.push('/dashboard/profile'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted/50 transition-colors">
                                                <Settings size={16} className="text-muted-foreground" />
                                                <span className="text-sm font-medium">Settings</span>
                                            </button>
                                            {isAdmin && (
                                                <button onClick={() => { setIsProfileMenuOpen(false); router.push('/admin'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted/50 transition-colors">
                                                    <Shield size={16} className="text-muted-foreground" />
                                                    <span className="text-sm font-medium">Admin Panel</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-border/50">
                                            <button onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                                                <LogOut size={16} />
                                                <span className="text-sm font-medium">Sign Out</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main ── */}
            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-20 lg:pb-6 max-w-[1600px]">

                    {/* Top Row: Compact Welcome Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
                        style={{ background: 'linear-gradient(135deg, hsl(172 66% 38%), hsl(187 72% 40%), hsl(215 60% 42%))' }}
                    >
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white rounded-full blur-2xl" />
                        </div>
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                                    <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Welcome back, {displayName}</h2>
                                    <span className="text-2xs px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 font-medium backdrop-blur-sm">
                                        {userRole ? ROLE_DISPLAY_NAMES[userRole] : 'User'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/80">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                                        Secure Vault Active
                                    </span>
                                    <span className="font-semibold text-white/90">
                                        {CLEARANCE_NAMES[clearanceLevel] || 'UNCLASSIFIED'}
                                    </span>
                                    {user?.department && (
                                        <span className="hidden sm:inline text-white/70">
                                            • {user.department}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium self-start sm:self-auto">
                                <Lock size={13} /> 256-bit Encrypted
                            </div>
                        </div>
                    </motion.div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {statsLoading ? (
                            <LoadingSkeleton variant="stat" count={4} className="col-span-full" />
                        ) : (
                            statCards.map((stat, i) => (
                                <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} delay={i * 0.05} />
                            ))
                        )}
                    </div>

                    {/* Integrated Dashboard Grid - Landscape Layout */}
                    <div className="space-y-4">
                        {/* Full Width Trend Graph */}
                        <div className="w-full">
                            {stats?.charts ? (
                                <CaseVolumeChart
                                    data={stats.charts.monthlyCaseVolume}
                                    title="Monthly Case Volume"
                                    subtitle="Last 12 months"
                                />
                            ) : (
                                <LoadingSkeleton variant="stat" count={1} className="h-48" />
                            )}
                        </div>

                        {/* 50/50 Split Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Left Panel: Target/Completion Chart & Tools */}
                            <div className="space-y-4">
                                {stats?.charts ? (
                                    <CaseCompletionChart
                                        data={stats.charts.caseCompletionRate}
                                        title="Case Completion Rate"
                                        subtitle="All time"
                                    />
                                ) : (
                                    <LoadingSkeleton variant="stat" count={1} className="h-48" />
                                )}

                                {/* Clinical & System Tools */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-2.5 font-display">
                                        {isArmyOfficer ? 'Field Medical Tools' : isPublicOfficial ? 'Public Health Tools' : 'System Tools'}
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {features.map((feature, i) => {
                                        const Icon = feature.icon;
                                        return (
                                            <motion.button
                                                key={feature.title}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.03 * i, duration: 0.25 }}
                                                onClick={() => router.push(feature.href)}
                                                className="glass-card p-3 sm:p-3.5 text-left group relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                                            >
                                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-2 text-white shadow-soft group-hover:scale-105 transition-transform duration-200`}>
                                                    <Icon size={16} />
                                                </div>
                                                <h4 className="font-semibold text-foreground mb-0.5 text-xs truncate">{feature.title}</h4>
                                                <p className="text-[11px] text-muted-foreground line-clamp-1">{feature.desc}</p>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Live Sidebar & Quick Actions */}
                        <div className="space-y-4">
                            {/* Quick Action Shortcuts */}
                            {(isArmyOfficer || isPublicOfficial) && (
                                <div className="glass-card p-4 space-y-2.5">
                                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => router.push('/dashboard/chat')} className="btn-primary text-xs rounded-xl py-2.5 w-full justify-center">
                                            <MessageSquare size={15} />
                                            {isArmyOfficer ? 'Contact Public Official' : 'Contact Army Officer'}
                                        </button>
                                        <button onClick={() => router.push('/dashboard/assistant')} className="btn-glass text-xs rounded-xl py-2.5 min-h-0 w-full justify-center">
                                            <Bot size={15} /> Ask AI Assistant
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Live Recent Activity */}
                            <div className="glass-card overflow-hidden">
                                <div className="p-3.5 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">Recent Activity</h3>
                                    <span className="text-2xs text-emerald-500 font-bold flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
                                    </span>
                                </div>
                                <div className="max-h-[360px] overflow-y-auto scrollbar-thin divide-y divide-border/20">
                                    {statsLoading ? (
                                        <LoadingSkeleton variant="row" count={3} className="" />
                                    ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                        stats.recentActivity.map((activity, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                className="flex items-center justify-between p-3 hover:bg-primary/[0.03] transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activityColor(activity.type)}`}>
                                                        {activityIcon(activity.type)}
                                                    </div>
                                                    <span className="text-xs text-foreground truncate">{activity.action}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTimeAgo(activity.time)}</span>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <EmptyState
                                            icon={Activity}
                                            title="No recent activity"
                                            description="Activity logs appear here"
                                            className="py-8"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                {/* Mobile Bottom Spacer */}
                <div className="h-[70px] lg:hidden w-full flex-shrink-0" aria-hidden="true" />
            </main>
        </div>
    );
}
