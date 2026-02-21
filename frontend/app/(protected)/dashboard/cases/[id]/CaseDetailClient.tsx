'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, FileText, AlertTriangle, Clock, Shield, User,
    Activity, Clipboard, Stethoscope, Brain, Loader2, Edit2, X, Check,
} from 'lucide-react';
import { api } from '@/lib/api';

interface MedicalCaseDetail {
    id: string;
    patientCode: string;
    severity: 'routine' | 'urgent' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'archived';
    chiefComplaint: string;
    symptoms: string;
    vitals?: Record<string, any>;
    medicalHistory?: string;
    assessment?: string;
    plan?: string;
    aiAssisted: boolean;
    aiSuggestions?: Record<string, any>;
    clearanceRequired: number;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
}

export default function CaseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [caseData, setCaseData] = useState<MedicalCaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const { data } = await api.get(`/medical/cases/${id}`);
                setCaseData(data);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to load case details');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCase();
    }, [id]);

    const handleClose = async () => {
        if (!confirm('Close this case? This marks it as resolved.')) return;
        setClosing(true);
        try {
            await api.post(`/medical/cases/${id}/close`);
            setCaseData(prev => prev ? { ...prev, status: 'resolved', closedAt: new Date().toISOString() } : null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to close case');
        } finally {
            setClosing(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'urgent': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
                <AlertTriangle className="text-destructive" size={48} />
                <p className="text-destructive font-medium">{error || 'Case not found'}</p>
                <button onClick={() => router.back()} className="btn-primary text-sm">
                    <ArrowLeft size={16} className="mr-1 inline" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="glass border-b border-border sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard/cases')} className="p-2 hover:bg-muted rounded-xl touch-target transition-colors">
                        <ArrowLeft size={20} className="text-foreground" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-foreground truncate">Case Detail</h1>
                        <p className="text-xs text-muted-foreground">{caseData.patientCode}</p>
                    </div>
                    {caseData.status !== 'resolved' && caseData.status !== 'archived' && (
                        <button
                            onClick={handleClose}
                            disabled={closing}
                            className="btn-primary text-sm flex items-center gap-1.5"
                        >
                            {closing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Close Case
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-4 pb-24 animate-fade-in">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getSeverityColor(caseData.severity)}`}>
                        {caseData.severity}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${getStatusColor(caseData.status)}`}>
                        {caseData.status.replace('_', ' ')}
                    </span>
                    {caseData.aiAssisted && (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center gap-1">
                            <Brain size={12} /> AI Assisted
                        </span>
                    )}
                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                        <Shield size={12} /> Clearance {caseData.clearanceRequired}
                    </span>
                </div>

                {/* Chief Complaint */}
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="font-semibold text-foreground">Chief Complaint</h2>
                    </div>
                    <p className="text-foreground">{caseData.chiefComplaint}</p>
                </div>

                {/* Symptoms */}
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                            <Activity size={16} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="font-semibold text-foreground">Symptoms</h2>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{caseData.symptoms}</p>
                </div>

                {/* Vitals */}
                {caseData.vitals && Object.keys(caseData.vitals).length > 0 && (
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                                <Stethoscope size={16} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="font-semibold text-foreground">Vitals</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(caseData.vitals).map(([key, val]) => (
                                <div key={key} className="bg-muted/50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="font-semibold text-foreground mt-0.5">{String(val)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Medical History */}
                {caseData.medicalHistory && (
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <Clipboard size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="font-semibold text-foreground">Medical History</h2>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{caseData.medicalHistory}</p>
                    </div>
                )}

                {/* Assessment */}
                {caseData.assessment && (
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
                                <FileText size={16} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <h2 className="font-semibold text-foreground">Assessment</h2>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{caseData.assessment}</p>
                    </div>
                )}

                {/* Plan */}
                {caseData.plan && (
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                                <Clipboard size={16} className="text-teal-600 dark:text-teal-400" />
                            </div>
                            <h2 className="font-semibold text-foreground">Treatment Plan</h2>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{caseData.plan}</p>
                    </div>
                )}

                {/* AI Suggestions */}
                {caseData.aiAssisted && caseData.aiSuggestions && (
                    <div className="card p-5 border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                                <Brain size={16} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="font-semibold text-foreground">AI Suggestions</h2>
                        </div>
                        <pre className="text-sm text-foreground bg-muted/50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(caseData.aiSuggestions, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Timestamps */}
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <Clock size={16} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <h2 className="font-semibold text-foreground">Timeline</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Created</span>
                            <span className="text-foreground">{formatDate(caseData.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Updated</span>
                            <span className="text-foreground">{formatDate(caseData.updatedAt)}</span>
                        </div>
                        {caseData.closedAt && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Closed</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{formatDate(caseData.closedAt)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
