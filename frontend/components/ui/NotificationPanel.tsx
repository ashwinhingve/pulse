'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

const typeConfig = {
    info: { icon: Info, bg: 'bg-medical-blue-100 dark:bg-medical-blue-600/20', text: 'text-medical-blue-600 dark:text-medical-blue-400' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    success: { icon: CheckCircle, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    alert: { icon: AlertTriangle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
};

function timeAgo(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
        } catch {
            // Silently fail — use empty list if backend not reachable
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount and every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Fetch fresh data when panel is opened
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n),
            );
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { /* ignore */ }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch { /* ignore */ }
    };

    return (
        <div className="relative">
            <button
                id="notification-bell-btn"
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl hover:bg-muted transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} className="text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
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
                            className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck size={12} /> All read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="p-1 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <X size={16} className="text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
                                {loading && notifications.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Bell size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                                        <p className="text-sm text-muted-foreground">No notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((n, i) => {
                                        const tc = typeConfig[n.type] ?? typeConfig.info;
                                        const Icon = tc.icon;
                                        return (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                onClick={() => !n.isRead && handleMarkRead(n.id)}
                                                className={cn(
                                                    'group flex gap-3 p-3.5 border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors cursor-pointer',
                                                    !n.isRead && 'bg-primary/[0.025]',
                                                )}
                                            >
                                                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', tc.bg)}>
                                                    <Icon size={15} className={tc.text} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={cn('text-sm text-foreground leading-snug', !n.isRead && 'font-semibold')}>
                                                            {n.title}
                                                        </p>
                                                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!n.isRead && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(n.id, e)}
                                                                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                                                        <Clock size={9} /> {timeAgo(n.createdAt)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
