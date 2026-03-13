'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    hint?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
        const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="space-y-1.5">
                <label htmlFor={textareaId} className="block text-xs font-semibold text-muted-foreground tracking-wide">
                    {label}
                    {props.required && <span className="text-destructive ml-0.5">*</span>}
                </label>
                <textarea
                    ref={ref}
                    id={textareaId}
                    rows={rows}
                    className={cn(
                        'form-textarea',
                        error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
                        className
                    )}
                    aria-invalid={!!error}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-destructive animate-fade-in">{error}</p>
                )}
                {hint && !error && (
                    <p className="text-xs text-muted-foreground/70">{hint}</p>
                )}
            </div>
        );
    }
);

FormTextarea.displayName = 'FormTextarea';
export default FormTextarea;
