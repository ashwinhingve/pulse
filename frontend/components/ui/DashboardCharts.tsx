'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ── Bar Chart — Monthly Case Volume ── */

interface MonthlyStat { month: string; cases: number }

const BAR_COLORS_LIGHT = 'hsl(172 66% 38%)';

interface CaseVolumeChartProps {
    data: MonthlyStat[];
    title?: string;
    subtitle?: string;
    className?: string;
}

function CustomTooltipBar({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card px-3 py-2 text-xs border border-border/40 shadow-glass-lg">
            <p className="font-semibold text-foreground mb-0.5">{label}</p>
            <p className="text-primary">{payload[0].value} case{payload[0].value !== 1 ? 's' : ''}</p>
        </div>
    );
}

export function CaseVolumeChart({ data, title = 'Monthly Case Volume', subtitle = 'Last 12 months', className }: CaseVolumeChartProps) {
    return (
        <div className={cn('glass-card p-3.5 sm:p-4', className)}>
            <div className="mb-2.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className="h-36 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={12} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'hsl(var(--primary)/0.05)', radius: 4 }} />
                        <Bar
                            dataKey="cases"
                            fill={BAR_COLORS_LIGHT}
                            radius={[4, 4, 0, 0]}
                            opacity={0.85}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/* ── Donut Chart — Case Completion Rate ── */

interface CompletionData {
    closed: number;
    open: number;
    inProgress: number;
    total: number;
    completionPct: number;
}

const DONUT_COLORS = [
    'hsl(172 66% 38%)',   // closed / resolved — teal
    'hsl(215 60% 52%)',   // in progress — blue
    'hsl(var(--muted-foreground)/0.35)', // open
];

function CustomTooltipDonut({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card px-3 py-2 text-xs border border-border/40 shadow-glass-lg">
            <p className="font-semibold text-foreground">{payload[0].name}</p>
            <p style={{ color: payload[0].payload.fill }}>{payload[0].value} cases</p>
        </div>
    );
}

interface CompletionChartProps {
    data: CompletionData;
    title?: string;
    subtitle?: string;
    className?: string;
}

export function CaseCompletionChart({ data, title = 'Case Completion Rate', subtitle = 'Current quarter', className }: CompletionChartProps) {
    const pieData = [
        { name: 'Resolved', value: data.closed, fill: DONUT_COLORS[0] },
        { name: 'In Progress', value: data.inProgress, fill: DONUT_COLORS[1] },
        { name: 'Open', value: Math.max(0, data.open), fill: DONUT_COLORS[2] },
    ].filter(d => d.value > 0);

    // If no data, show empty state
    if (data.total === 0) {
        const empty = [{ name: 'No data', value: 1, fill: 'hsl(var(--muted-foreground)/0.2)' }];
        return (
            <div className={cn('glass-card p-3.5 sm:p-4', className)}>
                <div className="mb-2.5">
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">{title}</h3>
                    {subtitle && <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <div className="h-36 sm:h-40 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={empty} cx="50%" cy="50%" innerRadius={38} outerRadius={56} dataKey="value" strokeWidth={0}>
                                {empty.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-lg font-bold text-foreground font-display">0%</p>
                        <p className="text-[10px] text-muted-foreground">No cases yet</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('glass-card p-3.5 sm:p-4', className)}>
            <div className="mb-2.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className="h-36 sm:h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={56}
                            dataKey="value"
                            strokeWidth={0}
                            paddingAngle={2}
                        >
                            {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltipDonut />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-extrabold text-foreground font-display leading-none">{data.completionPct}%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Resolved</p>
                </div>
            </div>
            {/* Mini legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {pieData.map(d => (
                    <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                        {d.name} ({d.value})
                    </span>
                ))}
            </div>
        </div>
    );
}
