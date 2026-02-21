'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    User as UserIcon,
    Mail,
    Lock,
    Building2,
    Briefcase,
    Award,
    CreditCard,
    Calendar,
    Clock,
    Settings,
    LogOut,
    Bell,
    Key,
    Fingerprint,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react';
import {
    useAuthStore,
    UserRole,
    ClearanceLevel,
    ROLE_DISPLAY_NAMES,
    CLEARANCE_NAMES,
} from '@/lib/store/auth';
import { isMobileBuild, mobileLogout, getStoredSession } from '@/lib/mobile-auth';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';

export default function ProfilePage() {
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/auth/login' });
        }
    };

    // Get user data
    const userRole = (user?.role || mobileUser?.role) as UserRole;
    const isArmyOfficer = userRole === UserRole.ARMY_MEDICAL_OFFICER;
    const isPublicOfficial = userRole === UserRole.PUBLIC_MEDICAL_OFFICIAL;
    const isAdmin = userRole === UserRole.ADMIN;

    const displayName = user?.fullName || mobileUser?.fullName || user?.username || mobileUser?.username || 'User';
    const username = user?.username || mobileUser?.username || 'unknown';
    const clearanceLevel: ClearanceLevel = user?.clearanceLevel ?? mobileUser?.clearanceLevel ?? ClearanceLevel.UNCLASSIFIED;
    const department = user?.department || mobileUser?.department || 'Not assigned';
    const metadata = user?.metadata || {};

    const getRoleBadgeStyle = () => {
        if (isArmyOfficer) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
        if (isPublicOfficial) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700';
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700';
    };

    const getClearanceStyle = () => {
        switch (clearanceLevel) {
            case ClearanceLevel.TOP_SECRET:
                return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
            case ClearanceLevel.SECRET:
                return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
            case ClearanceLevel.CONFIDENTIAL:
                return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700';
            default:
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700';
        }
    };

    const getAvatarGradient = () => {
        if (isArmyOfficer) return 'from-green-500 to-emerald-600';
        if (isPublicOfficial) return 'from-blue-500 to-indigo-600';
        return 'from-purple-500 to-pink-600';
    };

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Profile"
                subtitle="Account Settings"
                icon={UserIcon}
            />

            <main className="flex-1 w-full">
                <div className="container-app py-6 space-y-6 animate-fade-in">
                {/* Profile Header Card */}
                <div className="glass-card p-6 overflow-hidden relative">
                    {/* Background gradient */}
                    <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-r ${getAvatarGradient()} opacity-10`} />

                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Avatar */}
                        <div className={`w-20 h-20 bg-gradient-to-br ${getAvatarGradient()} rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                            <p className="text-muted-foreground">@{username}</p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeStyle()}`}>
                                    {userRole ? ROLE_DISPLAY_NAMES[userRole] : 'User'}
                                </span>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getClearanceStyle()}`}>
                                    {CLEARANCE_NAMES[clearanceLevel] || 'UNCLASSIFIED'}
                                </span>
                            </div>
                        </div>

                        {/* Secure Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm">
                            <Shield size={16} />
                            <span className="font-medium">Verified</span>
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="glass-card">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CreditCard size={20} className="text-primary" />
                            Profile Information
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <UserIcon size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Full Name</p>
                                    <p className="font-medium text-foreground">{displayName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <Mail size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Username</p>
                                    <p className="font-medium text-foreground">{username}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <Building2 size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Department</p>
                                    <p className="font-medium text-foreground">{department}</p>
                                </div>
                            </div>
                        </div>

                        {/* Role-specific metadata */}
                        {isArmyOfficer && metadata.rank && (
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                        <Award size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rank</p>
                                        <p className="font-medium text-foreground">{metadata.rank}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isArmyOfficer && metadata.serviceNumber && (
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                        <Briefcase size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service Number</p>
                                        <p className="font-medium text-foreground font-mono">{metadata.serviceNumber}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPublicOfficial && metadata.title && (
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                        <Award size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Title</p>
                                        <p className="font-medium text-foreground">{metadata.title}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPublicOfficial && metadata.licenseNumber && (
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                        <CreditCard size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">License Number</p>
                                        <p className="font-medium text-foreground font-mono">{metadata.licenseNumber}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Section */}
                <div className="glass-card">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Lock size={20} className="text-primary" />
                            Security & Access
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <Shield size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Clearance Level</p>
                                    <p className={`font-medium ${getClearanceStyle().includes('red') ? 'text-red-600 dark:text-red-400' : getClearanceStyle().includes('orange') ? 'text-orange-600 dark:text-orange-400' : getClearanceStyle().includes('amber') ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {CLEARANCE_NAMES[clearanceLevel] || 'UNCLASSIFIED'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <Key size={18} className="text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-foreground">Change Password</p>
                                    <p className="text-sm text-muted-foreground">Update your password</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-muted-foreground" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <Fingerprint size={18} className="text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                                    <p className="text-sm text-muted-foreground">
                                        {user?.mfaEnabled ? 'Enabled' : 'Not enabled'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="glass-card">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Settings size={20} className="text-primary" />
                            Preferences
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                    <Bell size={18} className="text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-foreground">Notifications</p>
                                    <p className="text-sm text-muted-foreground">Manage alert preferences</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Session Info */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock size={16} />
                        <span>Session expires in 15 minutes of inactivity</span>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full glass-card p-4 flex items-center justify-center gap-3 text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>

                {/* Version */}
                <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground font-mono">
                        PulseLogic v1.0.0 MVP
                    </p>
                </div>
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            <Modal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Sign Out?" subtitle="You will need to sign in again" size="sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={24} className="text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground">Are you sure you want to sign out of your account?</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </Modal>
        </div>
    );
}
