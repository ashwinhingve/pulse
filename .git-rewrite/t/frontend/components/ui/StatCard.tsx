'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    trend?: { value: string; positive: boolean };
    color?: 'teal' | 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'red';
    delay?: number;
    className?: string;
}

const colorMap = {
    teal: { bg: 'bg-medical-teal-100 dark:bg-medical-teal-900/30', text: 'text-medical-teal-600 dark:text-medical-teal-400', gradient: 'from-medical-teal-400 to-medical-teal-600' },
    blue: { bg: 'bg-medical-blue-100 dark:bg-medical-blue-600/20', text: 'text-medical-blue-600 dark:text-medical-blue-400', gradient: 'from-medical-blue-400 to-medical-blue-600' },
    purple: { bg: 'bg-medical-purple-100 dark:bg-medical-purple-500/20', text: 'text-medical-purple-500 dark:text-medical-purple-400', gradient: 'from-medical-purple-400 to-medical-purple-500' },
    cyan: { bg: 'bg-medical-cyan-100 dark:bg-medical-cyan-500/20', text: 'text-medical-cyan-500 dark:text-medical-cyan-400', gradient: 'from-medical-cyan-400 to-medical-cyan-500' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-emerald-600' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-amber-600' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', gradient: 'from-red-400 to-red-600' },
};

export default function StatCard({ icon: Icon, label, value, trend, color = 'teal', delay = 0, className }: StatCardProps) {
    const c = colorMap[color];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className={cn('glass-card p-5 group hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-300', className)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', c.bg)}>
                    <Icon size={20} className={c.text} />
                </div>
                {trend && (
                    <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        trend.positive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-foreground font-display tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </motion.div>
    );
}
