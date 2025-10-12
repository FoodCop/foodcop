import { Suspense } from 'react';
import SharingIntegrationTest from '@/components/chat/modern/sharing/SharingIntegrationTest';

export default function SharingTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharingIntegrationTest />
    </Suspense>
  );
}

export const metadata = {
  title: 'Cross-System Integration Test - FUZO Sharing',
  description: 'Test restaurant and recipe sharing in chat system'
};