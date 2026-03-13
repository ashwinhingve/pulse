'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import {
    Shield, ArrowRight, Users, Activity, FileText,
    Bot, ChevronRight, Heart, Lock, Stethoscope,
    BarChart3, Zap, CheckCircle,
} from 'lucide-react';
import Logo, { LogoIcon } from '@/components/ui/Logo';

/* ── Animated counter ──────────────────────── */

function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(end / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <>{count.toLocaleString()}{suffix}</>;
}

/* ── Floating shapes ───────────────────────── */

function FloatingShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-medical-teal-200/20 dark:bg-medical-teal-500/5 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-medical-blue-200/15 dark:bg-medical-blue-500/5 rounded-full blur-3xl animate-float-delayed" />
            <div className="absolute bottom-0 right-1/3 w-[350px] h-[350px] bg-medical-purple-200/10 dark:bg-medical-purple-500/5 rounded-full blur-3xl animate-blob" />
            <div className="absolute top-1/4 left-1/2 w-[200px] h-[200px] bg-medical-cyan-200/15 dark:bg-medical-cyan-500/5 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
        </div>
    );
}

/* ── Feature cards ─────────────────────────── */

const features = [
    { icon: Users, title: 'Patient Management', desc: 'Comprehensive patient records, histories, and real-time monitoring with military-grade encryption.', color: 'from-medical-teal-400 to-medical-teal-600' },
    { icon: Bot, title: 'AI Clinical Assistant', desc: 'BioMistral-powered diagnostics, antibiotic protocols, and evidence-based treatment recommendations.', color: 'from-medical-blue-400 to-medical-blue-600' },
    { icon: BarChart3, title: 'Analytics & Reports', desc: 'Real-time dashboards, predictive analytics, and department performance insights at a glance.', color: 'from-medical-purple-400 to-medical-purple-500' },
    { icon: Activity, title: 'ECG Analysis', desc: 'AI-powered ECG readings with instant anomaly detection and pattern recognition for rapid diagnosis.', color: 'from-medical-cyan-400 to-medical-cyan-500' },
    { icon: Stethoscope, title: 'Doctor Network', desc: 'Seamless collaboration between specialists with secure referral systems and case sharing.', color: 'from-emerald-400 to-emerald-600' },
    { icon: Lock, title: 'Military-Grade Security', desc: 'End-to-end encryption, role-based access, and full HIPAA/military compliance audit trails.', color: 'from-amber-400 to-amber-600' },
];

/* ── Page ───────────────────────────────────── */

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const } }),
};

export default function LandingPage() {
    return (
        <div
            className="min-h-screen bg-mesh-gradient relative overflow-hidden"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1.25rem)' }}
        >
            <FloatingShapes />

            {/* ── Navbar ── */}
            <nav className="relative z-20 w-full">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo size="md" />
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
                        <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Impact</a>
                        <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Security</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/auth/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors hidden sm:block">
                            Log in
                        </Link>
                        <Link href="/auth/login" className="btn-primary py-2.5 px-5 text-sm rounded-xl min-h-0">
                            Get Started <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
                    >
                        <Zap size={14} /> AI-Powered Healthcare Platform
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground font-display leading-tight tracking-tight"
                    >
                        Smarter Healthcare,{' '}
                        <span className="bg-gradient-to-r from-medical-teal-500 via-medical-blue-500 to-medical-purple-500 bg-clip-text text-transparent">
                            Better Outcomes
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        PulseLogic centralizes patient data, delivers real-time analytics, and provides
                        AI-driven clinical decision support — all secured with military-grade encryption.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href="/auth/login" className="btn-primary px-8 py-3.5 text-base rounded-2xl shadow-glow-teal">
                            Start Free Trial <ArrowRight size={18} />
                        </Link>
                        <a href="#features" className="btn-glass px-8 py-3.5 text-base rounded-2xl min-h-0">
                            Explore Features <ChevronRight size={18} />
                        </a>
                    </motion.div>
                </div>

                {/* ── Dashboard preview mockup ── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-16 max-w-4xl mx-auto"
                >
                    <div className="glass-card p-2 shadow-glass-lg">
                        <div className="rounded-xl bg-gradient-to-br from-background via-background to-muted/50 p-6 border border-border/30">
                            {/* Mock header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="flex-1 h-6 bg-muted/50 rounded-lg max-w-xs" />
                            </div>
                            {/* Mock stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                {[
                                    { label: 'Patients', val: '2,847', color: 'from-medical-teal-400/20 to-medical-teal-400/5' },
                                    { label: 'Doctors', val: '128', color: 'from-medical-blue-400/20 to-medical-blue-400/5' },
                                    { label: 'Cases', val: '1,052', color: 'from-medical-purple-400/20 to-medical-purple-400/5' },
                                    { label: 'Reports', val: '4,291', color: 'from-medical-cyan-400/20 to-medical-cyan-400/5' },
                                ].map(s => (
                                    <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-3 border border-border/20`}>
                                        <p className="text-lg font-bold text-foreground font-display">{s.val}</p>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Mock chart area */}
                            <div className="flex gap-3">
                                <div className="flex-1 h-32 bg-muted/30 rounded-xl border border-border/20 flex items-end p-3 gap-1">
                                    {[40, 65, 45, 80, 55, 90, 35, 70, 60, 85, 50, 75].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/20" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                                <div className="w-1/3 h-32 bg-muted/30 rounded-xl border border-border/20 flex items-center justify-center">
                                    <svg viewBox="0 0 80 80" className="w-20 h-20">
                                        <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                                        <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="140 188" strokeLinecap="round" transform="rotate(-90 40 40)" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Stats ── */}
            <section id="stats" className="relative z-10 py-16 border-y border-border/30">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { end: 2847, suffix: '+', label: 'Patients Managed' },
                            { end: 128, suffix: '+', label: 'Medical Officers' },
                            { end: 99, suffix: '.9%', label: 'Uptime SLA' },
                            { end: 15, suffix: 'ms', label: 'Avg Response' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                custom={i}
                                variants={fadeUp}
                                className="text-center"
                            >
                                <p className="text-3xl md:text-4xl font-extrabold text-foreground font-display">
                                    <Counter end={stat.end} suffix={stat.suffix} />
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="relative z-10 py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground font-display">
                            Everything You Need
                        </h2>
                        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                            A complete healthcare management ecosystem built for modern medical professionals.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <motion.div
                                    key={f.title}
                                    initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                                    variants={fadeUp}
                                    className="glass-card p-6 group hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon size={22} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2 font-display">{f.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Security section ── */}
            <section id="security" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-medical-teal-400 to-medical-teal-600 rounded-3xl flex items-center justify-center text-white shadow-glow-teal">
                            <Shield size={30} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground font-display mb-4">
                            Built for Trust
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
                            HIPAA-compliant, military-grade encryption, and comprehensive audit trails ensure your data
                            is protected at every layer.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'End-to-End Encryption', desc: 'AES-256 encryption for data at rest and in transit' },
                            { title: 'Role-Based Access', desc: 'Granular clearance levels from Unclassified to Top Secret' },
                            { title: 'Full Audit Trail', desc: 'Every action logged with tamper-proof timestamping' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                                variants={fadeUp}
                                className="glass-card p-5 text-left"
                            >
                                <CheckCircle size={20} className="text-primary mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative z-10 py-20">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground font-display mb-4">
                            Ready to Transform Healthcare?
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            Join leading medical institutions using PulseLogic for smarter, faster, safer patient care.
                        </p>
                        <Link href="/auth/login" className="btn-primary px-10 py-4 text-base rounded-2xl shadow-glow-teal inline-flex">
                            Get Started Now <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-border/30 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <Logo size="sm" />
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} PulseLogic. Secure Healthcare Intelligence.
                    </p>
                </div>
            </footer>
        </div>
    );
}
