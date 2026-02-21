'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    backHref?: string;
    actions?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title, subtitle, icon: Icon, iconColor, iconBg, backHref = '/dashboard', actions, className,
}: PageHeaderProps) {
    const router = useRouter();

    return (
        <header className={cn('sticky top-0 z-30 h-16 flex-shrink-0 border-b border-border/40 bg-card/80 backdrop-blur-xl', className)}>
            <div className="h-full px-4 lg:px-6 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(backHref)}
                        className="p-2 hover:bg-muted/50 rounded-xl lg:hidden touch-target transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} className="text-foreground" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center',
                                iconBg || 'bg-primary/10'
                            )}>
                                <Icon size={18} className={cn(iconColor || 'text-primary')} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
                            {subtitle && <p className="text-2xs text-muted-foreground">{subtitle}</p>}
                        </div>
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </header>
    );
}
