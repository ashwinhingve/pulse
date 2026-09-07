'use client';

import { useState } from 'react';
import {
    Thermometer, AlertTriangle, CheckCircle2, Loader2,
    Shield, Brain, Heart, Bone, Eye, Ear, Wind, Droplets,
    Activity, Clock, ChevronDown, ChevronUp, Stethoscope, Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import FormTextarea from '@/components/ui/FormTextarea';
import ErrorBanner from '@/components/ui/ErrorBanner';

interface SymptomAnalysis {
    analysis: string;
    suggestions: string[];
    urgency: 'low' | 'medium' | 'high';
    disclaimer: string;
}

interface SymptomCategory {
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    symptoms: string[];
}

const symptomCategories: SymptomCategory[] = [
    {
        name: 'General', icon: <Activity size={18} />,
        color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/30',
        symptoms: ['Fever', 'Fatigue', 'Chills', 'Weight loss', 'Night sweats', 'Malaise'],
    },
    {
        name: 'Head & Neuro', icon: <Brain size={18} />,
        color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/30',
        symptoms: ['Headache', 'Dizziness', 'Confusion', 'Seizure', 'Memory loss', 'Numbness'],
    },
    {
        name: 'Cardiovascular', icon: <Heart size={18} />,
        color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30',
        symptoms: ['Chest pain', 'Palpitations', 'Swelling (legs)', 'Fainting', 'High BP'],
    },
    {
        name: 'Respiratory', icon: <Wind size={18} />,
        color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        symptoms: ['Cough', 'Shortness of breath', 'Wheezing', 'Sore throat', 'Chest tightness'],
    },
    {
        name: 'GI & Abdomen', icon: <Droplets size={18} />,
        color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        symptoms: ['Nausea', 'Vomiting', 'Abdominal pain', 'Diarrhea', 'Constipation', 'Blood in stool'],
    },
    {
        name: 'Musculoskeletal', icon: <Bone size={18} />,
        color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        symptoms: ['Back pain', 'Joint pain', 'Muscle pain', 'Stiffness', 'Weakness'],
    },
    {
        name: 'Skin & Eyes', icon: <Eye size={18} />,
        color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        symptoms: ['Skin rash', 'Itching', 'Blurred vision', 'Eye redness', 'Bruising'],
    },
    {
        name: 'ENT', icon: <Ear size={18} />,
        color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        symptoms: ['Ear pain', 'Hearing loss', 'Tinnitus', 'Nasal congestion', 'Nosebleed'],
    },
];

const durationOptions = [
    'Just started', 'Hours', '1-2 days', '3-7 days', '1-2 weeks', '2+ weeks', 'Chronic',
];

const severityLevels = [
    { label: 'Mild', value: 'mild', color: 'bg-emerald-500', desc: 'Noticeable but manageable' },
    { label: 'Moderate', value: 'moderate', color: 'bg-amber-500', desc: 'Affecting daily activity' },
    { label: 'Severe', value: 'severe', color: 'bg-red-500', desc: 'Significant distress' },
];

export default function SymptomsPage() {
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>('General');
    const [severity, setSeverity] = useState('moderate');
    const [duration, setDuration] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [vitals, setVitals] = useState({
        heartRate: '', bloodPressure: '', temperature: '', oxygenSaturation: '',
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
            const context = [
                `Symptoms: ${selectedSymptoms.join(', ')}`,
                severity && `Severity: ${severity}`,
                duration && `Duration: ${duration}`,
                additionalNotes && `Notes: ${additionalNotes}`,
            ].filter(Boolean).join('. ');

            const { data } = await api.post('/ai/analyze-symptoms', {
                symptoms: context,
                vitals: Object.fromEntries(
                    Object.entries(vitals).filter(([_, v]) => v !== '')
                ),
            });
            setAnalysis(data);
        } catch {
            setError('Failed to analyze symptoms. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedSymptoms([]);
        setSeverity('moderate');
        setDuration('');
        setAdditionalNotes('');
        setVitals({ heartRate: '', bloodPressure: '', temperature: '', oxygenSaturation: '' });
        setAnalysis(null);
        setError('');
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        }
    };

    const getUrgencyIcon = (urgency: string) => {
        switch (urgency) {
            case 'high': return <AlertTriangle size={18} />;
            case 'medium': return <Zap size={18} />;
            default: return <CheckCircle2 size={18} />;
        }
    };

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Symptom Assessment"
                subtitle="AI-Powered Clinical Decision Support"
                icon={Stethoscope}
                iconBg="bg-gradient-to-br from-orange-500 to-red-500"
                iconColor="text-white"
                actions={
                    selectedSymptoms.length > 0 ? (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                            {selectedSymptoms.length}
                        </span>
                    ) : undefined
                }
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-5 pb-24 lg:pb-8 max-w-[1600px] animate-fade-in">
                    {/* Disclaimer banner */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3.5 flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="text-amber-600 dark:text-amber-400" size={16} />
                        </div>
                        <div>
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-semibold">Decision Support Only</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                                AI-assisted guidance for clinical decision support. Not a medical diagnosis. Always consult qualified medical personnel.
                            </p>
                        </div>
                    </div>

                    {/* 12-Column Split Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left Side: Symptom Selection & Vitals (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            {/* Symptom categories — collapsible */}
                            <div className="space-y-2">
                                <h2 className="text-sm font-bold text-foreground px-1 uppercase tracking-wider text-muted-foreground">Select Symptoms by Region</h2>
                                {symptomCategories.map(cat => {
                                    const isExpanded = expandedCategory === cat.name;
                                    const activeCount = cat.symptoms.filter(s => selectedSymptoms.includes(s)).length;
                                    return (
                                        <div key={cat.name} className="glass-card overflow-hidden transition-all">
                                            <button
                                                onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                                                className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className={`w-8 h-8 ${cat.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                    <span className={cat.color}>{cat.icon}</span>
                                                </div>
                                                <span className="font-semibold text-sm text-foreground flex-1 text-left">{cat.name}</span>
                                                {activeCount > 0 && (
                                                    <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                                        {activeCount}
                                                    </span>
                                                )}
                                                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                                            </button>
                                            {isExpanded && (
                                                <div className="px-3.5 pb-3.5 flex flex-wrap gap-2 animate-fade-in">
                                                    {cat.symptoms.map(symptom => (
                                                        <button
                                                            key={symptom}
                                                            onClick={() => toggleSymptom(symptom)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                                                                selectedSymptoms.includes(symptom)
                                                                    ? 'bg-primary text-primary-foreground shadow-soft scale-[1.02]'
                                                                    : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
                                                            }`}
                                                        >
                                                            {selectedSymptoms.includes(symptom) && <CheckCircle2 size={13} className="inline mr-1 -mt-0.5" />}
                                                            {symptom}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Severity & Duration */}
                            <div className="grid sm:grid-cols-2 gap-3.5">
                                <div className="glass-card p-4">
                                    <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                        <Zap size={14} className="text-amber-500" /> Overall Severity
                                    </h3>
                                    <div className="space-y-1.5">
                                        {severityLevels.map(lvl => (
                                            <button
                                                key={lvl.value}
                                                onClick={() => setSeverity(lvl.value)}
                                                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                                                    severity === lvl.value
                                                        ? 'bg-primary/10 border border-primary'
                                                        : 'border border-transparent hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full ${lvl.color}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-foreground">{lvl.label}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{lvl.desc}</p>
                                                </div>
                                                {severity === lvl.value && <CheckCircle2 size={15} className="text-primary flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-card p-4">
                                    <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                        <Clock size={14} className="text-blue-500" /> Duration
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {durationOptions.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDuration(duration === d ? '' : d)}
                                                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                                    duration === d
                                                        ? 'bg-primary text-primary-foreground shadow-soft'
                                                        : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
                                                }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Vitals */}
                            <div className="card p-4">
                                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                    <Thermometer size={14} className="text-orange-500" /> Vital Signs
                                    <span className="text-[10px] font-normal text-muted-foreground lowercase">(optional)</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', placeholder: '72', type: 'number', icon: <Heart size={13} className="text-red-500" /> },
                                        { key: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80', type: 'text', icon: <Activity size={13} className="text-blue-500" /> },
                                        { key: 'temperature', label: 'Temperature', unit: '°F', placeholder: '98.6', type: 'number', icon: <Thermometer size={13} className="text-orange-500" /> },
                                        { key: 'oxygenSaturation', label: 'O₂ Saturation', unit: '%', placeholder: '98', type: 'number', icon: <Wind size={13} className="text-teal-500" /> },
                                    ].map(field => (
                                        <div key={field.key} className="relative">
                                            <label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-1">
                                                {field.icon} {field.label}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={field.type}
                                                    step={field.key === 'temperature' ? '0.1' : undefined}
                                                    value={vitals[field.key as keyof typeof vitals]}
                                                    onChange={(e) => setVitals(v => ({ ...v, [field.key]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-xs"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">{field.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Analysis Actions & Live Results (5 cols) */}
                        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20 self-start">
                            {/* Selected symptoms summary */}
                            <div className="glass-card p-4">
                                <div className="flex items-center justify-between mb-2.5">
                                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">Selected Symptoms ({selectedSymptoms.length})</h3>
                                    {selectedSymptoms.length > 0 && (
                                        <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                {selectedSymptoms.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                                        {selectedSymptoms.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => toggleSymptom(s)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                                            >
                                                {s} ×
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-2 italic">No symptoms selected yet. Pick symptoms from the regions on the left.</p>
                                )}
                            </div>

                            {/* Additional notes */}
                            <div className="glass-card p-4">
                                <FormTextarea
                                    label="Clinical Notes"
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    placeholder="Describe onset, triggers, alleviating factors..."
                                    rows={2}
                                />
                            </div>

                            {/* Analyze button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || selectedSymptoms.length === 0}
                                className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-soft-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Analyzing symptoms...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain size={18} />
                                        <span>Analyze Symptoms</span>
                                        {selectedSymptoms.length > 0 && (
                                            <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {selectedSymptoms.length}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>

                            {/* Error */}
                            {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                            {/* Results */}
                            {analysis && (
                                <div className="space-y-3 animate-fade-in">
                                    {/* Urgency banner */}
                                    <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${getUrgencyColor(analysis.urgency)}`}>
                                        {getUrgencyIcon(analysis.urgency)}
                                        <div className="flex-1">
                                            <p className="font-bold text-xs uppercase tracking-wide">{analysis.urgency} Priority</p>
                                            <p className="text-[11px] opacity-80 mt-0.5">
                                                {analysis.urgency === 'high' ? 'Immediate medical attention recommended' :
                                                 analysis.urgency === 'medium' ? 'Medical consultation advised' : 'Monitor and follow up as needed'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Analysis */}
                                    <div className="glass-card p-4">
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                                                <Brain size={14} className="text-white" />
                                            </div>
                                            <h2 className="text-sm font-bold text-foreground">AI Assessment</h2>
                                        </div>
                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto scrollbar-thin pr-1">{analysis.analysis}</p>
                                    </div>

                                    {/* Suggestions */}
                                    {analysis.suggestions.length > 0 && (
                                        <div className="glass-card p-4">
                                            <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                                <Stethoscope size={14} className="text-emerald-500" /> Recommended Actions
                                            </h3>
                                            <div className="space-y-1.5">
                                                {analysis.suggestions.map((suggestion, i) => (
                                                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/40 rounded-xl text-xs">
                                                        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={12} />
                                                        <span className="text-foreground">{suggestion}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Disclaimer */}
                                    <div className="bg-muted/30 rounded-2xl p-3 border border-border">
                                        <p className="text-[10px] text-muted-foreground italic leading-relaxed flex items-start gap-1.5">
                                            <Shield size={12} className="flex-shrink-0 mt-0.5" />
                                            {analysis.disclaimer}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Bottom Spacer */}
                    <div className="h-[80px] lg:hidden w-full flex-shrink-0" aria-hidden="true" />
                </div>
            </main>
        </div>
    );
}
