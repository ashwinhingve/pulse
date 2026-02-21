'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText, Plus, Edit2, Trash2,
    User, Stethoscope, Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { MedicalReport, Patient, Doctor } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Badge from '@/components/ui/Badge';

const REPORT_TYPES: Record<string, { label: string; variant: 'info' | 'purple' | 'success' | 'warning' | 'default' }> = {
    lab: { label: 'Lab Report', variant: 'info' },
    imaging: { label: 'Imaging', variant: 'purple' },
    prescription: { label: 'Prescription', variant: 'success' },
    discharge: { label: 'Discharge', variant: 'warning' },
    followup: { label: 'Follow-up', variant: 'default' },
};

export default function ReportsPage() {
    const [reports, setReports] = useState<MedicalReport[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingReport, setEditingReport] = useState<MedicalReport | null>(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '', type: 'lab', findings: '', recommendations: '',
        patientId: '', doctorId: '', diagnosisId: '',
    });

    useEffect(() => {
        fetchReports();
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reports');
            setReports(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try { const res = await api.get('/patients'); setPatients(res.data); } catch {}
    };

    const fetchDoctors = async () => {
        try { const res = await api.get('/doctors'); setDoctors(res.data); } catch {}
    };

    const resetForm = () => {
        setForm({ title: '', type: 'lab', findings: '', recommendations: '', patientId: '', doctorId: '', diagnosisId: '' });
        setEditingReport(null);
        setShowForm(false);
    };

    const handleEdit = (report: MedicalReport) => {
        setForm({
            title: report.title,
            type: report.type || 'lab',
            findings: report.findings || '',
            recommendations: report.recommendations || '',
            patientId: report.patientId,
            doctorId: report.doctorId,
            diagnosisId: report.diagnosisId || '',
        });
        setEditingReport(report);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!payload.diagnosisId) delete (payload as any).diagnosisId;

            if (editingReport) {
                await api.patch(`/reports/${editingReport.id}`, payload);
            } else {
                await api.post('/reports', payload);
            }
            resetForm();
            fetchReports();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save report');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        try {
            await api.delete(`/reports/${id}`);
            fetchReports();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete report');
        }
    };

    const getTypeInfo = (type: string) => REPORT_TYPES[type] || REPORT_TYPES.lab;

    const filtered = reports.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Reports"
                subtitle={`${reports.length} total`}
                icon={FileText}
                iconBg="bg-violet-100 dark:bg-violet-900/30"
                iconColor="text-violet-600 dark:text-violet-400"
                actions={
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                        <Plus size={16} /> New Report
                    </button>
                }
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-8 max-w-7xl animate-fade-in">
                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    <SearchBar value={search} onChange={setSearch} placeholder="Search reports..." />

                    {loading ? (
                        <LoadingSkeleton variant="row" count={5} />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No reports found"
                            description={search ? 'Try adjusting your search terms' : 'Create your first medical report'}
                            action={!search ? (
                                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                                    <Plus size={16} /> New Report
                                </button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((report, i) => {
                                const typeInfo = getTypeInfo(report.type);
                                return (
                                    <motion.div
                                        key={report.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.3 }}
                                        className="glass-card p-5 group hover:shadow-glass-lg transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-foreground text-sm truncate">{report.title}</h3>
                                                    <Badge variant={typeInfo.variant} size="sm">{typeInfo.label}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                                    {report.patient && (
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} /> {report.patient.firstName} {report.patient.lastName}
                                                        </span>
                                                    )}
                                                    {report.doctor && (
                                                        <span className="flex items-center gap-1">
                                                            <Stethoscope size={12} /> Dr. {report.doctor.firstName} {report.doctor.lastName}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} /> {new Date(report.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {report.findings && (
                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{report.findings}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <button onClick={() => handleEdit(report)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                                                    <Edit2 size={14} className="text-muted-foreground" />
                                                </button>
                                                <button onClick={() => handleDelete(report.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={14} className="text-destructive" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Modal
                open={showForm}
                onClose={resetForm}
                title={editingReport ? 'Edit Report' : 'New Report'}
                subtitle="Enter report details"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={resetForm} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" form="report-form" className="flex-1 btn-primary">
                            {editingReport ? 'Update' : 'Create'} Report
                        </button>
                    </div>
                }
            >
                <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
                    <FormInput label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <FormSelect
                        label="Type"
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        options={Object.entries(REPORT_TYPES).map(([value, info]) => ({ value, label: info.label }))}
                    />
                    <FormSelect
                        label="Patient"
                        required
                        value={form.patientId}
                        onChange={e => setForm({ ...form, patientId: e.target.value })}
                        placeholder="Select patient"
                        options={patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))}
                        icon={User}
                    />
                    <FormSelect
                        label="Doctor"
                        required
                        value={form.doctorId}
                        onChange={e => setForm({ ...form, doctorId: e.target.value })}
                        placeholder="Select doctor"
                        options={doctors.map(d => ({ value: d.id, label: `Dr. ${d.firstName} ${d.lastName} - ${d.specialization}` }))}
                        icon={Stethoscope}
                    />
                    <FormTextarea label="Findings" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} />
                    <FormTextarea label="Recommendations" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} />
                </form>
            </Modal>
        </div>
    );
}
