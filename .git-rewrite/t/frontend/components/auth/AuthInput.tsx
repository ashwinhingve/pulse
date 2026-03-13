'use client';

import { useState, forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    icon?: LucideIcon;
    error?: string;
    isPassword?: boolean;
    trailing?: ReactNode;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    (
        {
            label,
            icon: Icon,
            error,
            isPassword = false,
            trailing,
            className,
            id,
            disabled,
            value,
            ...props
        },
        ref,
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);

        const hasValue = value !== undefined && value !== '';
        const isActive = isFocused || hasValue;
        const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="space-y-1">
                <div
                    className={cn(
                        'group relative rounded-xl transition-all duration-200',
                        isFocused && !error && 'ring-2 ring-primary/30',
                        error && 'ring-2 ring-destructive/30',
                    )}
                >
                    {/* Leading icon */}
                    {Icon && (
                        <div
                            className={cn(
                                'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none z-10',
                                isFocused
                                    ? 'text-primary'
                                    : error
                                      ? 'text-destructive/60'
                                      : 'text-slate-500',
                            )}
                        >
                            <Icon size={17} />
                        </div>
                    )}

                    {/* Floating label */}
                    <label
                        htmlFor={inputId}
                        className={cn(
                            'absolute left-0 transition-all duration-200 pointer-events-none z-10',
                            Icon ? 'left-11' : 'left-4',
                            isActive
                                ? 'top-2 text-[10px] font-semibold uppercase tracking-wider'
                                : 'top-1/2 -translate-y-1/2 text-sm',
                            isFocused
                                ? 'text-primary'
                                : error
                                  ? 'text-destructive/70'
                                  : 'text-slate-500',
                        )}
                    >
                        {label}
                    </label>

                    <input
                        ref={ref}
                        id={inputId}
                        type={
                            isPassword
                                ? showPassword
                                    ? 'text'
                                    : 'password'
                                : props.type || 'text'
                        }
                        value={value}
                        disabled={disabled}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        className={cn(
                            'w-full bg-slate-800/60 border rounded-xl text-white outline-none transition-all duration-200',
                            'pt-6 pb-2 min-h-[56px]',
                            Icon ? 'pl-11' : 'pl-4',
                            isPassword || trailing ? 'pr-12' : 'pr-4',
                            error
                                ? 'border-destructive/40 bg-destructive/5'
                                : 'border-slate-700/60 hover:border-slate-600/80 focus:border-primary/60',
                            disabled && 'opacity-50 cursor-not-allowed',
                            error && 'animate-shake',
                            className,
                        )}
                        {...props}
                    />

                    {/* Password toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors z-10 touch-target flex items-center justify-center"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={17} />
                            ) : (
                                <Eye size={17} />
                            )}
                        </button>
                    )}

                    {/* Custom trailing element */}
                    {trailing && !isPassword && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                            {trailing}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-destructive text-xs font-medium pl-1 animate-slide-down">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

AuthInput.displayName = 'AuthInput';
export default AuthInput;
