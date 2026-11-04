import type { Metadata } from 'next';
import AdminDashboardView from '@/components/admin/AdminDashboardView';

export const metadata: Metadata = { title: 'Admin · FUZO', robots: { index: false } };

export default function AdminPage() {
  return <AdminDashboardView />;
}
