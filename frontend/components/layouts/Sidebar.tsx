'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings,
    Activity,
    MessageSquare,
    LogOut
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const roleNavItems: Record<string, NavItem[]> = {
    doctor: [
        { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/doctor/patients', label: 'Patients', icon: Users },
        { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
        { href: '/doctor/chat', label: 'Chat', icon: MessageSquare },
    ],
    specialist: [
        { href: '/specialist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/specialist/consultations', label: 'Consultations', icon: FileText },
        { href: '/specialist/reports', label: 'Reports', icon: Activity },
        { href: '/specialist/chat', label: 'Chat', icon: MessageSquare },
    ],
    admin: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
        { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
    ],
    medic: [
        { href: '/medic/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/medic/patients', label: 'Patients', icon: Users },
        { href: '/medic/chat', label: 'Chat', icon: MessageSquare },
    ],
};

export default function Sidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const navItems = roleNavItems[role.toLowerCase()] || [];

    return (
        <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    PulseLogic
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {role} Portal
                </p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4">
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
