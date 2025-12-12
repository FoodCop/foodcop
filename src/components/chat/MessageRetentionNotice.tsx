import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

/**
 * MessageRetentionNotice Component
 * Displays a notice informing users that messages are automatically deleted after 7 days
 */
export function MessageRetentionNotice() {
  return (
    <Alert className="m-4 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm text-blue-800">
        <strong>Message Retention:</strong> Messages are automatically deleted after 7 days to protect your privacy.
      </AlertDescription>
    </Alert>
  );
}

export default MessageRetentionNotice;

