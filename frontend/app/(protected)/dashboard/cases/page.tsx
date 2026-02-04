'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    FileText,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    Clock,
    User,
    ChevronRight,
    Shield,
    Loader2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

interface MedicalCase {
    id: string;
    caseNumber: string;
    severity: 'routine' | 'urgent' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    chiefComplaint: string;
    createdAt: string;
    updatedAt: string;
}

const mockCases: MedicalCase[] = [
    { id: '1', caseNumber: 'MC-2024-001', severity: 'urgent', status: 'in_progress', chiefComplaint: 'Suspected fracture, right arm', createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T14:30:00Z' },
    { id: '2', caseNumber: 'MC-2024-002', severity: 'routine', status: 'open', chiefComplaint: 'Mild dehydration, heat exposure', createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-01-15T09:00:00Z' },
    { id: '3', caseNumber: 'MC-2024-003', severity: 'critical', status: 'in_progress', chiefComplaint: 'Chest pain, shortness of breath', createdAt: '2024-01-14T16:45:00Z', updatedAt: '2024-01-15T08:00:00Z' },
    { id: '4', caseNumber: 'MC-2024-004', severity: 'routine', status: 'resolved', chiefComplaint: 'Minor laceration, left hand', createdAt: '2024-01-14T11:20:00Z', updatedAt: '2024-01-14T12:00:00Z' },
];

export default function CasesPage() {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const [cases, setCases] = useState<MedicalCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [showNewCaseModal, setShowNewCaseModal] = useState(false);

    useEffect(() => {
        // Simulate loading cases
        setTimeout(() => {
            setCases(mockCases);
            setIsLoading(false);
        }, 500);
    }, []);

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'urgent': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'text-emerald-600 dark:text-emerald-400';
            case 'in_progress': return 'text-blue-600 dark:text-blue-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                    <div className="flex items-center gap-2 flex-1">
                        <FileText className="text-blue-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                            Medical Cases
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowNewCaseModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Case</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>DEMO MODE</strong> - Displaying simulated case data. All patient information is synthetic.
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search cases..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                    </div>
                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                    >
                        <option value="all">All Severity</option>
                        <option value="critical">Critical</option>
                        <option value="urgent">Urgent</option>
                        <option value="routine">Routine</option>
                    </select>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-slate-400" size={32} />
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                        <p className="text-slate-500 dark:text-slate-400">No cases found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredCases.map(c => (
                            <button
                                key={c.id}
                                onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                                className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors text-left"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getSeverityColor(c.severity)}`}>
                                                {c.severity}
                                            </span>
                                            <span className={`text-xs font-medium ${getStatusColor(c.status)}`}>
                                                {c.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="font-medium text-slate-800 dark:text-white truncate">
                                            {c.chiefComplaint}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <FileText size={12} />
                                                {c.caseNumber}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDate(c.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-400 flex-shrink-0" size={20} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {showNewCaseModal && (
                <NewCaseModal
                    onClose={() => setShowNewCaseModal(false)}
                    onSubmit={(newCase) => {
                        setCases(prev => [newCase, ...prev]);
                        setShowNewCaseModal(false);
                    }}
                />
            )}
        </div>
    );
}

function NewCaseModal({
    onClose,
    onSubmit
}: {
    onClose: () => void;
    onSubmit: (c: MedicalCase) => void;
}) {
    const [severity, setSeverity] = useState<'routine' | 'urgent' | 'critical'>('routine');
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!chiefComplaint.trim()) return;

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const newCase: MedicalCase = {
            id: Date.now().toString(),
            caseNumber: `MC-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            severity,
            status: 'open',
            chiefComplaint,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        onSubmit(newCase);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">New Medical Case</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                        <Shield className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Patient data is encrypted and anonymized. No identifying information is stored in plain text.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Severity Level
                        </label>
                        <div className="flex gap-2">
                            {(['routine', 'urgent', 'critical'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSeverity(s)}
                                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm capitalize transition-colors ${
                                        severity === s
                                            ? s === 'critical'
                                                ? 'bg-red-600 text-white'
                                                : s === 'urgent'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Chief Complaint *
                        </label>
                        <input
                            type="text"
                            value={chiefComplaint}
                            onChange={(e) => setChiefComplaint(e.target.value)}
                            placeholder="Main reason for medical attention"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Symptoms & History
                        </label>
                        <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="Describe symptoms, onset, duration, and relevant medical history..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!chiefComplaint.trim() || isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Creating...
                            </>
                        ) : (
                            'Create Case'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
