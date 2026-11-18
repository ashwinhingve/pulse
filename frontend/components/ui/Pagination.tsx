'use client';
export default function Pagination({
    page,
    total,
    limit = 20,
    onChange,
}: {
    page: number;
    total: number;
    limit?: number;
    onChange: (page: number) => void;
}) {
    return (
        <nav
            aria-label="List pagination"
            className="flex flex-wrap items-center justify-between gap-3 py-4"
        >
            <span className="text-sm text-muted-foreground">
                {total} records · Page {page} of{' '}
                {Math.max(1, Math.ceil(total / limit))}
            </span>
            <div className="flex gap-2">
                <button
                    className="btn-secondary"
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                >
                    Previous
                </button>
                <button
                    className="btn-secondary"
                    disabled={page * limit >= total}
                    onClick={() => onChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </nav>
    );
}
