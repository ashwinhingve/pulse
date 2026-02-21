'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    title: string;
    message: string;
    time: string;
    read?: boolean;
}

const typeConfig = {
    info: { icon: Info, bg: 'bg-medical-blue-100 dark:bg-medical-blue-600/20', text: 'text-medical-blue-600 dark:text-medical-blue-400' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    success: { icon: CheckCircle, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    alert: { icon: AlertTriangle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
};

const sampleNotifications: Notification[] = [
    { id: '1', type: 'alert', title: 'Critical Lab Result', message: 'Patient #2847 abnormal CBC results require review', time: '2 min ago' },
    { id: '2', type: 'info', title: 'New Case Assigned', message: 'Case #1052 assigned to your department', time: '15 min ago' },
    { id: '3', type: 'success', title: 'Report Approved', message: 'Monthly analytics report approved by admin', time: '1 hour ago' },
    { id: '4', type: 'warning', title: 'System Maintenance', message: 'Scheduled maintenance at 02:00 UTC tonight', time: '3 hours ago' },
];

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const unread = sampleNotifications.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            >
                <Bell size={20} className="text-muted-foreground" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                        {unread}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 glass-card shadow-glass-lg overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                                    <X size={16} className="text-muted-foreground" />
                                </button>
                            </div>
                            <div className="max-h-80 overflow-y-auto scrollbar-thin">
                                {sampleNotifications.map((n, i) => {
                                    const tc = typeConfig[n.type];
                                    const Icon = tc.icon;
                                    return (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={cn(
                                                'flex gap-3 p-4 border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors cursor-pointer',
                                                !n.read && 'bg-primary/[0.02]'
                                            )}
                                        >
                                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', tc.bg)}>
                                                <Icon size={16} className={tc.text} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                                                    <Clock size={10} /> {n.time}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
