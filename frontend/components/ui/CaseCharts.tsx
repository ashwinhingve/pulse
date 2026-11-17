'use client';

export interface CaseAnalytics {
    months: { month: string; count: number }[];
    statuses: { status: string; count: number }[];
}
export default function CaseCharts({ data }: { data?: CaseAnalytics }) {
    if (!data)
        return (
            <div className="card p-5 text-muted-foreground">
                Case analytics unavailable.
            </div>
        );
    const maximum = Math.max(1, ...data.months.map((month) => month.count));
    const total = data.statuses.reduce((sum, status) => sum + status.count, 0);
    const resolved =
        data.statuses.find((status) => status.status === 'resolved')?.count ||
        0;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="card p-5">
                <h2 className="font-semibold">Monthly Case Volume</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Last 12 months · visible cases · UTC
                </p>
                <div
                    className="h-44 flex items-end gap-2 mt-5"
                    role="img"
                    aria-label={data.months
                        .map((m) => `${m.month}: ${m.count}`)
                        .join(', ')}
                >
                    {data.months.map((month) => (
                        <div
                            key={month.month}
                            className="flex-1 h-full flex flex-col justify-end items-center gap-1 min-w-0"
                        >
                            <span className="text-xs">{month.count}</span>
                            <div
                                className="w-full bg-primary/70 rounded-t"
                                style={{
                                    height: `${(month.count / maximum) * 100}%`,
                                    minHeight: 2,
                                }}
                            />
                            <span className="text-[9px] text-muted-foreground">
                                {month.month.slice(5)}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
            <section className="card p-5">
                <h2 className="font-semibold">Case Resolution</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    All visible cases
                </p>
                <p className="text-4xl font-bold mt-6">
                    {total ? `${Math.round((resolved / total) * 100)}%` : '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    {total
                        ? `${resolved} resolved of ${total} cases`
                        : 'No cases to summarize yet.'}
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                    {data.statuses.map((s) => (
                        <span key={s.status} className="badge text-sm">
                            {s.status.replace(/_/g, ' ')}: {s.count}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
}
