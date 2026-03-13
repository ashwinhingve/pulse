'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
    password: string;
}

const REQUIREMENTS = [
    { label: '8+ characters', test: (p: string) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Number', test: (p: string) => /\d/.test(p) },
    { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
    'bg-red-500',
    'bg-amber-500',
    'bg-yellow-400',
    'bg-emerald-500',
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const { score, passed } = useMemo(() => {
        const results = REQUIREMENTS.map((r) => r.test(password));
        return { score: results.filter(Boolean).length, passed: results };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-3 animate-slide-down">
            {/* Strength bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1.5 flex-1 rounded-full transition-all duration-300',
                                i < score
                                    ? STRENGTH_COLORS[score - 1]
                                    : 'bg-slate-700/50',
                            )}
                        />
                    ))}
                </div>
                <span
                    className={cn(
                        'text-[11px] font-semibold uppercase tracking-wide transition-colors duration-200',
                        score <= 1
                            ? 'text-red-400'
                            : score === 2
                              ? 'text-amber-400'
                              : score === 3
                                ? 'text-yellow-400'
                                : 'text-emerald-400',
                    )}
                >
                    {STRENGTH_LABELS[score - 1] || 'Weak'}
                </span>
            </div>

            {/* Requirements */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {REQUIREMENTS.map((req, i) => (
                    <div
                        key={req.label}
                        className={cn(
                            'flex items-center gap-1.5 text-[11px] transition-colors duration-200',
                            passed[i] ? 'text-emerald-400' : 'text-slate-500',
                        )}
                    >
                        {passed[i] ? (
                            <Check size={12} className="flex-shrink-0" />
                        ) : (
                            <X size={12} className="flex-shrink-0 opacity-50" />
                        )}
                        {req.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
