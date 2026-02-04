'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    Thermometer,
    Activity,
    MessageSquare,
    Stethoscope,
    Lock,
    Menu,
    X,
    Sun,
    Moon,
    AlertTriangle,
    LogOut,
    FileText,
    Settings,
    User as UserIcon,
    ChevronRight,
    Users,
    Bot,
    Building2,
    Briefcase,
    Radio,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
    useAuthStore,
    UserRole,
    ClearanceLevel,
    ROLE_DISPLAY_NAMES,
    CLEARANCE_NAMES,
    ROLE_PERMISSIONS
} from '@/lib/store/auth';
import { isMobileBuild, mobileLogout, getStoredSession } from '@/lib/mobile-auth';

export default function DashboardPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user, clearAuth } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [mobileUser, setMobileUser] = useState<any>(null);

    useEffect(() => {
        if (isMobileBuild()) {
            const session = getStoredSession();
            if (session?.user) {
                setMobileUser(session.user);
            }
        }
    }, []);

    const handleLogout = async () => {
        clearAuth();
        if (isMobileBuild()) {
            mobileLogout();
            router.push('/auth/login');
        } else {
            // Dynamic import for web-only NextAuth
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/auth/login' });
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Determine user role
    const userRole = (user?.role || mobileUser?.role) as UserRole;
    const isArmyOfficer = userRole === UserRole.ARMY_MEDICAL_OFFICER;
    const isPublicOfficial = userRole === UserRole.PUBLIC_MEDICAL_OFFICIAL;
    const isAdmin = userRole === UserRole.ADMIN;
    const permissions = userRole ? ROLE_PERMISSIONS[userRole] : null;

    // Role-specific features
    const getFeatures = () => {
        const baseFeatures = [
            {
                icon: Thermometer,
                title: 'Symptom Assessment',
                desc: 'AI-assisted symptom analysis',
                color: 'from-orange-500 to-amber-500',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                iconColor: 'text-orange-600 dark:text-orange-400',
                href: '/dashboard/symptoms',
            },
            {
                icon: FileText,
                title: 'Medical Cases',
                desc: 'View & manage patient cases',
                color: 'from-blue-500 to-indigo-500',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                iconColor: 'text-blue-600 dark:text-blue-400',
                href: '/dashboard/cases',
            },
        ];

        const chatFeature = {
            icon: MessageSquare,
            title: 'Secure Chat',
            desc: isArmyOfficer
                ? 'Chat with Public Officials'
                : isPublicOfficial
                    ? 'Chat with Army Officers'
                    : 'Chat with all users',
            color: 'from-indigo-500 to-purple-500',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            href: '/dashboard/chat',
        };

        const aiFeature = {
            icon: Bot,
            title: 'AI Assistant',
            desc: 'Medical guidance (Gemini)',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
            href: '/dashboard/assistant',
        };

        // Army-specific features
        if (isArmyOfficer) {
            return [
                ...baseFeatures,
                {
                    icon: Activity,
                    title: 'ECG Analysis',
                    desc: 'Upload & analyze recordings',
                    color: 'from-rose-500 to-red-500',
                    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
                    iconColor: 'text-rose-600 dark:text-rose-400',
                    href: '/dashboard/ecg',
                },
                {
                    icon: Radio,
                    title: 'Field Operations',
                    desc: 'Tactical medical support',
                    color: 'from-green-500 to-emerald-500',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    iconColor: 'text-green-600 dark:text-green-400',
                    href: '/dashboard/field-ops',
                },
                chatFeature,
                aiFeature,
            ];
        }

        // Public Official features
        if (isPublicOfficial) {
            return [
                ...baseFeatures,
                {
                    icon: Building2,
                    title: 'Public Health',
                    desc: 'Community health data',
                    color: 'from-cyan-500 to-teal-500',
                    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
                    iconColor: 'text-cyan-600 dark:text-cyan-400',
                    href: '/dashboard/public-health',
                },
                {
                    icon: Users,
                    title: 'Coordination',
                    desc: 'Inter-agency coordination',
                    color: 'from-rose-500 to-red-500',
                    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
                    iconColor: 'text-rose-600 dark:text-rose-400',
                    href: '/dashboard/coordination',
                },
                chatFeature,
                aiFeature,
            ];
        }

        // Admin features
        return [
            ...baseFeatures,
            chatFeature,
            aiFeature,
            {
                icon: Users,
                title: 'User Management',
                desc: 'Manage system users',
                color: 'from-slate-500 to-gray-500',
                bgColor: 'bg-slate-50 dark:bg-slate-900/20',
                iconColor: 'text-slate-600 dark:text-slate-400',
                href: '/admin/users',
            },
            {
                icon: Settings,
                title: 'System Settings',
                desc: 'Configure system',
                color: 'from-gray-500 to-zinc-500',
                bgColor: 'bg-gray-50 dark:bg-gray-900/20',
                iconColor: 'text-gray-600 dark:text-gray-400',
                href: '/admin/settings',
            },
        ];
    };

    const features = getFeatures();

    // Role-specific stats
    const getStats = () => {
        if (isArmyOfficer) {
            return [
                { label: 'Active Cases', value: '12', trend: '+2' },
                { label: 'Field Reports', value: '5', trend: '+1' },
                { label: 'Consultations', value: '8', trend: '+3' },
                { label: 'Alerts', value: '2', trend: '0' },
            ];
        }
        if (isPublicOfficial) {
            return [
                { label: 'Open Cases', value: '18', trend: '+4' },
                { label: 'Coordination', value: '7', trend: '+2' },
                { label: 'Consultations', value: '11', trend: '+5' },
                { label: 'Reports Due', value: '3', trend: '-1' },
            ];
        }
        return [
            { label: 'Total Users', value: '45', trend: '+5' },
            { label: 'Active Cases', value: '30', trend: '+6' },
            { label: 'System Alerts', value: '4', trend: '-2' },
            { label: 'Uptime', value: '99.9%', trend: '0' },
        ];
    };

    const stats = getStats();

    const getClearanceColor = (level?: ClearanceLevel) => {
        switch (level) {
            case ClearanceLevel.TOP_SECRET: return 'text-red-600 dark:text-red-400';
            case ClearanceLevel.SECRET: return 'text-orange-600 dark:text-orange-400';
            case ClearanceLevel.CONFIDENTIAL: return 'text-amber-600 dark:text-amber-400';
            default: return 'text-emerald-600 dark:text-emerald-400';
        }
    };

    const getRoleBadgeColor = () => {
        if (isArmyOfficer) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
        if (isPublicOfficial) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    };

    const displayName = user?.fullName || mobileUser?.fullName || user?.username || mobileUser?.username || 'User';
    const clearanceLevel: ClearanceLevel = user?.clearanceLevel ?? mobileUser?.clearanceLevel ?? ClearanceLevel.UNCLASSIFIED;

    return (
        <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
            {/* Header */}
            <header className="glass border-b border-border sticky top-0 z-30 h-16">
                <div className="container-app h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-muted rounded-xl lg:hidden touch-target"
                        >
                            <Menu size={22} className="text-foreground" />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white shadow-soft">
                                <Shield size={20} strokeWidth={2.5} />
                            </div>
                            <div className="hidden sm:block">
                                <span className="font-bold text-foreground text-lg">
                                    PulseLogic
                                </span>
                                <p className="text-2xs text-muted-foreground">
                                    Military Medical Support
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-xl touch-target transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-soft touch-target">
                            <AlertTriangle size={16} />
                            <span className="hidden sm:inline">SOS</span>
                        </button>

                        {/* Profile Dropdown - Desktop */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="h-10 w-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold touch-target hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    {/* Menu */}
                                    <div className="absolute right-0 top-12 w-64 bg-card rounded-xl shadow-soft-lg border border-border z-50 animate-scale-in overflow-hidden">
                                        {/* User Info */}
                                        <div className="p-4 border-b border-border bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground truncate">{displayName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {userRole ? ROLE_DISPLAY_NAMES[userRole] : 'User'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    router.push('/dashboard/profile');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <UserIcon size={18} className="text-muted-foreground" />
                                                <span className="text-sm font-medium">Profile</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    router.push('/dashboard/profile');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <Settings size={18} className="text-muted-foreground" />
                                                <span className="text-sm font-medium">Settings</span>
                                            </button>

                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setIsProfileMenuOpen(false);
                                                        router.push('/admin');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                                                >
                                                    <Shield size={18} className="text-muted-foreground" />
                                                    <span className="text-sm font-medium">Admin Panel</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Logout */}
                                        <div className="p-2 border-t border-border">
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <LogOut size={18} />
                                                <span className="text-sm font-medium">Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <div
                        className="absolute left-0 top-0 h-full w-72 bg-card shadow-soft-lg p-6 animate-slide-up safe-top safe-bottom"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white">
                                    <Shield size={16} strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-lg">Menu</span>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 hover:bg-muted rounded-xl"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* User Info in Sidebar */}
                        <div className="mb-6 p-4 bg-muted rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{displayName}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                                        {userRole ? ROLE_DISPLAY_NAMES[userRole] : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Account
                            </div>
                            <button
                                onClick={() => {
                                    setIsSidebarOpen(false);
                                    router.push('/dashboard/profile');
                                }}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted transition-colors flex items-center gap-3"
                            >
                                <UserIcon size={18} className="text-muted-foreground" />
                                Profile
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        setIsSidebarOpen(false);
                                        router.push('/admin');
                                    }}
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted transition-colors flex items-center gap-3"
                                >
                                    <Settings size={18} className="text-muted-foreground" />
                                    Admin Panel
                                </button>
                            )}
                        </div>

                        <div className="absolute bottom-6 left-6 right-6">
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 font-medium flex items-center gap-3 transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 w-full overflow-y-auto">
                <div className="container-app space-y-6 pb-8 animate-fade-in">
                    {/* Demo Banner */}
                    <div className="demo-banner">
                        <AlertTriangle className="demo-banner-icon" size={18} />
                        <div>
                            <p className="font-semibold text-amber-800 dark:text-amber-200">
                                DEMO MODE
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                This is a demonstration environment with synthetic data. Not for clinical use.
                            </p>
                        </div>
                    </div>

                    {/* Welcome Card */}
                    <div className="gradient-hero rounded-2xl p-6 text-white shadow-soft-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold">
                                        Welcome, {displayName}
                                    </h1>
                                    <span className={`text-xs px-2 py-1 rounded-full bg-white/20`}>
                                        {userRole ? ROLE_DISPLAY_NAMES[userRole] : 'User'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                                        Secure Vault Active
                                    </span>
                                    <span className={`font-medium ${getClearanceColor(clearanceLevel)}`}>
                                        {CLEARANCE_NAMES[clearanceLevel] || 'UNCLASSIFIED'}
                                    </span>
                                </div>
                                {user?.department && (
                                    <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                                        <Briefcase size={14} />
                                        {user.department}
                                    </p>
                                )}
                            </div>
                            <div className="secure-badge bg-white/10 text-white">
                                <Lock size={14} />
                                <span>256-bit Encrypted</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {stats.map((stat, i) => (
                            <div key={i} className="card p-4">
                                <p className="text-2xs text-muted-foreground uppercase tracking-wide">
                                    {stat.label}
                                </p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-2xl font-bold text-foreground">
                                        {stat.value}
                                    </span>
                                    <span className={`text-xs font-medium ${
                                        stat.trend.startsWith('+')
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : stat.trend.startsWith('-')
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-muted-foreground'
                                    }`}>
                                        {stat.trend !== '0' ? stat.trend : '--'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Role-specific Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                        {isArmyOfficer && (
                            <>
                                <button
                                    onClick={() => router.push('/dashboard/chat')}
                                    className="btn-primary text-sm flex items-center gap-2"
                                >
                                    <MessageSquare size={16} />
                                    Contact Public Official
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/assistant')}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    <Bot size={16} />
                                    Ask AI Assistant
                                </button>
                            </>
                        )}
                        {isPublicOfficial && (
                            <>
                                <button
                                    onClick={() => router.push('/dashboard/chat')}
                                    className="btn-primary text-sm flex items-center gap-2"
                                >
                                    <MessageSquare size={16} />
                                    Contact Army Officer
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/assistant')}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    <Bot size={16} />
                                    Ask AI Assistant
                                </button>
                            </>
                        )}
                    </div>

                    {/* Feature Cards */}
                    <div>
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            {isArmyOfficer ? 'Field Medical Tools' : isPublicOfficial ? 'Public Health Tools' : 'System Tools'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {features.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <button
                                        key={feature.title}
                                        onClick={() => router.push(feature.href)}
                                        className="card p-5 text-left group relative overflow-hidden hover:border-primary/50 active:scale-[0.98] transition-all"
                                    >
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight size={18} className="text-muted-foreground" />
                                        </div>
                                        <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className={feature.iconColor} size={24} />
                                        </div>
                                        <h3 className="font-semibold text-foreground mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.desc}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-3 text-2xs text-muted-foreground">
                                            <Lock size={10} />
                                            <span>Encrypted</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat Section - Highlight */}
                    <div className="card p-6 border-2 border-primary/20">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <MessageSquare size={20} className="text-primary" />
                            Communication Hub
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* User-to-User Chat */}
                            <button
                                onClick={() => router.push('/dashboard/chat')}
                                className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800/50 rounded-full flex items-center justify-center">
                                        <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">User Chat</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {isArmyOfficer
                                                ? 'Connect with Public Officials'
                                                : isPublicOfficial
                                                    ? 'Connect with Army Officers'
                                                    : 'Connect with all users'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    End-to-end encrypted messaging for secure medical coordination
                                </p>
                            </button>

                            {/* AI Chat */}
                            <button
                                onClick={() => router.push('/dashboard/assistant')}
                                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800/50 rounded-full flex items-center justify-center">
                                        <Bot size={20} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">AI Assistant</h3>
                                        <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Get AI-powered medical guidance with anonymized data protection
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            Recent Activity
                        </h2>
                        <div className="card divide-y divide-border">
                            {[
                                { action: 'Case MC-2024-001 updated', time: '5 min ago', type: 'case' },
                                { action: 'AI consultation completed', time: '15 min ago', type: 'ai' },
                                { action: 'New message from colleague', time: '1 hour ago', type: 'chat' },
                            ].map((activity, i) => (
                                <div key={i} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            activity.type === 'case'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : activity.type === 'ai'
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                            {activity.type === 'case' ? <FileText size={16} /> :
                                                activity.type === 'ai' ? <Bot size={16} /> :
                                                    <MessageSquare size={16} />}
                                        </div>
                                        <span className="text-sm text-foreground">
                                            {activity.action}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
