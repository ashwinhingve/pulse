'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import ErrorBanner from '@/components/ui/ErrorBanner';

export default function ReportDetail({
    id,
    onClose,
}: {
    id: string;
    onClose: () => void;
}) {
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let live = true;
        api.get(`/reports/${id}`)
            .then((r) => {
                if (live) setReport(r.data);
            })
            .catch(() => {
                if (live) setError('Unable to load this report.');
            });
        return () => {
            live = false;
        };
    }, [id]);
    return (
        <Modal
            open
            onClose={onClose}
            title="Report detail"
            size="xl"
            footer={
                <button
                    className="btn-primary"
                    disabled={!report}
                    onClick={() => window.print()}
                >
                    Print report
                </button>
            }
        >
            {error && <ErrorBanner message={error} />}
            {!report && !error && <p role="status">Loading report…</p>}
            {report && (
                <article className="print-report space-y-5">
                    <h1 className="text-2xl font-bold">{report.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {report.type} ·{' '}
                        {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <dl className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <dt className="text-muted-foreground">Patient</dt>
                            <dd>
                                {report.patient
                                    ? `${report.patient.firstName} ${report.patient.lastName}`
                                    : report.patientId}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Doctor</dt>
                            <dd>
                                {report.doctor
                                    ? `${report.doctor.firstName} ${report.doctor.lastName}`
                                    : report.doctorId}
                            </dd>
                        </div>
                    </dl>
                    <section>
                        <h2 className="font-semibold">Findings</h2>
                        <p className="whitespace-pre-wrap mt-2">
                            {report.findings || 'No findings recorded.'}
                        </p>
                    </section>
                    <section>
                        <h2 className="font-semibold">Recommendations</h2>
                        <p className="whitespace-pre-wrap mt-2">
                            {report.recommendations ||
                                'No recommendations recorded.'}
                        </p>
                    </section>
                </article>
            )}
        </Modal>
    );
}
