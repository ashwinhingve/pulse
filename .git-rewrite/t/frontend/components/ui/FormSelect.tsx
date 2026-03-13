'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    icon?: LucideIcon;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label, icon: Icon, error, options, placeholder, className, id, ...props }, ref) => {
        const selectId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="space-y-1.5">
                <label htmlFor={selectId} className="block text-xs font-semibold text-muted-foreground tracking-wide">
                    {label}
                    {props.required && <span className="text-destructive ml-0.5">*</span>}
                </label>
                <div className="relative">
                    {Icon && (
                        <Icon
                            size={16}
                            className={cn(
                                'absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none',
                                error ? 'text-destructive' : 'text-muted-foreground/50'
                            )}
                        />
                    )}
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            'form-select appearance-none',
                            Icon && 'pl-10',
                            error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
                            className
                        )}
                        aria-invalid={!!error}
                        {...props}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50"
                    />
                </div>
                {error && (
                    <p className="text-xs text-destructive animate-fade-in">{error}</p>
                )}
            </div>
        );
    }
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
