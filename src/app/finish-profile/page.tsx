import type { Metadata } from 'next';
import FinishProfileView from '@/components/onboarding/FinishProfileView';

export const metadata: Metadata = { title: 'Finish your profile · FUZO' };

export default function FinishProfilePage() {
  return <FinishProfileView />;
}
