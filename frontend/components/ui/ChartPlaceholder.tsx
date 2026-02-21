'use client';

import { cn } from '@/lib/utils';

interface ChartPlaceholderProps {
    type?: 'bar' | 'line' | 'donut';
    title: string;
    subtitle?: string;
    className?: string;
}

export default function ChartPlaceholder({ type = 'bar', title, subtitle, className }: ChartPlaceholderProps) {
    return (
        <div className={cn('glass-card p-5', className)}>
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className="h-44 flex items-end justify-center gap-2 px-2">
                {type === 'bar' && (
                    <>
                        {[65, 45, 80, 55, 90, 40, 70, 60, 85, 50, 75, 95].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30 transition-all duration-500"
                                style={{
                                    height: `${h}%`,
                                    animationDelay: `${i * 50}ms`,
                                }}
                            />
                        ))}
                    </>
                )}
                {type === 'line' && (
                    <svg viewBox="0 0 300 140" className="w-full h-full">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,100 Q30,80 60,70 T120,50 T180,65 T240,30 T300,45" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M0,100 Q30,80 60,70 T120,50 T180,65 T240,30 T300,45 L300,140 L0,140 Z" fill="url(#lineGrad)" />
                    </svg>
                )}
                {type === 'donut' && (
                    <svg viewBox="0 0 120 120" className="w-32 h-32">
                        <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
                        <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="12"
                            strokeDasharray="180 283" strokeLinecap="round" transform="rotate(-90 60 60)" />
                        <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(187 72% 43%)" strokeWidth="12"
                            strokeDasharray="60 283" strokeDashoffset="-180" strokeLinecap="round" transform="rotate(-90 60 60)" />
                        <text x="60" y="58" textAnchor="middle" className="fill-foreground text-xl font-bold font-display" fontSize="18">72%</text>
                        <text x="60" y="74" textAnchor="middle" className="fill-muted-foreground" fontSize="9">Completed</text>
                    </svg>
                )}
            </div>
        </div>
    );
}
