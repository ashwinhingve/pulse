'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    Users,
    Settings,
    Activity,
    FileText,
    AlertTriangle,
    ArrowLeft,
    UserPlus,
    Trash2,
    Edit,
    Eye,
    Search,
    Filter,
    RefreshCw,
    CheckCircle,
    XCircle,
    ChevronRight,
} from 'lucide-react';
import { useAuthStore, UserRole, ROLE_DISPLAY_NAMES } from '@/lib/store/auth';
import { getAccessToken, getStoredSession } from '@/lib/mobile-auth';

interface User {
    id: string;
    username: string;
    fullName: string;
    role: string;
    clearanceLevel: number;
    department?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalCases: number;
    systemHealth: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeUsers: 0,
        totalCases: 0,
        systemHealth: 'Good',
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'settings'>('overview');

    // Check if user is admin
    const isAdmin = user?.role === UserRole.ADMIN ||
                    getStoredSession()?.user?.role === 'ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            router.replace('/dashboard');
            return;
        }
        fetchData();
    }, [isAdmin, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getAccessToken();

            // Fetch users
            const usersRes = await fetch(`${API_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
                setStats({
                    totalUsers: usersData.length,
                    activeUsers: usersData.filter((u: User) => u.isActive).length,
                    totalCases: 0,
                    systemHealth: 'Good',
                });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ARMY_MEDICAL_OFFICER':
                return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            case 'PUBLIC_MEDICAL_OFFICIAL':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            case 'ADMIN':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
        }
    };

    const getClearanceBadge = (level: number) => {
        const names = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];
        const colors = [
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        ];
        return { name: names[level] || 'UNKNOWN', color: colors[level] || colors[0] };
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background safe-all">
            {/* Header */}
            <header className="glass border-b border-border sticky top-0 z-30 h-16">
                <div className="container-app h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-muted rounded-xl touch-target transition-colors"
                        >
                            <ArrowLeft size={22} className="text-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-soft">
                                <Shield size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="font-bold text-foreground text-lg">Admin Panel</span>
                                <p className="text-2xs text-muted-foreground">System Management</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-xl touch-target transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-border bg-card">
                <div className="container-app flex gap-1 py-2">
                    {(['overview', 'users', 'settings'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedTab === tab
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="container-app py-6 space-y-6">
                {selectedTab === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <Users size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xs text-muted-foreground uppercase">Total Users</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xs text-muted-foreground uppercase">Active</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.activeUsers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                        <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xs text-muted-foreground uppercase">Cases</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.totalCases}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                        <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xs text-muted-foreground uppercase">Health</p>
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.systemHealth}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setSelectedTab('users')}
                                    className="p-4 bg-muted rounded-xl text-left hover:bg-muted/80 transition-colors flex items-center gap-3"
                                >
                                    <Users size={24} className="text-blue-500" />
                                    <div>
                                        <p className="font-medium text-foreground">Manage Users</p>
                                        <p className="text-sm text-muted-foreground">View and edit users</p>
                                    </div>
                                    <ChevronRight size={18} className="ml-auto text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => router.push('/admin/audit')}
                                    className="p-4 bg-muted rounded-xl text-left hover:bg-muted/80 transition-colors flex items-center gap-3"
                                >
                                    <FileText size={24} className="text-purple-500" />
                                    <div>
                                        <p className="font-medium text-foreground">Audit Logs</p>
                                        <p className="text-sm text-muted-foreground">View system logs</p>
                                    </div>
                                    <ChevronRight size={18} className="ml-auto text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => setSelectedTab('settings')}
                                    className="p-4 bg-muted rounded-xl text-left hover:bg-muted/80 transition-colors flex items-center gap-3"
                                >
                                    <Settings size={24} className="text-gray-500" />
                                    <div>
                                        <p className="font-medium text-foreground">Settings</p>
                                        <p className="text-sm text-muted-foreground">System configuration</p>
                                    </div>
                                    <ChevronRight size={18} className="ml-auto text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Users</h2>
                            <div className="space-y-3">
                                {users.slice(0, 5).map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                                {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{user.fullName || user.username}</p>
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                                            {ROLE_DISPLAY_NAMES[user.role as UserRole] || user.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {selectedTab === 'users' && (
                    <>
                        {/* Search and Filter */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <button className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2">
                                <UserPlus size={18} />
                                Add User
                            </button>
                        </div>

                        {/* Users List */}
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">User</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Clearance</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredUsers.map((user) => {
                                            const clearance = getClearanceBadge(user.clearanceLevel);
                                            return (
                                                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                                                {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">{user.fullName || user.username}</p>
                                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                            {ROLE_DISPLAY_NAMES[user.role as UserRole] || user.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${clearance.color}`}>
                                                            {clearance.name}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {user.isActive ? (
                                                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                                <CheckCircle size={14} />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                                                <XCircle size={14} />
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                                <Eye size={16} className="text-muted-foreground" />
                                                            </button>
                                                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                                <Edit size={16} className="text-muted-foreground" />
                                                            </button>
                                                            <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                                <Trash2 size={16} className="text-red-500" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {selectedTab === 'settings' && (
                    <div className="space-y-6">
                        {/* System Settings */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">System Settings</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <div>
                                        <p className="font-medium text-foreground">Demo Mode</p>
                                        <p className="text-sm text-muted-foreground">Enable demo features and sample data</p>
                                    </div>
                                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <div>
                                        <p className="font-medium text-foreground">Audit Logging</p>
                                        <p className="text-sm text-muted-foreground">Log all user actions</p>
                                    </div>
                                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <div>
                                        <p className="font-medium text-foreground">MFA Required</p>
                                        <p className="text-sm text-muted-foreground">Require MFA for all users</p>
                                    </div>
                                    <div className="w-12 h-6 bg-muted-foreground/30 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Demo Data Management */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Demo Data</h2>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={async () => {
                                        await fetch(`${API_URL}/demo/seed`, { method: 'POST' });
                                        fetchData();
                                    }}
                                    className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                                >
                                    Seed Demo Data
                                </button>
                                <button
                                    onClick={async () => {
                                        await fetch(`${API_URL}/demo/reset`, { method: 'POST' });
                                        fetchData();
                                    }}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                                >
                                    Reset Demo Data
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Warning: Resetting will delete all data and recreate demo users.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
