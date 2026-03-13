'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    icon?: LucideIcon;
    error?: string;
    hint?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, icon: Icon, error, hint, type = 'text', className, id, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="space-y-1.5">
                <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground tracking-wide">
                    {label}
                    {props.required && <span className="text-destructive ml-0.5">*</span>}
                </label>
                <div className="relative">
                    {Icon && (
                        <Icon
                            size={16}
                            className={cn(
                                'absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors',
                                error ? 'text-destructive' : 'text-muted-foreground/50'
                            )}
                        />
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={isPassword && showPassword ? 'text' : type}
                        className={cn(
                            'form-input',
                            Icon && 'pl-10',
                            isPassword && 'pr-10',
                            error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
                            className
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-xs text-muted-foreground/70">{hint}</p>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
export default FormInput;
