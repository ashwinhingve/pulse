// Server page — exports generateStaticParams for static export
// Renders the client component that handles all UI logic
import CaseDetailClient from './CaseDetailClient';

export function generateStaticParams() {
    // Return a placeholder so Next.js 14.1 treats this as having static params.
    // In Capacitor, all navigation is client-side — real IDs load via JS.
    // next/dist/build/index.js checks `prerenderRoutes.length` (truthy),
    // so an empty array is incorrectly treated as "missing generateStaticParams".
    return [{ id: 'index' }];
}

export default function CaseDetailPage({ params }: { params: { id: string } }) {
    return <CaseDetailClient />;
}
