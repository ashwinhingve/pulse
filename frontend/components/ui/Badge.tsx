'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
    size?: 'sm' | 'md';
    dot?: boolean;
    className?: string;
}

const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/25 text-purple-700 dark:text-purple-400',
    outline: 'bg-transparent border border-border text-muted-foreground',
};

const dotColors = {
    default: 'bg-muted-foreground',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
    outline: 'bg-muted-foreground',
};

export default function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap',
            size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
            variantClasses[variant],
            className
        )}>
            {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
            {children}
        </span>
    );
}
