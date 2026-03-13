'use client';

import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    if (reducedMotion) {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
                {/* Static subtle gradient for reduced-motion users */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
            {/* Gradient blobs — using medical palette tokens from tailwind config */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-medical-teal-200/20 dark:bg-medical-teal-500/5 rounded-full blur-3xl animate-float-slow will-change-transform" />
            <div className="absolute top-1/3 -left-32 w-80 h-80 bg-medical-blue-200/15 dark:bg-medical-blue-500/5 rounded-full blur-3xl animate-float-delayed will-change-transform" />
            <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-medical-purple-200/10 dark:bg-medical-purple-500/5 rounded-full blur-3xl animate-blob will-change-transform" />
            <div
                className="absolute top-2/3 left-1/3 w-60 h-60 bg-medical-cyan-200/10 dark:bg-medical-cyan-500/5 rounded-full blur-3xl animate-float-slow will-change-transform"
                style={{ animationDelay: '2s' }}
            />

            {/* Subtle dot grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />
        </div>
    );
}
