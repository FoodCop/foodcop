import type { Metadata } from 'next';
import AdminVerificationView from '@/components/business/AdminVerificationView';

export const metadata: Metadata = { title: 'Business verification (admin) · FUZO', robots: { index: false } };

export default function AdminVerificationPage() {
  return <AdminVerificationView />;
}
