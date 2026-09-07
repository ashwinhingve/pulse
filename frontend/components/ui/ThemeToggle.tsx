'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
    compact?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false, compact = false }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={`w-9 h-9 rounded-full bg-muted border border-border animate-pulse ${className}`} />
        );
    }

    const isDark = resolvedTheme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    if (compact) {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`relative group flex items-center justify-center w-9 h-9 rounded-full bg-muted border border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm ${className}`}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
                <div className="relative w-4 h-4 flex items-center justify-center">
                    <Sun
                        size={16}
                        className={`absolute text-amber-500 transition-all duration-500 ease-spring ${
                            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                        }`}
                    />
                    <Moon
                        size={16}
                        className={`absolute text-teal-400 transition-all duration-500 ease-spring ${
                            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                        }`}
                    />
                </div>
            </button>
        );
    }

    return (
        <div className={`inline-flex items-center gap-1.5 p-1 rounded-full bg-muted border border-border shadow-inner backdrop-blur-md transition-all duration-300 ${className}`}>
            <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    theme === 'light'
                        ? 'bg-background text-foreground shadow-md scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Light Theme"
            >
                <Sun size={13} className={theme === 'light' ? 'text-amber-500 animate-spin-slow' : ''} />
                {showLabel && <span>Light</span>}
            </button>

            <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    theme === 'dark'
                        ? 'bg-background text-foreground shadow-md scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dark Theme"
            >
                <Moon size={13} className={theme === 'dark' ? 'text-teal-400' : ''} />
                {showLabel && <span>Dark</span>}
            </button>

            <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    theme === 'system'
                        ? 'bg-background text-foreground shadow-md scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                title="System Default"
            >
                <Laptop size={13} />
                {showLabel && <span>Auto</span>}
            </button>
        </div>
    );
}
