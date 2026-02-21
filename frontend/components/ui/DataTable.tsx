'use client';

import { cn } from '@/lib/utils';

interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    className?: string;
}

export default function DataTable<T extends Record<string, any>>({
    columns, data, onRowClick, emptyMessage = 'No data found', className,
}: DataTableProps<T>) {
    return (
        <div className={cn('glass-card overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50">
                            {columns.map(col => (
                                <th key={col.key} className={cn(
                                    'text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5',
                                    col.className
                                )}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-muted-foreground text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr
                                    key={i}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        'border-b border-border/30 last:border-0 transition-colors',
                                        'hover:bg-primary/5',
                                        onRowClick && 'cursor-pointer'
                                    )}
                                >
                                    {columns.map(col => (
                                        <td key={col.key} className={cn('px-5 py-3.5 text-sm text-foreground', col.className)}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
