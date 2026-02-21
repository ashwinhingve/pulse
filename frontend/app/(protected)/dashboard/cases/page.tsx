'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FileText, Plus, Clock, ChevronRight, Shield, Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Badge from '@/components/ui/Badge';

interface MedicalCase {
    id: string;
    caseNumber: string;
    severity: 'routine' | 'urgent' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    chiefComplaint: string;
    createdAt: string;
    updatedAt: string;
}

const SEVERITY_MAP: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    critical: { variant: 'danger', label: 'Critical' },
    urgent: { variant: 'warning', label: 'Urgent' },
    routine: { variant: 'success', label: 'Routine' },
};

const STATUS_MAP: Record<string, { variant: 'success' | 'info' | 'default'; label: string }> = {
    resolved: { variant: 'success', label: 'Resolved' },
    in_progress: { variant: 'info', label: 'In Progress' },
    open: { variant: 'default', label: 'Open' },
};

export default function CasesPage() {
    const router = useRouter();
    const [cases, setCases] = useState<MedicalCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [showNewCaseModal, setShowNewCaseModal] = useState(false);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const { data } = await api.get('/medical/cases');
                setCases(Array.isArray(data) ? data : data.cases ?? []);
            } catch {
                setError('Failed to load cases. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCases();
    }, []);

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Medical Cases"
                subtitle={`${cases.length} total`}
                icon={FileText}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
                actions={
                    <button onClick={() => setShowNewCaseModal(true)} className="btn-primary text-sm">
                        <Plus size={16} /> <span className="hidden sm:inline">New Case</span>
                    </button>
                }
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-8 max-w-4xl animate-fade-in">
                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search cases..." />
                        </div>
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="form-select px-3 py-2.5 rounded-xl text-sm"
                        >
                            <option value="all">All Severity</option>
                            <option value="critical">Critical</option>
                            <option value="urgent">Urgent</option>
                            <option value="routine">Routine</option>
                        </select>
                    </div>

                    {isLoading ? (
                        <LoadingSkeleton variant="row" count={5} />
                    ) : filteredCases.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No cases found"
                            description={searchQuery ? 'Try adjusting your search terms' : 'Create a new case to get started'}
                            action={!searchQuery ? (
                                <button onClick={() => setShowNewCaseModal(true)} className="btn-primary text-sm">
                                    <Plus size={16} /> New Case
                                </button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredCases.map((c, i) => {
                                const sevInfo = SEVERITY_MAP[c.severity] || SEVERITY_MAP.routine;
                                const statInfo = STATUS_MAP[c.status] || STATUS_MAP.open;
                                return (
                                    <motion.button
                                        key={c.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.3 }}
                                        onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                                        className="w-full glass-card p-5 hover:shadow-glass-lg transition-all duration-300 text-left"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant={sevInfo.variant} size="sm">{sevInfo.label}</Badge>
                                                    <Badge variant={statInfo.variant} size="sm" dot>{statInfo.label}</Badge>
                                                </div>
                                                <p className="font-medium text-foreground truncate">{c.chiefComplaint}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <FileText size={12} /> {c.caseNumber}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {formatDate(c.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-muted-foreground flex-shrink-0" size={20} />
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </div>
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
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (c: MedicalCase) => void;
}) {
    const [severity, setSeverity] = useState<'routine' | 'urgent' | 'critical'>('routine');
    const [patientCode, setPatientCode] = useState('');
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!chiefComplaint.trim() || !patientCode.trim() || !symptoms.trim()) return;
        setIsSubmitting(true);
        setError('');

        try {
            const payload: Record<string, any> = {
                severity, patientCode, chiefComplaint, symptoms,
            };
            if (medicalHistory.trim()) payload.medicalHistory = medicalHistory;

            const { data } = await api.post('/medical/cases', payload);
            onSubmit(data);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create case. Please try again.');
            setIsSubmitting(false);
        }
    };

    const severityOptions = [
        { value: 'routine', label: 'Routine', activeClass: 'bg-emerald-600 text-white shadow-soft' },
        { value: 'urgent', label: 'Urgent', activeClass: 'bg-amber-500 text-white shadow-soft' },
        { value: 'critical', label: 'Critical', activeClass: 'bg-red-600 text-white shadow-soft' },
    ] as const;

    return (
        <Modal
            open
            onClose={onClose}
            title="New Medical Case"
            subtitle="Create a new case for AI-assisted diagnosis"
            size="lg"
            footer={
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!chiefComplaint.trim() || !patientCode.trim() || !symptoms.trim() || isSubmitting}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="animate-spin" size={18} /> Creating...</>
                        ) : (
                            'Create Case'
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-start gap-2">
                    <Shield className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        Patient data is encrypted and anonymized. No identifying information is stored in plain text.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-muted-foreground tracking-wide mb-2">Severity Level</label>
                    <div className="flex gap-2">
                        {severityOptions.map(s => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => setSeverity(s.value)}
                                className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-sm capitalize transition-all ${
                                    severity === s.value
                                        ? s.activeClass
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <FormInput
                    label="Patient Code"
                    required
                    value={patientCode}
                    onChange={(e) => setPatientCode(e.target.value)}
                    placeholder="Anonymized patient identifier (e.g. PT-0042)"
                />

                <FormInput
                    label="Chief Complaint"
                    required
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Main reason for medical attention"
                />

                <FormTextarea
                    label="Symptoms"
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms, onset, duration..."
                    rows={3}
                />

                <FormTextarea
                    label="Medical History (optional)"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Relevant medical history, allergies, current medications..."
                    rows={2}
                />

                {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
            </div>
        </Modal>
    );
}
