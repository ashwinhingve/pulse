'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
    variant?: 'default' | 'elevated' | 'subtle';
    hover?: boolean;
    glow?: 'teal' | 'blue' | 'purple' | 'none';
    children: React.ReactNode;
    className?: string;
}

const glowMap = {
    teal: 'hover:shadow-glow-teal',
    blue: 'hover:shadow-glow-blue',
    purple: 'hover:shadow-glow-purple',
    none: '',
};

export default function GlassCard({
    variant = 'default',
    hover = true,
    glow = 'none',
    children,
    className,
    ...motionProps
}: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                'glass-card',
                variant === 'elevated' && 'shadow-glass-lg',
                variant === 'subtle' && 'bg-card/50 border-transparent',
                hover && 'hover:shadow-glass-lg hover:-translate-y-0.5 transition-all duration-300',
                glowMap[glow],
                className
            )}
            {...motionProps}
        >
            {children}
        </motion.div>
    );
}
