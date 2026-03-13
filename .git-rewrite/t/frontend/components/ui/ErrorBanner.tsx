'use client';

import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
    message: string;
    variant?: 'error' | 'success' | 'warning' | 'info';
    onDismiss?: () => void;
    className?: string;
}

const variantConfig = {
    error: {
        icon: AlertCircle,
        bg: 'bg-destructive/10 border-destructive/20',
        text: 'text-destructive',
    },
    success: {
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30',
        text: 'text-emerald-700 dark:text-emerald-400',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',
        text: 'text-amber-700 dark:text-amber-400',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30',
        text: 'text-blue-700 dark:text-blue-400',
    },
};

export default function ErrorBanner({ message, variant = 'error', onDismiss, className }: ErrorBannerProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-in',
            config.bg, config.text, className
        )}>
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1">{message}</span>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
                    aria-label="Dismiss"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
