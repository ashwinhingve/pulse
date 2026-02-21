'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, Thermometer, Activity,
    MessageSquare, Bot, BookOpen, Shield, LogOut,
    ChevronLeft, ChevronRight, X, Lock,
    Users, Stethoscope, ClipboardList, Menu,
    HeartPulse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    useAuthStore, UserRole, CLEARANCE_NAMES, ClearanceLevel,
} from '@/lib/store/auth';
import { isMobileBuild, mobileLogout } from '@/lib/mobile-auth';
import EmergencyButton from '@/components/EmergencyButton';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Logo, { LogoIcon } from '@/components/ui/Logo';

/* ── Sidebar Context ─────────────────────────────────────── */

interface SidebarCtx {
    isCollapsed: boolean;
    toggleCollapsed: () => void;
    isMobileOpen: boolean;
    openMobile: () => void;
    closeMobile: () => void;
}

const SidebarContext = createContext<SidebarCtx>({
    isCollapsed: false,
    toggleCollapsed: () => {},
    isMobileOpen: false,
    openMobile: () => {},
    closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

/* ── Navigation data ─────────────────────────────────────── */

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    roles: UserRole[];
    section?: string;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Overview' },
    { href: '/dashboard/cases', label: 'Medical Cases', icon: FileText, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Clinical' },
    { href: '/dashboard/symptoms', label: 'Symptoms', icon: Thermometer, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL], section: 'Clinical' },
    { href: '/dashboard/patients', label: 'Patients', icon: Users, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Clinical' },
    { href: '/dashboard/doctors', label: 'Doctors', icon: Stethoscope, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Clinical' },
    { href: '/dashboard/reports', label: 'Reports', icon: ClipboardList, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Clinical' },
    { href: '/dashboard/diagnoses', label: 'Diagnoses', icon: ClipboardList, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Clinical' },
    { href: '/dashboard/ecg', label: 'ECG Analysis', icon: Activity, roles: [UserRole.ARMY_MEDICAL_OFFICER], section: 'Clinical' },
    { href: '/dashboard/chat', label: 'Secure Chat', icon: MessageSquare, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Tools' },
    { href: '/dashboard/assistant', label: 'AI Assistant', icon: Bot, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Tools' },
    { href: '/dashboard/education', label: 'Medical Library', icon: BookOpen, roles: [UserRole.ARMY_MEDICAL_OFFICER, UserRole.PUBLIC_MEDICAL_OFFICIAL, UserRole.ADMIN], section: 'Tools' },
    { href: '/admin', label: 'Admin Panel', icon: Shield, roles: [UserRole.ADMIN], section: 'System' },
];

function clearanceBadgeClass(level?: ClearanceLevel): string {
    switch (level) {
        case ClearanceLevel.TOP_SECRET: return 'bg-red-600 text-white';
        case ClearanceLevel.SECRET: return 'bg-orange-500 text-white';
        case ClearanceLevel.CONFIDENTIAL: return 'bg-amber-500 text-white';
        default: return 'bg-emerald-600 text-white';
    }
}

/* ── Sidebar ─────────────────────────────────────────────── */

interface SidebarNavProps {
    collapsed?: boolean;
    mobileMode?: boolean;
    onClose?: () => void;
}

function SidebarNav({ collapsed = false, mobileMode = false, onClose }: SidebarNavProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();
    const { toggleCollapsed } = useSidebar();

    const role = user?.role as UserRole | undefined;
    const navItems = role ? NAV_ITEMS.filter(n => n.roles.includes(role)) : [];

    const displayName = user?.fullName || user?.username || 'User';
    const initials = displayName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleLogout = async () => {
        useAuthStore.getState().clearAuth();
        if (isMobileBuild()) {
            mobileLogout();
            router.push('/auth/login');
        } else {
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/auth/login' });
        }
    };

    const isActive = (href: string) =>
        href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

    // Group nav items by section
    const sections: { label: string; items: typeof navItems }[] = [];
    let currentSection = '';
    for (const item of navItems) {
        const sec = item.section || 'Other';
        if (sec !== currentSection) {
            currentSection = sec;
            sections.push({ label: sec, items: [item] });
        } else {
            sections[sections.length - 1].items.push(item);
        }
    }

    const isExpanded = !collapsed || mobileMode;

    return (
        <div className="flex flex-col h-full bg-card/80 backdrop-blur-xl">
            {/* ── Brand ── */}
            <div
                className={`flex items-center h-16 px-4 flex-shrink-0 border-b border-border/40 ${
                    !isExpanded ? 'justify-center' : 'justify-between'
                }`}
            >
                {isExpanded ? (
                    <div className="flex items-center gap-2.5">
                        <LogoIcon size={36} />
                        <div>
                            <span className="font-bold text-foreground text-base leading-none block font-display">
                                <span>Pulse</span><span className="text-primary">Logic</span>
                            </span>
                            <span className="text-2xs text-muted-foreground flex items-center gap-1 leading-none mt-0.5">
                                <Lock size={8} /> Secure Medical
                            </span>
                        </div>
                    </div>
                ) : (
                    <LogoIcon size={36} />
                )}

                {mobileMode ? (
                    <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-xl text-muted-foreground transition-colors" aria-label="Close menu">
                        <X size={18} />
                    </button>
                ) : !collapsed ? (
                    <button onClick={toggleCollapsed} className="p-1.5 hover:bg-muted/50 rounded-lg text-muted-foreground transition-colors" title="Collapse sidebar">
                        <ChevronLeft size={18} />
                    </button>
                ) : null}
            </div>

            {/* ── Nav items ── */}
            <nav className="flex-1 py-3 px-2.5 overflow-y-auto scrollbar-thin">
                {sections.map((section, sIdx) => (
                    <div key={section.label} className={sIdx > 0 ? 'mt-5' : ''}>
                        {isExpanded && (
                            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">
                                {section.label}
                            </p>
                        )}
                        {!isExpanded && sIdx > 0 && (
                            <div className="mx-3 mb-2 border-t border-border/30" />
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={mobileMode ? onClose : undefined}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                                            active
                                                ? 'bg-primary/10 text-primary shadow-sm'
                                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                        } ${!isExpanded ? 'justify-center' : ''}`}
                                        title={!isExpanded ? item.label : undefined}
                                    >
                                        {active && isExpanded && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-primary to-primary/60 rounded-r-full" />
                                        )}

                                        <div className={`flex-shrink-0 transition-all duration-200 ${
                                            active ? '' : 'group-hover:scale-110'
                                        }`}>
                                            <Icon size={19} />
                                        </div>

                                        {isExpanded && (
                                            <span className={`text-[13px] truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                                                {item.label}
                                            </span>
                                        )}

                                        {!isExpanded && (
                                            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg shadow-glass-lg border border-border whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                                {item.label}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Expand button ── */}
            {collapsed && !mobileMode && (
                <div className="px-2 pb-2">
                    <button
                        onClick={toggleCollapsed}
                        className="w-full flex items-center justify-center p-2.5 hover:bg-muted/50 rounded-xl text-muted-foreground transition-colors"
                        title="Expand sidebar"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* ── User footer ── */}
            <div className="border-t border-border/40 p-3 flex-shrink-0">
                {isExpanded ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors group cursor-default">
                        <div className="h-10 w-10 bg-gradient-to-br from-medical-teal-400 to-medical-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-soft ring-2 ring-primary/10">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-2xs px-1.5 py-0.5 rounded font-bold ${clearanceBadgeClass(user?.clearanceLevel)}`}>
                                    {user?.clearanceLevel !== undefined
                                        ? CLEARANCE_NAMES[user.clearanceLevel as ClearanceLevel]
                                        : 'UNCLASSIFIED'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-9 w-9 bg-gradient-to-br from-medical-teal-400 to-medical-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-soft ring-2 ring-primary/10">
                            {initials}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── AppShell ────────────────────────────────────────────── */

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('sidebar-collapsed');
            if (saved !== null) setIsCollapsed(JSON.parse(saved));
        } catch {}
    }, []);

    const toggleCollapsed = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem('sidebar-collapsed', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const sidebarWidth = isCollapsed ? 68 : 260;

    return (
        <SidebarContext.Provider
            value={{
                isCollapsed,
                toggleCollapsed,
                isMobileOpen,
                openMobile: () => setIsMobileOpen(true),
                closeMobile: () => setIsMobileOpen(false),
            }}
        >
            <div className="flex h-screen overflow-hidden bg-mesh-gradient relative">
                <AnimatedBackground />

                {/* ── Desktop sidebar ── */}
                <aside
                    className="hidden lg:flex flex-col flex-shrink-0 transition-[width] duration-300 ease-out overflow-hidden border-r border-border/30 z-10 relative"
                    style={{ width: sidebarWidth }}
                >
                    <SidebarNav collapsed={isCollapsed} />
                </aside>

                {/* ── Mobile drawer ── */}
                {isMobileOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
                            onClick={() => setIsMobileOpen(false)}
                        />
                        <aside className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden animate-slide-right shadow-2xl">
                            <SidebarNav mobileMode onClose={() => setIsMobileOpen(false)} />
                        </aside>
                    </>
                )}

                {/* ── Main content ── */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto scrollbar-thin relative z-10">
                    {children}
                    <div className="lg:hidden h-[env(safe-area-inset-bottom,0px)]" style={{ height: 'calc(72px + env(safe-area-inset-bottom, 0px))' }} />
                </div>
            </div>

            {/* ── Mobile bottom tab bar ── */}
            <BottomTabBar />

            {/* ── Emergency button ── */}
            <EmergencyButton />
        </SidebarContext.Provider>
    );
}

/* ── Bottom Tab Bar ─────────────────────────────────────── */

const ARMY_TABS = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/reports', label: 'Reports', icon: ClipboardList },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
    { href: '/dashboard/assistant', label: 'AI', icon: Bot },
];

const PUBLIC_TABS = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/reports', label: 'Reports', icon: ClipboardList },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
    { href: '/dashboard/assistant', label: 'AI', icon: Bot },
];

const ADMIN_TABS = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/reports', label: 'Reports', icon: ClipboardList },
    { href: '/dashboard/assistant', label: 'AI', icon: Bot },
    { href: '/admin', label: 'Admin', icon: Shield },
];

function BottomTabBar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const role = user?.role as UserRole | undefined;

    const tabs =
        role === UserRole.ARMY_MEDICAL_OFFICER ? ARMY_TABS
        : role === UserRole.PUBLIC_MEDICAL_OFFICIAL ? PUBLIC_TABS
        : role === UserRole.ADMIN ? ADMIN_TABS
        : [];

    const isActive = (href: string) =>
        href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

    if (!tabs.length) return null;

    return (
        <nav
            className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-border/30 safe-bottom"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'var(--glass-bg)', backdropFilter: 'blur(24px)' }}
        >
            <div className="flex items-stretch h-[60px]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-200 ${
                                active ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                            }`}
                        >
                            <div className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300 ${
                                active ? 'bg-primary/12' : ''
                            }`}>
                                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                                {active && (
                                    <span className="absolute -bottom-1 w-4 h-[3px] bg-primary rounded-full" />
                                )}
                            </div>
                            <span className={active ? 'font-bold' : ''}>{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
