'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import {
    Shield, Lock, User as UserIcon, Key, AlertTriangle,
    Loader2, Clock, CheckCircle2, ArrowRight, ArrowLeft,
    Stethoscope, Building2, Hash, MapPin, Award, FileText,
    Sparkles, HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthInput from '@/components/auth/AuthInput';
import PasswordStrength from '@/components/auth/PasswordStrength';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ROLE_LABELS: Record<string, string> = {
    army_medical_officer: 'Army Medical Officer',
    public_medical_official: 'Public Medical Official',
};

const STEPS = [
    { number: 1, label: 'Role', icon: Shield },
    { number: 2, label: 'Details', icon: UserIcon },
    { number: 3, label: 'Security', icon: Lock },
];

/* ─── Pending Success View ─────────────────────────────── */
function PendingView({ username, requestedRole }: { username: string; requestedRole: string }) {
    return (
        <AuthLayout title="Registration Submitted" subtitle="Account pending administrator approval" showIllustration={false}>
            {/* Animated icon */}
            <div className="flex justify-center mb-6 animate-pop-in">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-amber-500/15 animate-pulse-soft" />
                    <div className="relative w-full h-full rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                        <Clock className="w-9 h-9 text-amber-400" />
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl mb-5 animate-fade-in">
                <div className="flex items-start gap-3">
                    <Clock className="text-amber-400 flex-shrink-0 mt-0.5" size={17} />
                    <div>
                        <p className="text-amber-200 font-semibold text-sm">Awaiting Approval</p>
                        <p className="text-amber-300/60 text-xs mt-1">
                            A system administrator will review and activate your account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Account summary */}
            <div className="bg-slate-800/40 rounded-xl p-4 space-y-2.5 mb-5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                {[
                    { label: 'Username', value: username, mono: true },
                    { label: 'Requested Role', value: ROLE_LABELS[requestedRole] ?? requestedRole },
                    { label: 'Status', value: 'Pending Review', highlight: true },
                ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{row.label}</span>
                        <span className={cn(
                            row.mono && 'font-mono',
                            row.highlight ? 'text-amber-400 font-semibold' : 'text-white',
                        )}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Next steps */}
            <div className="space-y-2 mb-6 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">What happens next</p>
                {[
                    'Admin reviews your request',
                    'Account activated with appropriate role',
                    'You receive access to the system',
                ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                        <div className="w-6 h-6 rounded-lg bg-slate-700/80 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
                            {i + 1}
                        </div>
                        {step}
                    </div>
                ))}
            </div>

            <Link
                href="/auth/login"
                className="group flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 min-h-[52px]"
            >
                <CheckCircle2 size={16} />
                Back to Login
                <ArrowRight size={14} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </Link>
        </AuthLayout>
    );
}

/* ─── Register Form ────────────────────────────────────── */
function RegisterForm() {
    const [pending, setPending] = useState<{ username: string; requestedRole: string } | null>(null);
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: '',
        department: '',
        rank: '',
        serviceNumber: '',
        unit: '',
        title: '',
        licenseNumber: '',
        specialization: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (pending) {
        return <PendingView username={pending.username} requestedRole={pending.requestedRole} />;
    }

    const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
    const isArmy = form.role === 'army_medical_officer';
    const isPublic = form.role === 'public_medical_official';

    const canProceedStep1 = form.role !== '';
    const canProceedStep2 = form.username.length > 0;
    const canSubmit = form.password.length >= 8 && form.password === form.confirmPassword;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const metadata: Record<string, string> = {};
            if (isArmy) {
                if (form.rank) metadata.rank = form.rank;
                if (form.serviceNumber) metadata.serviceNumber = form.serviceNumber;
                if (form.unit) metadata.unit = form.unit;
            } else if (isPublic) {
                if (form.title) metadata.title = form.title;
                if (form.licenseNumber) metadata.licenseNumber = form.licenseNumber;
                if (form.specialization) metadata.specialization = form.specialization;
            }

            const body: Record<string, any> = {
                username: form.username,
                password: form.password,
                role: form.role,
            };
            if (form.fullName) body.fullName = form.fullName;
            if (form.department) body.department = form.department;
            if (Object.keys(metadata).length) body.metadata = metadata;

            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Registration failed');
            }

            const data = await res.json();
            setPending({
                username: form.username,
                requestedRole: data.requestedRole || form.role,
            });
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const goNext = () => {
        if (step < 3) setStep(step + 1);
    };
    const goBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <AuthLayout title="Create Account" subtitle="Join PulseLogic Clinical Platform" showIllustration={false}>
            {/* Stepper */}
            <div className="flex items-center justify-between mb-7">
                {STEPS.map((s, i) => {
                    const isActive = step === s.number;
                    const isDone = step > s.number;
                    const StepIcon = s.icon;

                    return (
                        <div key={s.number} className="flex items-center flex-1 last:flex-none">
                            <button
                                type="button"
                                onClick={() => {
                                    if (isDone) setStep(s.number);
                                }}
                                disabled={!isDone}
                                className={cn(
                                    'flex items-center gap-2 transition-all',
                                    isDone && 'cursor-pointer',
                                )}
                            >
                                <div
                                    className={cn(
                                        'w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300',
                                        isActive && 'bg-primary/15 border-primary/40 text-primary shadow-glow-teal',
                                        isDone && 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
                                        !isActive && !isDone && 'bg-slate-800/40 border-slate-700/50 text-slate-600',
                                    )}
                                >
                                    {isDone ? (
                                        <CheckCircle2 size={16} />
                                    ) : (
                                        <StepIcon size={15} />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-xs font-semibold hidden sm:inline transition-colors',
                                        isActive && 'text-white',
                                        isDone && 'text-emerald-400',
                                        !isActive && !isDone && 'text-slate-600',
                                    )}
                                >
                                    {s.label}
                                </span>
                            </button>

                            {/* Connector */}
                            {i < STEPS.length - 1 && (
                                <div className="flex-1 mx-3">
                                    <div className="h-[2px] rounded-full bg-slate-800 relative overflow-hidden">
                                        <div
                                            className={cn(
                                                'absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500',
                                                isDone ? 'w-full' : 'w-0',
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step indicator */}
            <p className="text-xs text-slate-500 mb-4 font-medium">
                Step {step} of 3 — <span className="text-slate-400">{STEPS[step - 1].label}</span>
            </p>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-destructive/8 border border-destructive/25 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-scale-in">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleRegister}>
                {/* ── Step 1: Role ────────────────────────────── */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Select your role</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Army card */}
                            <button
                                type="button"
                                onClick={() => set('role', 'army_medical_officer')}
                                className={cn(
                                    'group relative rounded-xl border p-5 text-left transition-all duration-200',
                                    form.role === 'army_medical_officer'
                                        ? 'bg-primary/8 border-primary/40 ring-2 ring-primary/20 shadow-lg shadow-primary/5'
                                        : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/60 hover:bg-slate-800/50',
                                )}
                            >
                                <div className={cn(
                                    'w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all',
                                    form.role === 'army_medical_officer'
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-slate-700/40 text-slate-500 group-hover:text-slate-400',
                                )}>
                                    <Shield size={22} />
                                </div>
                                <p className="text-sm font-bold text-white mb-0.5">Army Medical Officer</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed">Military healthcare personnel with field & clinical access</p>
                                {form.role === 'army_medical_officer' && (
                                    <div className="absolute top-3 right-3">
                                        <CheckCircle2 size={18} className="text-primary" />
                                    </div>
                                )}
                            </button>

                            {/* Public card */}
                            <button
                                type="button"
                                onClick={() => set('role', 'public_medical_official')}
                                className={cn(
                                    'group relative rounded-xl border p-5 text-left transition-all duration-200',
                                    form.role === 'public_medical_official'
                                        ? 'bg-primary/8 border-primary/40 ring-2 ring-primary/20 shadow-lg shadow-primary/5'
                                        : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/60 hover:bg-slate-800/50',
                                )}
                            >
                                <div className={cn(
                                    'w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all',
                                    form.role === 'public_medical_official'
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-slate-700/40 text-slate-500 group-hover:text-slate-400',
                                )}>
                                    <Stethoscope size={22} />
                                </div>
                                <p className="text-sm font-bold text-white mb-0.5">Public Medical Official</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed">Public health administrator with oversight capabilities</p>
                                {form.role === 'public_medical_official' && (
                                    <div className="absolute top-3 right-3">
                                        <CheckCircle2 size={18} className="text-primary" />
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Next button */}
                        <button
                            type="button"
                            disabled={!canProceedStep1}
                            onClick={goNext}
                            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] group shadow-lg shadow-primary/20 disabled:shadow-none"
                        >
                            Continue
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )}

                {/* ── Step 2: Details ─────────────────────────── */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <AuthInput
                            label="Username"
                            icon={UserIcon}
                            value={form.username}
                            onChange={e => set('username', e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="username"
                        />

                        <AuthInput
                            label="Full Name (optional)"
                            icon={UserIcon}
                            value={form.fullName}
                            onChange={e => set('fullName', e.target.value)}
                            disabled={loading}
                        />

                        <AuthInput
                            label={isArmy ? 'Department (e.g. Medical Corps)' : 'Department (e.g. Cardiology)'}
                            icon={Building2}
                            value={form.department}
                            onChange={e => set('department', e.target.value)}
                            disabled={loading}
                        />

                        {/* Army-specific */}
                        {isArmy && (
                            <div className="grid grid-cols-2 gap-3 animate-slide-down">
                                <AuthInput
                                    label="Rank"
                                    icon={Award}
                                    value={form.rank}
                                    onChange={e => set('rank', e.target.value)}
                                    disabled={loading}
                                />
                                <AuthInput
                                    label="Unit"
                                    icon={MapPin}
                                    value={form.unit}
                                    onChange={e => set('unit', e.target.value)}
                                    disabled={loading}
                                />
                                <div className="col-span-2">
                                    <AuthInput
                                        label="Service Number"
                                        icon={Hash}
                                        value={form.serviceNumber}
                                        onChange={e => set('serviceNumber', e.target.value)}
                                        disabled={loading}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Public-specific */}
                        {isPublic && (
                            <div className="grid grid-cols-2 gap-3 animate-slide-down">
                                <AuthInput
                                    label="Title (e.g. Dr.)"
                                    icon={Award}
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    disabled={loading}
                                />
                                <AuthInput
                                    label="Specialization"
                                    icon={Stethoscope}
                                    value={form.specialization}
                                    onChange={e => set('specialization', e.target.value)}
                                    disabled={loading}
                                />
                                <div className="col-span-2">
                                    <AuthInput
                                        label="License Number"
                                        icon={FileText}
                                        value={form.licenseNumber}
                                        onChange={e => set('licenseNumber', e.target.value)}
                                        disabled={loading}
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex-1 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 font-medium flex items-center justify-center gap-2 hover:bg-slate-800 hover:border-slate-600/60 transition-all active:scale-[0.98] min-h-[52px]"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={!canProceedStep2}
                                onClick={goNext}
                                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] group shadow-lg shadow-primary/20 disabled:shadow-none"
                            >
                                Continue
                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Security ────────────────────────── */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <AuthInput
                            label="Password"
                            icon={Key}
                            isPassword
                            value={form.password}
                            onChange={e => set('password', e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="new-password"
                        />

                        {/* Password strength */}
                        <PasswordStrength password={form.password} />

                        <AuthInput
                            label="Confirm Password"
                            icon={Key}
                            isPassword
                            value={form.confirmPassword}
                            onChange={e => set('confirmPassword', e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="new-password"
                            error={
                                form.confirmPassword && form.password !== form.confirmPassword
                                    ? 'Passwords do not match'
                                    : undefined
                            }
                        />

                        {/* Navigation */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex-1 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 font-medium flex items-center justify-center gap-2 hover:bg-slate-800 hover:border-slate-600/60 transition-all active:scale-[0.98] min-h-[52px]"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !canSubmit}
                                className="flex-[2] group relative overflow-hidden py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent disabled:from-slate-700 disabled:to-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none min-h-[52px]"
                            >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                                <span className="relative flex items-center gap-2">
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={17} />
                                            Create Account
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </form>

            {/* Footer */}
            <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
                <p className="text-[11px] text-slate-600">
                    Account activation requires administrator approval.
                </p>
            </div>
        </AuthLayout>
    );
}

function RegisterLoading() {
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

export default function RegisterPage() {
    return (
        <Suspense fallback={<RegisterLoading />}>
            <RegisterForm />
        </Suspense>
    );
}
