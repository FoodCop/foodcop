import type { Metadata } from 'next';
import VerificationView from '@/components/business/VerificationView';

export const metadata: Metadata = { title: 'Business verification · FUZO' };

export default function BusinessVerificationPage() {
  return <VerificationView />;
}
