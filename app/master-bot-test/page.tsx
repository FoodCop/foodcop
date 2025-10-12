import { Suspense } from 'react';
import MasterBotIntegrationTest from '@/components/chat/modern/integration/MasterBotIntegrationTest';

export default function MasterBotTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MasterBotIntegrationTest />
    </Suspense>
  );
}

export const metadata = {
  title: 'Master Bot Integration Test - FUZO Chat',
  description: 'Test the AI Master Bot chat functionality'
};