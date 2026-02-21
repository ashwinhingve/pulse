// Server page — exports generateStaticParams for static export
// Renders the client component that handles all UI logic
import CaseDetailClient from './CaseDetailClient';

export function generateStaticParams() {
    // Empty = generate no static pages for this route
    // The page is accessed via client-side navigation in Capacitor
    return [];
}

export const dynamicParams = false;

export default function CaseDetailPage({ params }: { params: { id: string } }) {
    return <CaseDetailClient />;
}
