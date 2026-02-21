import AppShell from '@/components/layouts/AppShell';

export default function DashboardShellLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}
