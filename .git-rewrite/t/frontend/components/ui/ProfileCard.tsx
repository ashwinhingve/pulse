'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
    name: string;
    subtitle: string;
    initials?: string;
    avatarColor?: 'teal' | 'blue' | 'purple' | 'cyan';
    badge?: string;
    badgeColor?: string;
    stats?: { label: string; value: string | number }[];
    onClick?: () => void;
    delay?: number;
    className?: string;
}

const avatarColorMap = {
    teal: 'from-medical-teal-400 to-medical-teal-600',
    blue: 'from-medical-blue-400 to-medical-blue-600',
    purple: 'from-medical-purple-400 to-medical-purple-500',
    cyan: 'from-medical-cyan-400 to-medical-cyan-500',
};

export default function ProfileCard({
    name, subtitle, initials, avatarColor = 'teal',
    badge, badgeColor, stats, onClick, delay = 0, className,
}: ProfileCardProps) {
    const displayInitials = initials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: 'easeOut' }}
            onClick={onClick}
            className={cn(
                'glass-card p-5 group transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1',
                onClick && 'cursor-pointer',
                className
            )}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                    'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-soft',
                    avatarColorMap[avatarColor]
                )}>
                    {displayInitials}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                </div>
                {badge && (
                    <span className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        badgeColor || 'bg-medical-teal-100 text-medical-teal-700 dark:bg-medical-teal-900/30 dark:text-medical-teal-400'
                    )}>
                        {badge}
                    </span>
                )}
            </div>
            {stats && stats.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                    {stats.map(s => (
                        <div key={s.label} className="text-center">
                            <p className="text-lg font-bold text-foreground font-display">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
