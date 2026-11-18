'use client';

import { useCallback, useEffect, useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { UserRole, useAuthStore } from '@/lib/store/auth';
import PageHeader from '@/components/ui/PageHeader';
import ErrorBanner from '@/components/ui/ErrorBanner';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import ReportDetail from '@/components/ReportDetail';

const tabs = [
    'Overview',
    'Symptoms',
    'Diagnoses',
    'Reports',
    'Documents',
    'Cases',
] as const;
function PatientDetailContents() {
    const query = useSearchParams();
    const id = query?.get('id') || '';
    const requestRef = useRef(0);
    const [patient, setPatient] = useState<any>(null);
    const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
    const [records, setRecords] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('moderate');
    const [duration, setDuration] = useState('');
    const [saved, setSaved] = useState('');
    const [reportId, setReportId] = useState('');
    useEffect(() => { if (!id) { setError('Select a patient from the patient list.'); setLoading(false); } }, [id]);
    const load = useCallback(async () => {
        if (!id) return;
        const requestId = ++requestRef.current;
        setLoading(true);
        setError('');
        setRecords([]);
        try {
            const response = await api.get(`/patients/${id}`);
            if (requestId !== requestRef.current) return;
            setPatient(response.data);
            const path =
                tab === 'Symptoms'
                    ? `/symptoms/patient/${id}`
                    : tab === 'Diagnoses'
                      ? `/diagnoses/patient/${id}`
                      : tab === 'Reports'
                        ? `/reports/patient/${id}`
                        : tab === 'Documents'
                          ? `/documents?patientId=${encodeURIComponent(id)}`
                          : tab === 'Cases'
                            ? `/medical/cases?patientId=${encodeURIComponent(id)}`
                            : null;
            if (path) { const response = await api.get(path); if (requestId === requestRef.current) setRecords(response.data); }
        } catch (err: any) {
            if (requestId !== requestRef.current) return;
            setError(
                err.response?.data?.message ||
                    err.message ||
                    'Unable to load patient records.',
            );
        } finally {
            if (requestId === requestRef.current) setLoading(false);
        }
    }, [id, tab]);
    useEffect(() => {
        load();
        return () => { requestRef.current++; };
    }, [load]);
    return (
        <div className="min-h-full">
            <PageHeader
                title={
                    patient
                        ? `${patient.firstName} ${patient.lastName}`
                        : 'Patient workspace'
                }
                subtitle="Patient records and linked clinical history"
                backHref="/dashboard/patients"
            />
            <main className="container-app py-5 space-y-5 pb-28">
                <Link
                    href="/dashboard/patients"
                    className="text-primary text-sm"
                >
                    ← All patients
                </Link>
                {error && (
                    <>
                        <ErrorBanner message={error} />
                        <button className="btn-secondary" onClick={load}>
                            Retry
                        </button>
                    </>
                )}
                <nav
                    aria-label="Patient records"
                    className="flex gap-2 overflow-x-auto pb-2"
                >
                    {tabs.map((value) => (
                        <button
                            key={value}
                            onClick={() => {
                                setTab(value);
                                setSaved('');
                            }}
                            aria-current={tab === value ? 'page' : undefined}
                            className={
                                tab === value
                                    ? 'btn-primary whitespace-nowrap'
                                    : 'btn-secondary whitespace-nowrap'
                            }
                        >
                            {value}
                        </button>
                    ))}
                </nav>
                {loading ? (
                    <p role="status">Loading patient records…</p>
                ) : (
                    patient && (
                        <>
                            {tab === 'Overview' && (
                                <section className="card p-5">
                                    <h2 className="text-lg font-semibold mb-4">
                                        Patient overview
                                    </h2>
                                    <dl className="grid sm:grid-cols-2 gap-5">
                                        {Object.entries({
                                            'Date of birth':
                                                patient.dateOfBirth?.split(
                                                    'T',
                                                )[0],
                                            Gender: patient.gender,
                                            'Blood group': patient.bloodGroup,
                                            Phone: patient.phone,
                                            Email: patient.email,
                                            Address: patient.address,
                                            'Emergency contact':
                                                patient.emergencyContact,
                                            Allergies: patient.allergies,
                                            'Medical history':
                                                patient.medicalHistory,
                                        }).map(([key, value]) => (
                                            <div key={key}>
                                                <dt className="text-sm text-muted-foreground">
                                                    {key}
                                                </dt>
                                                <dd className="whitespace-pre-wrap break-words">
                                                    {String(
                                                        value || 'Not recorded',
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                    <p className="text-xs text-muted-foreground mt-5">
                                        Patient-linked clinical records are
                                        shared across clinical roles. Linked
                                        cases and documents remain
                                        clearance-filtered.
                                    </p>
                                </section>
                            )}
                            {tab === 'Symptoms' && (
                                <form
                                    className="card p-5 space-y-4"
                                    onSubmit={async (event) => {
                                        event.preventDefault();
                                        setSaving(true);
                                        setError('');
                                        setSaved('');
                                        try {
                                            await api.post('/symptoms', {
                                                patientId: id,
                                                name,
                                                description,
                                                severity,
                                                duration,
                                            });
                                            setName('');
                                            setDescription('');
                                            setDuration('');
                                            setSaved(
                                                'Symptom recorded in patient history.',
                                            );
                                            await load();
                                        } catch (err: any) {
                                            setError(
                                                err.response?.data?.message ||
                                                    'Unable to save symptom.',
                                            );
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                >
                                    <h2 className="font-semibold">
                                        Record a symptom
                                    </h2>
                                    <FormInput
                                        label="Symptom"
                                        required
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                    />
                                    <FormTextarea
                                        label="Clinical notes"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                    />
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <label className="text-sm">
                                            Severity
                                            <select
                                                className="form-input mt-1"
                                                value={severity}
                                                onChange={(e) =>
                                                    setSeverity(e.target.value)
                                                }
                                            >
                                                {[
                                                    'mild',
                                                    'moderate',
                                                    'severe',
                                                ].map((s) => (
                                                    <option key={s}>{s}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <FormInput
                                            label="Duration"
                                            value={duration}
                                            onChange={(e) =>
                                                setDuration(e.target.value)
                                            }
                                        />
                                    </div>
                                    <button
                                        disabled={saving}
                                        className="btn-primary"
                                    >
                                        {saving ? 'Saving…' : 'Save symptom'}
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        Saving records an observation; it does
                                        not run AI or create a diagnosis.
                                    </p>
                                </form>
                            )}
                            {saved && (
                                <p role="status" className="text-primary">
                                    {saved}
                                </p>
                            )}
                            {tab !== 'Overview' && (
                                <section className="space-y-3">
                                    <h2 className="font-semibold">
                                        {tab === 'Symptoms'
                                            ? 'Symptom history'
                                            : tab}
                                    </h2>
                                    {!records.length && !error && (
                                        <p className="card p-5 text-muted-foreground">
                                            No {tab.toLowerCase()} linked to
                                            this patient. Legacy records remain
                                            available in their original lists.
                                        </p>
                                    )}
                                    {records.map((record) => (
                                        <article
                                            key={record.id}
                                            className="card p-4 space-y-2"
                                        >
                                            <h3 className="font-semibold">
                                                {record.name ||
                                                    record.diseaseName ||
                                                    record.title ||
                                                    record.originalFileName ||
                                                    record.patientCode}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    record.createdAt,
                                                ).toLocaleString()}{' '}
                                                ·{' '}
                                                {record.severity ||
                                                    record.status ||
                                                    record.documentType ||
                                                    record.type}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">
                                                {record.description ||
                                                    record.notes ||
                                                    record.findings ||
                                                    record.chiefComplaint}
                                            </p>
                                            {tab === 'Cases' && (
                                                <Link
                                                    className="text-primary text-sm"
                                                    href={`/dashboard/cases/detail?id=${record.id}`}
                                                >
                                                    Open case
                                                </Link>
                                            )}
                                            {tab === 'Reports' && (
                                                <button
                                                    className="text-primary text-sm"
                                                    onClick={() =>
                                                        setReportId(record.id)
                                                    }
                                                >
                                                    Read / print report
                                                </button>
                                            )}
                                            {tab === 'Documents' && (
                                                <Link
                                                    className="text-primary text-sm"
                                                    href={`/dashboard/documents?patientId=${id}&documentId=${record.id}`}
                                                >
                                                    Open document
                                                </Link>
                                            )}
                                        </article>
                                    ))}
                                </section>
                            )}
                        </>
                    )
                )}
            </main>
            {reportId && (
                <ReportDetail id={reportId} onClose={() => setReportId('')} />
            )}
        </div>
    );
}

export default function PatientDetail() { return <Suspense fallback={<p role="status">Loading patient…</p>}><PatientDetailContents /></Suspense>; }
