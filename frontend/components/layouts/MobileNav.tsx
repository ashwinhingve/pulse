'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNav({ role }: { role: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();

    return (
        <>
            <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40">
                <div className="flex items-center justify-between px-4 h-16">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        PulseLogic
                    </h1>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile menu overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30 mt-16"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 w-64 h-full p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Logged in as
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {role}
                            </p>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/login' })}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
