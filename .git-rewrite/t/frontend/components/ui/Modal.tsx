'use client';

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({
    open, onClose, title, subtitle, size = 'md', children, footer, className,
}: ModalProps) {
    // Avoid rendering portal during SSR
    const [mounted, setMounted] = useState(false);

    const handleEsc = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [open, handleEsc]);

    if (!mounted) return null;

    // Render via portal so the modal is a direct child of document.body.
    // This ensures z-50 is compared at the root stacking context, above the
    // bottom tab bar (z-30) which is outside the main-scroll-content (z-10)
    // stacking context.
    return createPortal(
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            'relative w-full bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border/50 max-h-[90vh] flex flex-col overflow-hidden',
                            sizeMap[size],
                            className
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/50 flex-shrink-0">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-1 hover:bg-muted/60 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="px-5 sm:px-6 py-4 border-t border-border/50 flex-shrink-0 bg-muted/20">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
