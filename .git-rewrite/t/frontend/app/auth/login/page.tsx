'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Lock, User as UserIcon, Key, AlertTriangle,
    Loader2, CheckCircle2, ArrowRight, HeartPulse,
} from 'lucide-react';
import { mobileLogin, isMobileBuild } from '@/lib/mobile-auth';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
    const justRegistered = searchParams?.get('registered') === '1';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(isMobileBuild());
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isMobile) {
                await mobileLogin(username, password);
                router.push('/dashboard');
            } else {
                const result = await signIn('credentials', {
                    username,
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    if (result.error === 'ACCOUNT_PENDING') {
                        setError('Your account is pending administrator approval. You will be notified once it is activated.');
                    } else if (result.error === 'ACCOUNT_SUSPENDED') {
                        setError('Your account has been suspended. Please contact the system administrator.');
                    } else {
                        setError('Invalid username or password');
                    }
                } else if (result?.ok) {
                    router.push(callbackUrl);
                    router.refresh();
                }
            }
        } catch (err: any) {
            if (err.message === 'ACCOUNT_PENDING') {
                setError('Your account is pending administrator approval. You will be notified once it is activated.');
            } else if (err.message === 'ACCOUNT_SUSPENDED') {
                setError('Your account has been suspended. Please contact the system administrator.');
            } else {
                setError(err.message || 'Connection failed. Please check your network.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="PulseLogic"
            subtitle="Military Medical Decision Support"
            showIllustration={true}
        >
            {/* Welcome message */}
            <div className="mb-6 animate-fade-in">
                <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
                <p className="text-sm text-slate-400">Sign in to access your clinical dashboard</p>
            </div>

            {/* Just-registered banner */}
            {justRegistered && (
                <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3 text-amber-300 text-sm animate-slide-down">
                    <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-amber-400" />
                    <span>Registration submitted. Your account is pending administrator approval.</span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mb-5 p-3.5 bg-destructive/8 border border-destructive/25 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-scale-in">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                {/* Username */}
                <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                    <AuthInput
                        label="Username"
                        icon={UserIcon}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="username"
                        error={error && !username ? 'Username is required' : undefined}
                    />
                </div>

                {/* Password */}
                <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
                    <AuthInput
                        label="Password"
                        icon={Key}
                        isPassword
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="current-password"
                    />
                </div>

                {/* Submit */}
                <div className="pt-2 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className="group w-full relative overflow-hidden bg-gradient-to-r from-primary to-accent disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2.5 active:scale-[0.98] min-h-[56px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />

                        <span className="relative flex items-center gap-2.5">
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Lock size={17} />
                                    Sign In
                                    <ArrowRight size={16} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </form>

            {/* Divider */}
            <div className="relative my-6 animate-fade-in" style={{ animationDelay: '350ms', animationFillMode: 'backwards' }}>
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-slate-900/60 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                        or
                    </span>
                </div>
            </div>

            {/* Register link */}
            <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
                <Link
                    href="/auth/register"
                    className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-800/70 hover:border-slate-600/60 hover:text-white transition-all active:scale-[0.98] min-h-[48px]"
                >
                    <UserIcon size={15} className="text-primary" />
                    Create New Account
                    <ArrowRight size={14} className="opacity-40 group-hover:translate-x-0.5 group-hover:opacity-70 transition-all" />
                </Link>
            </div>

            {/* Footer note */}
            <p className="mt-5 text-center text-[11px] text-slate-600 animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'backwards' }}>
                Authorized personnel only. All access is monitored.
            </p>
        </AuthLayout>
    );
}

function LoginLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f1a] to-slate-950 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/15 rounded-2xl flex items-center justify-center border border-primary/20">
                        <HeartPulse className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-slate-400 text-sm font-medium">Loading PulseLogic...</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}
