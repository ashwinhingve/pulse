'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    onFilterClick?: () => void;
    className?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', onFilterClick, className }: SearchBarProps) {
    return (
        <div className={cn('relative flex items-center gap-2', className)}>
            <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="input-glass pl-11 pr-4 py-3 w-full"
                />
            </div>
            {onFilterClick && (
                <button
                    onClick={onFilterClick}
                    className="btn-glass px-3 py-3 min-h-0"
                    title="Filters"
                >
                    <SlidersHorizontal size={18} className="text-muted-foreground" />
                </button>
            )}
        </div>
    );
}
