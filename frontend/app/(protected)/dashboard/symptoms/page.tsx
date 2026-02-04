'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Thermometer,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

interface SymptomAnalysis {
    analysis: string;
    suggestions: string[];
    urgency: 'low' | 'medium' | 'high';
    disclaimer: string;
}

const commonSymptoms = [
    'Fever', 'Headache', 'Fatigue', 'Cough', 'Shortness of breath',
    'Chest pain', 'Nausea', 'Dizziness', 'Muscle pain', 'Joint pain',
    'Abdominal pain', 'Back pain', 'Sore throat', 'Skin rash', 'Confusion'
];

export default function SymptomsPage() {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [vitals, setVitals] = useState({
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        oxygenSaturation: '',
    });
    const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const handleAnalyze = async () => {
        if (selectedSymptoms.length === 0) {
            setError('Please select at least one symptom');
            return;
        }

        setIsLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/analyze-symptoms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    symptoms: selectedSymptoms.join(', ') + (additionalNotes ? `. ${additionalNotes}` : ''),
                    vitals: Object.fromEntries(
                        Object.entries(vitals).filter(([_, v]) => v !== '')
                    ),
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setAnalysis(data);
        } catch (err) {
            setError('Failed to analyze symptoms. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Thermometer className="text-orange-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                            Symptom Assessment
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">DEMO MODE - Decision Support Only</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            This is AI-assisted guidance, NOT a medical diagnosis. Always consult qualified medical personnel.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Select Symptoms
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {commonSymptoms.map(symptom => (
                            <button
                                key={symptom}
                                onClick={() => toggleSymptom(symptom)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedSymptoms.includes(symptom)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                {symptom}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Vital Signs (Optional)
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Heart Rate (bpm)
                            </label>
                            <input
                                type="number"
                                value={vitals.heartRate}
                                onChange={(e) => setVitals(v => ({ ...v, heartRate: e.target.value }))}
                                placeholder="72"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Blood Pressure
                            </label>
                            <input
                                type="text"
                                value={vitals.bloodPressure}
                                onChange={(e) => setVitals(v => ({ ...v, bloodPressure: e.target.value }))}
                                placeholder="120/80"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Temperature (°F)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={vitals.temperature}
                                onChange={(e) => setVitals(v => ({ ...v, temperature: e.target.value }))}
                                placeholder="98.6"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                O2 Saturation (%)
                            </label>
                            <input
                                type="number"
                                value={vitals.oxygenSaturation}
                                onChange={(e) => setVitals(v => ({ ...v, oxygenSaturation: e.target.value }))}
                                placeholder="98"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Additional Notes
                    </h2>
                    <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="Describe any additional symptoms, onset time, or relevant history..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || selectedSymptoms.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Shield size={20} />
                            Analyze Symptoms (Encrypted)
                        </>
                    )}
                </button>

                {analysis && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                                Analysis Results
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyColor(analysis.urgency)}`}>
                                {analysis.urgency} priority
                            </span>
                        </div>

                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                {analysis.analysis}
                            </p>
                        </div>

                        {analysis.suggestions.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                                    Suggested Actions
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.suggestions.map((suggestion, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                {analysis.disclaimer}
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
