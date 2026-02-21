'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Stethoscope, Plus, Edit2, Trash2,
    Phone, Mail, Award, Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Doctor } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Badge from '@/components/ui/Badge';

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        firstName: '', lastName: '', specialization: '', licenseNumber: '',
        department: '', phone: '', email: '', qualification: '',
        experienceYears: 0, isAvailable: true,
    });

    useEffect(() => { fetchDoctors(); }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const res = await api.get('/doctors');
            setDoctors(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            firstName: '', lastName: '', specialization: '', licenseNumber: '',
            department: '', phone: '', email: '', qualification: '',
            experienceYears: 0, isAvailable: true,
        });
        setEditingDoctor(null);
        setShowForm(false);
    };

    const handleEdit = (doctor: Doctor) => {
        setForm({
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber || '',
            department: doctor.department || '',
            phone: doctor.phone || '',
            email: doctor.email || '',
            qualification: doctor.qualification || '',
            experienceYears: doctor.experienceYears || 0,
            isAvailable: doctor.isAvailable ?? true,
        });
        setEditingDoctor(doctor);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDoctor) {
                await api.patch(`/doctors/${editingDoctor.id}`, form);
            } else {
                await api.post('/doctors', form);
            }
            resetForm();
            fetchDoctors();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save doctor');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this doctor?')) return;
        try {
            await api.delete(`/doctors/${id}`);
            fetchDoctors();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete doctor');
        }
    };

    const filtered = doctors.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        d.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="Doctors"
                subtitle={`${doctors.length} registered`}
                icon={Stethoscope}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
                actions={
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                        <Plus size={16} /> Add Doctor
                    </button>
                }
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-4 pb-8 max-w-7xl animate-fade-in">
                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    <SearchBar value={search} onChange={setSearch} placeholder="Search by name, specialization, or department..." />

                    {loading ? (
                        <LoadingSkeleton variant="card" count={6} />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={Stethoscope}
                            title="No doctors found"
                            description={search ? 'Try adjusting your search terms' : 'Add your first doctor to get started'}
                            action={!search ? (
                                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
                                    <Plus size={16} /> Add Doctor
                                </button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((doctor, i) => (
                                <motion.div
                                    key={doctor.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    className="glass-card p-5 group hover:shadow-glass-lg hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-soft">
                                                {doctor.firstName[0]}{doctor.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground text-sm">Dr. {doctor.firstName} {doctor.lastName}</h3>
                                                <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(doctor)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                                                <Edit2 size={14} className="text-muted-foreground" />
                                            </button>
                                            <button onClick={() => handleDelete(doctor.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={14} className="text-destructive" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        {doctor.department && <div className="flex items-center gap-2"><Award size={12} /> {doctor.department}</div>}
                                        {doctor.phone && <div className="flex items-center gap-2"><Phone size={12} /> {doctor.phone}</div>}
                                        {doctor.email && <div className="flex items-center gap-2"><Mail size={12} /> {doctor.email}</div>}
                                        {doctor.experienceYears > 0 && <div className="text-xs">{doctor.experienceYears} years experience</div>}
                                    </div>
                                    <div className="mt-3">
                                        <Badge variant={doctor.isAvailable ? 'success' : 'danger'} size="sm">
                                            {doctor.isAvailable ? <><Check size={10} /> Available</> : 'Unavailable'}
                                        </Badge>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Modal
                open={showForm}
                onClose={resetForm}
                title={editingDoctor ? 'Edit Doctor' : 'New Doctor'}
                subtitle="Fill in doctor information"
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={resetForm} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" form="doctor-form" className="flex-1 btn-primary">
                            {editingDoctor ? 'Update' : 'Create'} Doctor
                        </button>
                    </div>
                }
            >
                <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                        <FormInput label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                    <FormInput label="Specialization" required value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="License Number" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
                        <FormInput label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Phone" icon={Phone} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <FormInput label="Email" type="email" icon={Mail} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Qualification" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} />
                        <FormInput label="Experience (Years)" type="number" value={String(form.experienceYears)} onChange={e => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isAvailable" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} className="rounded" />
                        <label htmlFor="isAvailable" className="text-sm text-foreground">Available for consultations</label>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
