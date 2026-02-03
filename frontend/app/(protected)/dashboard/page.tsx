'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore, UserRole } from '@/lib/store/auth'

export default function DashboardPage() {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { user, clearAuth } = useAuthStore()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const handleLogout = () => {
        clearAuth()
        router.push('/auth/login')
    }

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const isDoctor = user?.role === UserRole.DOCTOR || user?.role === UserRole.ADMIN

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                <Shield size={16} strokeWidth={3} />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white text-lg hidden sm:block">
                                PulseLogic
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-md">
                            <AlertTriangle size={14} />
                            SOS
                        </button>
                        <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <div
                        className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="font-bold text-lg">Menu</span>
                            <button onClick={() => setIsSidebarOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <nav className="space-y-2">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 overflow-y-auto">
                <div className="space-y-6 pb-8">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Welcome, {user?.username}</h2>
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    <Shield size={12} className="text-emerald-400" />
                                    Secure Vault Active • Clearance: {user?.clearanceLevel === 2 ? 'SECRET' : user?.clearanceLevel === 1 ? 'CONFIDENTIAL' : 'UNCLASSIFIED'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DashboardCard
                            icon={<Thermometer className="text-orange-500" />}
                            title="Check Symptoms"
                            desc="Encrypted scoring"
                            onClick={() => router.push('/dashboard/symptoms')}
                        />
                        <DashboardCard
                            icon={<Activity className="text-rose-500" />}
                            title="Upload ECG"
                            desc="Secure analysis"
                            onClick={() => router.push('/dashboard/ecg')}
                        />
                        <DashboardCard
                            icon={<MessageSquare className="text-indigo-500" />}
                            title={isDoctor ? 'Consults' : 'Secure Chat'}
                            desc="E2EE Channel"
                            onClick={() => router.push('/dashboard/chat')}
                        />
                        <DashboardCard
                            icon={<Stethoscope className="text-purple-500" />}
                            title="Pulse Assistant"
                            desc="AI Support"
                            onClick={() => router.push('/dashboard/assistant')}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}

function DashboardCard({
    icon,
    title,
    desc,
    onClick,
}: {
    icon: React.ReactNode
    title: string
    desc: string
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all text-left group w-full relative overflow-hidden h-full active:scale-[0.98]"
        >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Lock size={12} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div className="mb-4 bg-slate-50 dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
        </button>
    )
}
