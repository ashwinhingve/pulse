'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardList, Plus, Edit2, Trash2,
    User, Stethoscope, Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Diagnosis, Patient, Doctor } from '@/types';
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

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
    preliminary: { label: 'Preliminary', variant: 'warning' },
    confirmed: { label: 'Confirmed', variant: 'success' },
    ruled_out: { label: 'Ruled Out', variant: 'danger' },
};

export default function DiagnosesPage() {
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        diseaseName: '', description: '', icdCode: '', status: 'preliminary',
        notes: '', patientId: '', doctorId: '', diagnosedAt: '',
    });

    useEffect(() => {
        fetchDiagnoses();
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchDiagnoses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/diagnoses');
            setDiagnoses(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load diagnoses');
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
        setForm({ diseaseName: '', description: '', icdCode: '', status: 'preliminary', notes: '', patientId: '', doctorId: '', diagnosedAt: '' });
        setEditingDiagnosis(null);
        setShowForm(false);
    };

    const handleEdit = (d: Diagnosis) => {
        setForm({
            diseaseName: d.diseaseName,
            description: d.description || '',
            icdCode: d.icdCode || '',
            status: d.status || 'preliminary',
            notes: d.notes || '',
            patientId: d.patientId,
            doctorId: d.doctorId,
            diagnosedAt: d.diagnosedAt?.split('T')[0] || '',
        });
        setEditingDiagnosis(d);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!payload.diagnosedAt) delete (payload as any).diagnosedAt;
            if (!payload.icdCode) delete (payload as any).icdCode;

            if (editingDiagnosis) {
                await api.patch(`/diagnoses/${editingDiagnosis.id}`, payload);
            } else {
                await api.post('/diagnoses', payload);
            }
            resetForm();
            fetchDiagnoses();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save diagnosis');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this diagnosis?')) return;
        try {
            await api.delete(`/diagnoses/${id}`);
            fetchDiagnoses();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete diagnosis');
        }
    };

    const filtered = diagnoses.filter(d =>
        d.diseaseName.toLowerCase().includes(search.toLowerCase()) ||
        d.icdCode?.toLowerCase().includes(search.toLowerCase()) ||
        d.status?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Diagnoses"
                subtitle={`${diagnoses.length} total`}
                icon={ClipboardList}
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
                actions={
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                        <Plus size={16} /> New Diagnosis
                    </button>
                }
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-8 max-w-7xl animate-fade-in">
                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    <SearchBar value={search} onChange={setSearch} placeholder="Search by disease, ICD code, or status..." />

                    {loading ? (
                        <LoadingSkeleton variant="row" count={5} />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={ClipboardList}
                            title="No diagnoses found"
                            description={search ? 'Try adjusting your search terms' : 'Create your first diagnosis record'}
                            action={!search ? (
                                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                                    <Plus size={16} /> New Diagnosis
                                </button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((diagnosis, i) => {
                                const statusInfo = STATUS_MAP[diagnosis.status] || STATUS_MAP.preliminary;
                                return (
                                    <motion.div
                                        key={diagnosis.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.3 }}
                                        className="glass-card p-5 group hover:shadow-glass-lg transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-semibold text-foreground text-sm">{diagnosis.diseaseName}</h3>
                                                    <Badge variant={statusInfo.variant} size="sm">{statusInfo.label}</Badge>
                                                    {diagnosis.icdCode && (
                                                        <Badge variant="default" size="sm" className="font-mono">{diagnosis.icdCode}</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                                    {diagnosis.patient && (
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} /> {diagnosis.patient.firstName} {diagnosis.patient.lastName}
                                                        </span>
                                                    )}
                                                    {diagnosis.doctor && (
                                                        <span className="flex items-center gap-1">
                                                            <Stethoscope size={12} /> Dr. {diagnosis.doctor.firstName} {diagnosis.doctor.lastName}
                                                        </span>
                                                    )}
                                                    {diagnosis.diagnosedAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} /> {new Date(diagnosis.diagnosedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {diagnosis.description && (
                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{diagnosis.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <button onClick={() => handleEdit(diagnosis)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                                                    <Edit2 size={14} className="text-muted-foreground" />
                                                </button>
                                                <button onClick={() => handleDelete(diagnosis.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
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
                title={editingDiagnosis ? 'Edit Diagnosis' : 'New Diagnosis'}
                subtitle="Enter diagnosis details"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={resetForm} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" form="diagnosis-form" className="flex-1 btn-primary">
                            {editingDiagnosis ? 'Update' : 'Create'} Diagnosis
                        </button>
                    </div>
                }
            >
                <form id="diagnosis-form" onSubmit={handleSubmit} className="space-y-4">
                    <FormInput label="Disease Name" required value={form.diseaseName} onChange={e => setForm({ ...form, diseaseName: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="ICD Code" value={form.icdCode} onChange={e => setForm({ ...form, icdCode: e.target.value })} placeholder="e.g. J18.9" />
                        <FormSelect
                            label="Status"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                            options={[
                                { value: 'preliminary', label: 'Preliminary' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'ruled_out', label: 'Ruled Out' },
                            ]}
                        />
                    </div>
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
                    <FormInput label="Diagnosed Date" type="date" value={form.diagnosedAt} onChange={e => setForm({ ...form, diagnosedAt: e.target.value })} />
                    <FormTextarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    <FormTextarea label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </form>
            </Modal>
        </div>
    );
}
