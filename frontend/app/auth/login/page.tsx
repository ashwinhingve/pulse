'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, User as UserIcon, Key, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error === 'CredentialsSignin'
                    ? 'Invalid username or password'
                    : result.error
                );
            } else if (result?.ok) {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err: any) {
            setError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = (user: string = 'maj.harris') => {
        setUsername(user);
        setPassword('Demo123!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 safe-all">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20">
                            <Shield className="h-10 w-10 text-primary" strokeWidth={2.5} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Lock className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">PulseLogic</h1>
                    <p className="text-slate-400 text-sm">
                        Military Medical Decision Support
                    </p>
                </div>

                {/* Demo Banner */}
                <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-amber-200 text-sm font-semibold">DEMO ENVIRONMENT</p>
                        <p className="text-amber-300/70 text-xs mt-0.5">
                            For demonstration purposes only. Not for clinical use.
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 p-6 sm:p-8">
                    {error && (
                        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-scale-in">
                            <AlertTriangle size={18} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/80 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    placeholder="Enter username"
                                    required
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3.5 bg-slate-900/80 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    placeholder="Enter password"
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Secure Login
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-xs text-slate-500">
                            Authorized personnel only. All access is monitored.
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-5 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Demo Credentials</p>

                        {/* Army Medical Officer */}
                        <div className="mb-3 p-2 rounded-lg bg-green-900/20 border border-green-800/30">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-green-400">Army Medical Officer</span>
                                <button
                                    type="button"
                                    onClick={() => fillDemoCredentials('maj.harris')}
                                    className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
                                >
                                    Use
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">maj.harris / Demo123!</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">Others: cpt.rodriguez, lt.chen</p>
                        </div>

                        {/* Public Medical Official */}
                        <div className="mb-3 p-2 rounded-lg bg-blue-900/20 border border-blue-800/30">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-blue-400">Public Medical Official</span>
                                <button
                                    type="button"
                                    onClick={() => fillDemoCredentials('dr.williams')}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Use
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">dr.williams / Demo123!</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">Others: dr.patel, dr.johnson</p>
                        </div>

                        {/* Admin */}
                        <div className="p-2 rounded-lg bg-purple-900/20 border border-purple-800/30">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-purple-400">System Administrator</span>
                                <button
                                    type="button"
                                    onClick={() => fillDemoCredentials('admin')}
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                                >
                                    Use
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">admin / Demo123!</p>
                        </div>
                    </div>
                </div>

                {/* Security Badges */}
                <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full">
                        <Lock size={12} />
                        <span className="font-medium">TLS 1.3 Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary text-xs bg-primary/10 px-3 py-1.5 rounded-full">
                        <Shield size={12} />
                        <span className="font-medium">Zero-Trust Auth</span>
                    </div>
                </div>

                {/* Version */}
                <div className="mt-6 text-center">
                    <p className="text-[10px] text-slate-600 font-mono">
                        PulseLogic v1.0.0 MVP (Demo)
                    </p>
                </div>
            </div>
        </div>
    );
}

// Loading fallback for Suspense
function LoginLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-slate-400 text-sm">Loading...</p>
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
