'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Plus, Edit2, Trash2,
    Phone, Mail, Droplets, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Patient } from '@/types';
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

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        firstName: '', lastName: '', dateOfBirth: '', gender: 'other',
        bloodGroup: '', phone: '', email: '', address: '',
        emergencyContact: '', medicalHistory: '', allergies: '',
    });

    useEffect(() => { fetchPatients(); }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/patients');
            setPatients(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            firstName: '', lastName: '', dateOfBirth: '', gender: 'other',
            bloodGroup: '', phone: '', email: '', address: '',
            emergencyContact: '', medicalHistory: '', allergies: '',
        });
        setEditingPatient(null);
        setShowForm(false);
    };

    const handleEdit = (patient: Patient) => {
        setForm({
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
            gender: patient.gender || 'other',
            bloodGroup: patient.bloodGroup || '',
            phone: patient.phone || '',
            email: patient.email || '',
            address: patient.address || '',
            emergencyContact: patient.emergencyContact || '',
            medicalHistory: patient.medicalHistory || '',
            allergies: patient.allergies || '',
        });
        setEditingPatient(patient);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Record<string, any> = {};
            for (const [key, value] of Object.entries(form)) {
                if (typeof value === 'string' && value.trim() === '') continue;
                payload[key] = value;
            }
            if (editingPatient) {
                await api.patch(`/patients/${editingPatient.id}`, payload);
            } else {
                await api.post('/patients', payload);
            }
            resetForm();
            fetchPatients();
        } catch (err: any) {
            const msg = err.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save patient');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this patient?')) return;
        try {
            await api.delete(`/patients/${id}`);
            fetchPatients();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete patient');
        }
    };

    const filtered = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Patients"
                subtitle={`${patients.length} registered`}
                icon={Users}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
                actions={
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                        <Plus size={16} /> Add Patient
                    </button>
                }
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-8 max-w-7xl animate-fade-in">
                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Search patients by name, phone, or email..."
                    />

                    {loading ? (
                        <LoadingSkeleton variant="card" count={6} />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No patients found"
                            description={search ? 'Try adjusting your search terms' : 'Add your first patient to get started'}
                            action={!search ? (
                                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                                    <Plus size={16} /> Add Patient
                                </button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((patient, i) => (
                                <motion.div
                                    key={patient.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    className="glass-card p-5 group hover:shadow-glass-lg hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-medical-teal-400 to-medical-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-soft">
                                                {patient.firstName[0]}{patient.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground text-sm">{patient.firstName} {patient.lastName}</h3>
                                                <Badge variant="default" size="sm">{patient.gender}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(patient)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                                                <Edit2 size={14} className="text-muted-foreground" />
                                            </button>
                                            <button onClick={() => handleDelete(patient.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={14} className="text-destructive" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        {patient.phone && <div className="flex items-center gap-2"><Phone size={12} /> {patient.phone}</div>}
                                        {patient.email && <div className="flex items-center gap-2"><Mail size={12} /> {patient.email}</div>}
                                        {patient.bloodGroup && <div className="flex items-center gap-2"><Droplets size={12} /> Blood: {patient.bloodGroup}</div>}
                                    </div>
                                    {patient.allergies && (
                                        <div className="mt-3">
                                            <Badge variant="warning" size="sm">
                                                <AlertTriangle size={10} /> Allergies: {patient.allergies}
                                            </Badge>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Form */}
            <Modal
                open={showForm}
                onClose={resetForm}
                title={editingPatient ? 'Edit Patient' : 'New Patient'}
                subtitle="Fill in patient information"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={resetForm} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" form="patient-form" className="flex-1 btn-primary">
                            {editingPatient ? 'Update' : 'Create'} Patient
                        </button>
                    </div>
                }
            >
                <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                        <FormInput label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                        <FormSelect
                            label="Gender"
                            value={form.gender}
                            onChange={e => setForm({ ...form, gender: e.target.value })}
                            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormSelect
                            label="Blood Group"
                            value={form.bloodGroup}
                            onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                            placeholder="Select"
                            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }))}
                        />
                        <FormInput label="Phone" icon={Phone} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <FormInput label="Email" type="email" icon={Mail} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <FormInput label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    <FormInput label="Emergency Contact" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} />
                    <FormTextarea label="Medical History" value={form.medicalHistory} onChange={e => setForm({ ...form, medicalHistory: e.target.value })} />
                    <FormTextarea label="Allergies" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
                </form>
            </Modal>
        </div>
    );
}
