'use client';

import { Shield, Lock, Award, HeartPulse } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-card border-t border-border py-10 sm:py-14 transition-all duration-500">
            <div className="container-app text-center">
                <div className="flex flex-col items-center gap-7">
                    {/* Brand */}
                    <div className="flex items-center gap-2 opacity-25 dark:opacity-20 grayscale text-foreground">
                        <HeartPulse size={22} />
                        <span className="text-lg font-black tracking-tighter uppercase">PulseLogic</span>
                    </div>

                    <div className="space-y-3">
                        <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                            &copy; {new Date().getFullYear()} PulseLogic Clinical Systems. All rights reserved.
                        </p>
                        <p className="text-muted-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                            Secure Military Medical Support Platform for Coordinated Healthcare.
                        </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 opacity-50 dark:opacity-30">
                        <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-full text-foreground">
                            <Shield size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-full text-foreground">
                            <Lock size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">AES-256 Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-full text-foreground">
                            <Award size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">ISO 27001 Certified</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
