'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings,
    Activity,
    MessageSquare
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

export default function BottomNav({ role }: { role: string }) {
    const pathname = usePathname();
    const navItems = roleNavItems[role.toLowerCase()] || [];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
