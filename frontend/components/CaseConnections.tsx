'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ErrorBanner from '@/components/ui/ErrorBanner';

export default function CaseConnections({ record }: { record: any }) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [partner, setPartner] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [conversation, setConversation] = useState('');
    const load = useCallback(
        () =>
            Promise.all([
                api.get(`/documents?caseId=${record.id}`),
                api.get('/chat/partners'),
            ])
                .then(([d, p]) => {
                    setDocuments(d.data);
                    setPartners(
                        p.data.filter(
                            (person: any) =>
                                person.clearanceLevel >=
                                record.clearanceRequired,
                        ),
                    );
                })
                .catch(() =>
                    setError(
                        'Unable to load linked documents or consultation partners.',
                    ),
                ),
        [record.id, record.clearanceRequired],
    );
    useEffect(() => {
        load();
    }, [load]);
    return (
        <section className="card p-5 space-y-4">
            <h2 className="font-semibold">Documents & Consultation</h2>
            {error && <ErrorBanner message={error} />}
            {record.patientId && (
                <Link
                    className="text-primary text-sm block"
                    href={`/dashboard/patients/detail?id=${record.patientId}`}
                >
                    Open linked patient
                </Link>
            )}
            <ul className="space-y-2">
                {documents.map((doc) => (
                    <li key={doc.id}>
                        <Link
                            className="text-primary text-sm"
                            href={`/dashboard/documents?caseId=${record.id}&documentId=${doc.id}`}
                        >
                            {doc.originalFileName}
                        </Link>
                    </li>
                ))}
            </ul>
            {!documents.length && (
                <p className="text-sm text-muted-foreground">
                    No documents linked.
                </p>
            )}
            <form
                className="flex flex-col sm:flex-row gap-3"
                onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem(
                        'file',
                    ) as HTMLInputElement;
                    const file = input.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    setError('');
                    try {
                        const data = new FormData();
                        data.append('file', file);
                        data.append('caseId', record.id);
                        if (record.patientId)
                            data.append('patientId', record.patientId);
                        data.append(
                            'documentType',
                            (
                                form.elements.namedItem(
                                    'documentType',
                                ) as HTMLSelectElement
                            ).value,
                        );
                        data.append('analyzeAfterUpload', 'false');
                        await api.post('/documents/upload', data, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        form.reset();
                        await load();
                    } catch (err: any) {
                        setError(
                            err.response?.data?.message || 'Upload failed.',
                        );
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                <input
                    aria-label="Case document"
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf,.dcm"
                    required
                    className="form-input"
                />
                <select
                    name="documentType"
                    aria-label="Document category"
                    className="form-input"
                >
                    <option value="blood_report">Blood report</option>
                    <option value="ecg">ECG</option>
                    <option value="xray">X-ray</option>
                    <option value="mri">MRI</option>
                    <option value="ct_scan">CT scan</option>
                    <option value="ultrasound_echo">Ultrasound / echo</option>
                </select>
                <button
                    className="btn-secondary whitespace-nowrap"
                    disabled={busy}
                >
                    Upload document
                </button>
            </form>
            <div className="border-t border-border pt-4 space-y-3">
                <label className="block text-sm">
                    Consult a colleague
                    <select
                        className="form-input mt-1"
                        value={partner}
                        onChange={(e) => setPartner(e.target.value)}
                    >
                        <option value="">Select eligible colleague</option>
                        {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.fullName || p.username}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    className="btn-secondary"
                    disabled={!partner || busy}
                    onClick={async () => {
                        setBusy(true);
                        setError('');
                        try {
                            const response = await api.post(
                                '/chat/conversations',
                                {
                                    type: 'user_to_user',
                                    recipientId: partner,
                                    caseId: record.id,
                                    title: `Case ${record.patientCode}`,
                                },
                            );
                            setConversation(response.data.id);
                        } catch (err: any) {
                            setError(
                                err.response?.data?.message ||
                                    'Consultation could not be opened.',
                            );
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    Open case consultation
                </button>
                {conversation && (
                    <Link
                        className="text-primary text-sm block"
                        href={`/dashboard/chat?conversationId=${conversation}`}
                    >
                        Continue consultation in chat →
                    </Link>
                )}
            </div>
        </section>
    );
}
