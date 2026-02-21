'use client';

import { useState } from 'react';
import { X, Truck, AlertTriangle } from 'lucide-react';

const EmergencyButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-64 glass-card rounded-2xl shadow-2xl p-6 border-red-200 dark:border-red-900/30 animate-scale-in">
                    <h4 className="text-red-600 dark:text-red-400 font-bold mb-3 flex items-center gap-2 text-sm">
                        <AlertTriangle size={14} />
                        Identify Emergency
                    </h4>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex gap-2">
                            <span className="text-red-500 font-bold">•</span>
                            Sudden, crushing chest pain
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500 font-bold">•</span>
                            Shortness of breath at rest
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500 font-bold">•</span>
                            Facial drooping or slurred speech
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500 font-bold">•</span>
                            Loss of consciousness
                        </li>
                    </ul>
                    <a
                        href="tel:911"
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Truck size={16} />
                        Call Emergency (911/112)
                    </a>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close emergency menu' : 'Open emergency menu'}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
                    isOpen
                        ? 'bg-slate-800 dark:bg-slate-700 rotate-45'
                        : 'bg-red-600 hover:bg-red-700 animate-pulse-soft'
                }`}
            >
                {isOpen ? (
                    <X className="text-white" size={22} />
                ) : (
                    <Truck className="text-white" size={22} />
                )}
            </button>
        </div>
    );
};

export default EmergencyButton;
