'use client';

import PageHeader from '@/components/ui/PageHeader';
import { Shield, Info, Code, Cpu, Terminal, Server, Award, Lightbulb, ShieldAlert, Activity } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="About & Credits"
                subtitle="System Information"
                icon={Info}
            />

            <main className="flex-1 w-full flex flex-col items-center">
                <div className="container-app pt-6 pb-24 lg:pb-6 space-y-6 max-w-3xl animate-fade-in">
                    
                    {/* App Summary Card */}
                    <div className="glass-card p-6 lg:p-8 text-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-medical-teal-500 to-medical-blue-600 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-4">
                           <Shield size={40} className="text-white" />
                        </div>
                        <h3 className="font-display font-bold text-2xl text-foreground">PulseLogic</h3>
                        <p className="text-sm font-semibold text-primary">Secure Military Medical Platform</p>
                        <p className="text-sm text-foreground leading-relaxed mt-4">
                            PulseLogic is a secure, AI-powered medical platform designed for military and public health professionals. It provides real-time clinical decision support, encrypted communication, and symptom analysis. Built to streamline field diagnostics and enhance operational medical readiness, PulseLogic ensures rapid, reliable, and secure access to critical medical guidelines and AI assistance.
                        </p>
                    </div>

                    {/* Credits Section */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
                            <h2 className="text-lg font-semibold text-foreground text-center">Developed By</h2>
                        </div>
                        
                        <div className="p-4 sm:p-6 space-y-8">
                            {/* Developers Div */}
                            <div>
                                <h4 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground mb-6 border-b border-border/80 pb-2">
                                    <Code size={20} className="text-secondary" />
                                    <span>Core Developers</span>
                                </h4>
                                <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
                                    {/* Nitin */}
                                    <div className="flex flex-col relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background to-secondary/5 border-2 border-primary/40 hover:border-primary/80 shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 filter blur-[2px] scale-150 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                           <Cpu size={80} className="text-secondary" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <span className="font-bold text-foreground text-lg mb-2">Dr. Nitin Khasdeo</span>
                                            <span className="inline-flex items-center justify-center rounded-md bg-primary/15 border border-primary/30 px-3 py-1 text-sm font-bold text-primary dark:text-primary-foreground w-fit mb-4 shadow-sm">Compiler</span>
                                            <div className="mt-auto pt-4 border-t border-secondary/10">
                                                <p className="text-sm font-mono text-muted-foreground"><span className="text-secondary/60">AKA:</span> Gareeb Dacter, Presenter OP</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Ashwin */}
                                    <div className="flex flex-col relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background to-secondary/5 border-2 border-primary/40 hover:border-primary/80 shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 filter blur-[2px] scale-150 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                           <Terminal size={80} className="text-secondary" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <span className="font-bold text-foreground text-lg mb-2">Ashwin Hingwe</span>
                                            <span className="inline-flex items-center justify-center rounded-md bg-primary/15 border border-primary/30 px-3 py-1 text-sm font-bold text-primary dark:text-primary-foreground w-fit mb-4 shadow-sm">Chief Developer</span>
                                            <div className="mt-auto pt-4 border-t border-secondary/10">
                                                <p className="text-sm font-mono text-muted-foreground"><span className="text-secondary/60">AKA:</span> Implementer, Spine OP</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Anurag */}
                                    <div className="flex flex-col relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background to-secondary/5 border-2 border-primary/40 hover:border-primary/80 shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 filter blur-[2px] scale-150 -rotate-12 group-hover:scale-110 transition-transform duration-500">
                                           <Server size={80} className="text-secondary" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <span className="font-bold text-foreground text-lg mb-2">Anurag Narre</span>
                                            <span className="inline-flex items-center justify-center rounded-md bg-primary/15 border border-primary/30 px-3 py-1 text-sm font-bold text-primary dark:text-primary-foreground w-fit mb-4 shadow-sm">Host</span>
                                            <div className="mt-auto pt-4 border-t border-secondary/10">
                                                <p className="text-sm font-mono text-muted-foreground"><span className="text-secondary/60">AKA:</span> ANDroid OP, Still Missing</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Guides Div */}
                            <div className="mt-10">
                                <h4 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground mb-6 border-b border-border/80 pb-2">
                                    <Award size={20} className="text-emerald-500" />
                                    <span>Guides & Advisors</span>
                                </h4>
                                <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
                                    {/* Raghavan */}
                                    <div className="flex flex-col relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background to-emerald-500/5 border border-emerald-500/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.07] filter blur-[2px] scale-150 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                           <Lightbulb size={80} className="text-emerald-500" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <span className="font-bold text-foreground text-lg mb-1">Dr. Anil Raghavan</span>
                                            <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-fit mb-4 text-left leading-tight">Original Idea, Design & Concept, Resource Manager</span>
                                            <div className="mt-auto pt-4 border-t border-emerald-500/10">
                                                <p className="text-sm font-mono text-muted-foreground"><span className="text-emerald-500/60">AKA:</span> THINK tank, Motivator OP</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Akshay */}
                                    <div className="flex flex-col relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background to-emerald-500/5 border border-emerald-500/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.07] filter blur-[2px] scale-150 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                           <Activity size={80} className="text-emerald-500" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <span className="font-bold text-foreground text-lg mb-1">Dr. Akshay V</span>
                                            <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-fit mb-4 text-left leading-tight">Key Feature Inputs</span>
                                            <div className="mt-auto pt-4 border-t border-emerald-500/10">
                                                <p className="text-sm font-mono text-muted-foreground"><span className="text-emerald-500/60">AKA:</span> Surgeon OP</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Rohit Singh */}
                                    <div className="flex flex-col relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-background to-emerald-500/5 border border-emerald-500/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.07] filter blur-[2px] scale-150 -rotate-12 group-hover:scale-110 transition-transform duration-500">
                                           <ShieldAlert size={80} className="text-emerald-500" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <span className="font-bold text-foreground text-lg mb-1">Dr. Rohit Singh</span>
                                            <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-fit mb-4 text-left leading-tight">Key Tester, Medical Guidelines</span>
                                            <div className="mt-auto pt-4 border-t border-emerald-500/10">
                                                <p className="text-sm font-mono text-muted-foreground"><span className="text-emerald-500/60">AKA:</span> RR-OP, Supporter OP, Moderator OP</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Version */}
                    <div className="text-center pb-4">
                        <p className="text-xs text-muted-foreground font-mono">
                            PulseLogic v1.0.0 MVP
                        </p>
                    </div>

                    {/* Mobile Bottom Spacer */}
                    <div className="h-[80px] lg:hidden w-full flex-shrink-0" aria-hidden="true" />
                </div>
            </main>
        </div>
    );
}
