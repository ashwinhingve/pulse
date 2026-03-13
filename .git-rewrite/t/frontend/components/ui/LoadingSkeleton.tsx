'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
    variant?: 'card' | 'row' | 'text' | 'avatar' | 'stat';
    count?: number;
    className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
    return <div className={cn('bg-muted/60 rounded-lg animate-pulse', className)} />;
}

function CardSkeleton() {
    return (
        <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-3">
                <SkeletonPulse className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <SkeletonPulse className="h-4 w-32" />
                    <SkeletonPulse className="h-3 w-20" />
                </div>
            </div>
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-3/4" />
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
            <SkeletonPulse className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
                <SkeletonPulse className="h-3.5 w-48" />
                <SkeletonPulse className="h-3 w-32" />
            </div>
            <SkeletonPulse className="h-3 w-16" />
        </div>
    );
}

function StatSkeleton() {
    return (
        <div className="glass-card p-5">
            <SkeletonPulse className="w-11 h-11 rounded-2xl mb-3" />
            <SkeletonPulse className="h-7 w-14 mb-1.5" />
            <SkeletonPulse className="h-4 w-20" />
        </div>
    );
}

function TextSkeleton() {
    return (
        <div className="space-y-2">
            <SkeletonPulse className="h-3.5 w-full" />
            <SkeletonPulse className="h-3.5 w-5/6" />
            <SkeletonPulse className="h-3.5 w-2/3" />
        </div>
    );
}

export default function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
    const Skeleton = {
        card: CardSkeleton,
        row: RowSkeleton,
        stat: StatSkeleton,
        text: TextSkeleton,
        avatar: () => <SkeletonPulse className="w-12 h-12 rounded-full" />,
    }[variant];

    return (
        <div className={cn(
            variant === 'card' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
            variant === 'stat' && 'grid grid-cols-2 sm:grid-cols-4 gap-4',
            variant === 'row' && 'glass-card overflow-hidden',
            className
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} />
            ))}
        </div>
    );
}
