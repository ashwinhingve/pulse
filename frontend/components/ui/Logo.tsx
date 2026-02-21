'use client';

import { cn } from '@/lib/utils';

interface LogoIconProps {
    size?: number;
    className?: string;
}

/**
 * PulseLogic shield+pulse icon — used as standalone favicon-style mark.
 * Renders an inline SVG so it always looks crisp and matches the design system.
 */
export function LogoIcon({ size = 32, className }: LogoIconProps) {
    return (
        <svg
            viewBox="0 0 72 76"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('flex-shrink-0', className)}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
            </defs>
            {/* Shield */}
            <path
                d="M36 2 C36 2 66 10 66 10 C66 10 66 40 66 45 C66 60 50 70 36 74 C22 70 6 60 6 45 C6 40 6 10 6 10 Z"
                fill="url(#logo-grad)"
            />
            {/* ECG pulse line */}
            <polyline
                points="12,40 22,40 28,28 36,54 44,24 50,40 60,40"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showText?: boolean;
}

const sizeConfig = {
    sm: { icon: 28, text: 'text-base' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' },
};

/**
 * Full PulseLogic logo — icon + wordmark.
 * Use `showText={false}` for icon-only mode (e.g. collapsed sidebar).
 */
export default function Logo({ size = 'md', className, showText = true }: LogoProps) {
    const config = sizeConfig[size];

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <LogoIcon size={config.icon} />
            {showText && (
                <span className={cn('font-bold tracking-tight font-display', config.text)}>
                    <span className="text-foreground">Pulse</span>
                    <span className="text-primary">Logic</span>
                </span>
            )}
        </div>
    );
}
