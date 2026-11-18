'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { useAuthStore, CLEARANCE_NAMES } from '@/lib/store/auth';

export default function CaseEditor({
    record,
    onClose,
    onSaved,
}: {
    record: any;
    onClose: () => void;
    onSaved: (record: any) => void;
}) {
    const clearance = useAuthStore((s) => s.user?.clearanceLevel ?? 0);
    const [form, setForm] = useState({
        patientCode: record.patientCode,
        patientId: record.patientId || '',
        assignedTo: record.assignedTo || '',
        severity: record.severity,
        status: record.status,
        chiefComplaint: record.chiefComplaint,
        symptoms: record.symptoms,
        medicalHistory: record.medicalHistory || '',
        assessment: record.assessment || '',
        plan: record.plan || '',
        clearanceRequired: record.clearanceRequired,
    });
    const [patients, setPatients] = useState<any[]>([]);
    const [clinicians, setClinicians] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        Promise.all([api.get('/patients'), api.get('/medical/cases/assignees')])
            .then(([p, c]) => {
                setPatients(p.data);
                setClinicians(c.data);
            })
            .catch(() =>
                setError('Unable to load patient or assignment options.'),
            );
    }, []);
    const field = (key: keyof typeof form, value: string | number) =>
        setForm((p) => ({ ...p, [key]: value }));
    return (
        <Modal
            open
            onClose={() => {
                if (!busy) onClose();
            }}
            title="Edit case"
            size="xl"
            footer={
                <div className="flex gap-3">
                    <button
                        disabled={busy}
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="case-editor"
                        disabled={busy}
                        className="btn-primary"
                    >
                        {busy ? 'Saving…' : 'Save case'}
                    </button>
                </div>
            }
        >
            <form
                id="case-editor"
                className="space-y-4"
                onSubmit={async (event) => {
                    event.preventDefault();
                    setBusy(true);
                    setError('');
                    try {
                        const payload: any = {
                            ...form,
                            patientId: form.patientId || null,
                        };
                        if (form.assignedTo === (record.assignedTo || ''))
                            delete payload.assignedTo;
                        else payload.assignedTo = form.assignedTo || null;
                        const result = await api.patch(
                            `/medical/cases/${record.id}`,
                            payload,
                        );
                        onSaved(result.data);
                    } catch (err: any) {
                        const message = err.response?.data?.message;
                        setError(
                            Array.isArray(message)
                                ? message.join(', ')
                                : message || 'Case could not be saved.',
                        );
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                {error && <ErrorBanner message={error} />}
                <FormInput
                    label="Patient code"
                    required
                    value={form.patientCode}
                    onChange={(e) => field('patientCode', e.target.value)}
                />
                <label className="block text-sm">
                    Linked patient (optional)
                    <select
                        className="form-input mt-1"
                        value={form.patientId}
                        onChange={(e) => field('patientId', e.target.value)}
                    >
                        <option value="">Unlinked · retain patient code</option>
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.firstName} {p.lastName}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block text-sm">
                    Assigned clinician
                    <select
                        className="form-input mt-1"
                        value={form.assignedTo}
                        onChange={(e) => field('assignedTo', e.target.value)}
                    >
                        <option value="">Unassigned</option>
                        {record.assignedTo &&
                            !clinicians.some(
                                (c) => c.id === record.assignedTo,
                            ) && (
                                <option value={record.assignedTo}>
                                    Existing assignment (not active)
                                </option>
                            )}
                        {clinicians.filter(c => c.clearanceLevel >= form.clearanceRequired).map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.fullName || c.username}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        {
                            key: 'severity',
                            values: ['routine', 'urgent', 'critical'],
                        },
                        {
                            key: 'status',
                            values: [
                                'open',
                                'in_progress',
                                'resolved',
                                'archived',
                            ],
                        },
                    ].map(({ key, values }) => (
                        <label key={key} className="text-sm capitalize">
                            {key}
                            <select
                                className="form-input mt-1"
                                value={form[key as 'severity' | 'status']}
                                onChange={(e) =>
                                    field(
                                        key as 'severity' | 'status',
                                        e.target.value,
                                    )
                                }
                            >
                                {values.map((value) => (
                                    <option key={value} value={value}>
                                        {value.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                    <label className="text-sm">
                        Clearance
                        <select
                            className="form-input mt-1"
                            value={form.clearanceRequired}
                            onChange={(e) =>
                                field(
                                    'clearanceRequired',
                                    Number(e.target.value),
                                )
                            }
                        >
                            {Object.entries(CLEARANCE_NAMES)
                                .filter(([value]) => Number(value) <= clearance)
                                .map(([value, name]) => (
                                    <option key={value} value={value}>
                                        {name}
                                    </option>
                                ))}
                        </select>
                    </label>
                </div>
                {(
                    [
                        'chiefComplaint',
                        'symptoms',
                        'medicalHistory',
                        'assessment',
                        'plan',
                    ] as const
                ).map((key) => (
                    <FormTextarea
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1')}
                        required={
                            key === 'chiefComplaint' || key === 'symptoms'
                        }
                        value={form[key]}
                        onChange={(e) => field(key, e.target.value)}
                    />
                ))}
            </form>
        </Modal>
    );
}
