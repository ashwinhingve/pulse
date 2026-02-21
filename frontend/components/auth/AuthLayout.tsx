'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Shield, Lock, Activity, Heart, Fingerprint, Wifi } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    showIllustration?: boolean;
}

export default function AuthLayout({
    children,
    title,
    subtitle,
    showIllustration = true,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex safe-all">
            {/* ── Decorative side panel (lg+) ───────────────── */}
            {showIllustration && (
                <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 items-center justify-center">
                    {/* Animated blobs */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-slow" />
                        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-float-delayed" />
                        <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-medical-purple-500/8 rounded-full blur-3xl animate-float" />
                    </div>

                    {/* Dot grid */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, hsl(172 55% 52%) 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 max-w-md px-12 text-center">
                        {/* Animated logo mark */}
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 shadow-glow-teal mb-8 animate-float">
                            <LogoIcon size={56} />
                        </div>

                        <h2 className="font-display text-3xl xl:text-4xl font-bold text-white mb-4 tracking-tight">
                            Secure Medical
                            <br />
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Decision Support
                            </span>
                        </h2>

                        <p className="text-slate-400 text-sm leading-relaxed mb-10">
                            Military-grade healthcare intelligence platform with
                            real-time analytics, AI-powered diagnostics, and
                            end-to-end encrypted communication.
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {[
                                { icon: Shield, label: 'HIPAA Compliant' },
                                { icon: Lock, label: 'E2E Encrypted' },
                                { icon: Heart, label: 'AI Diagnostics' },
                            ].map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-sm"
                                >
                                    <Icon size={13} className="text-primary" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom attribution */}
                    <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-slate-600 font-mono tracking-wider">
                        PULSELOGIC DEFENSE MEDICAL SYSTEM
                    </p>
                </div>
            )}

            {/* ── Main content area ──────────────────────────── */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a0f1a] to-slate-950" />

                {/* Subtle animated radials */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

                {/* Dot pattern */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, hsl(210 15% 60%) 0.5px, transparent 0.5px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                {/* Scrollable content */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 md:py-12 overflow-y-auto scrollbar-thin">
                    {/* Branding */}
                    <div className="mb-8 text-center animate-fade-in">
                        <Link href="/" className="inline-block group">
                            <div className="relative mx-auto w-16 h-16 sm:w-18 sm:h-18 mb-4">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/15 border border-primary/25 shadow-glow-teal group-hover:shadow-lg group-hover:scale-105 transition-all duration-300" />
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <LogoIcon size={36} />
                                </div>
                                {/* Active indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg ring-2 ring-slate-950">
                                    <Lock className="w-2.5 h-2.5 text-white" />
                                </div>
                            </div>
                        </Link>

                        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            {title}
                        </h1>
                        <p className="mt-1.5 text-sm text-slate-400">
                            {subtitle}
                        </p>
                    </div>

                    {/* Glass card */}
                    <div className="w-full max-w-md animate-slide-up">
                        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
                            {/* Top accent bar */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                            <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
                                {children}
                            </div>
                        </div>
                    </div>

                    {/* Security badges + version */}
                    <div className="mt-6 flex items-center justify-center gap-3 flex-wrap animate-fade-in">
                        <div className="flex items-center gap-1.5 text-emerald-400/80 text-[11px] bg-emerald-500/8 border border-emerald-500/10 px-3 py-1.5 rounded-full">
                            <Lock size={11} />
                            <span className="font-medium">TLS 1.3</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary/80 text-[11px] bg-primary/8 border border-primary/10 px-3 py-1.5 rounded-full">
                            <Fingerprint size={11} />
                            <span className="font-medium">HIPAA</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-400/80 text-[11px] bg-blue-500/8 border border-blue-500/10 px-3 py-1.5 rounded-full">
                            <Wifi size={11} />
                            <span className="font-medium">AES-256</span>
                        </div>
                    </div>

                    <p className="mt-4 text-[10px] text-slate-600 font-mono">
                        PulseLogic v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
