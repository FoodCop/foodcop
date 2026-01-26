import { useState } from 'react';
import { gamifiedToast } from '../components/ui/gamified-toast';
import { toastHelpers } from '../utils/toastHelpers';
import { PreferencesHintModal } from '../components/common/PreferencesHintModal';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function AllAlerts() {
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  return (
    <div className="min-h-screen bg-page-utility p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">All Alerts & Notifications</h1>

      {/* Gamified Toasts Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Gamified Toasts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button
            onClick={() => gamifiedToast({ message: 'Operation completed successfully!', type: 'success', title: 'Success' })}
            className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Success Toast
          </button>
          <button
            onClick={() => gamifiedToast({ message: 'Something went wrong. Please try again.', type: 'error', title: 'Error' })}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Error Toast
          </button>
          <button
            onClick={() => gamifiedToast({ message: 'Please review your settings before continuing.', type: 'warning', title: 'Warning' })}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Warning Toast
          </button>
          <button
            onClick={() => gamifiedToast({ message: 'New features are now available!', type: 'info', title: 'Info' })}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Info Toast
          </button>
          <button
            onClick={() => gamifiedToast({ message: 'Do you want to continue?', type: 'success', title: 'Confirm', showContinue: true, continueText: 'Continue' })}
            className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Toast with Continue
          </button>
          <button
            onClick={() => gamifiedToast({ message: 'This is a centered toast for important messages!', type: 'error', title: 'Critical Error', position: 'center' })}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Center Toast
          </button>
        </div>
      </section>

      {/* Toast Helpers Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Toast Helpers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button
            onClick={() => toastHelpers.success('Profile updated successfully!')}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            toastHelpers.success
          </button>
          <button
            onClick={() => toastHelpers.error('Failed to save changes')}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            toastHelpers.error
          </button>
          <button
            onClick={() => toastHelpers.info('Your session will expire in 5 minutes')}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            toastHelpers.info
          </button>
          <button
            onClick={() => toastHelpers.warning('Low storage space')}
            className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            toastHelpers.warning
          </button>
          <button
            onClick={() => toastHelpers.saved('Pasta Recipe')}
            className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            toastHelpers.saved
          </button>
          <button
            onClick={() => toastHelpers.saved('Pasta Recipe', true)}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            toastHelpers.saved (duplicate)
          </button>
          <button
            onClick={() => toastHelpers.comingSoon('Social sharing')}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            toastHelpers.comingSoon
          </button>
          <button
            onClick={() => toastHelpers.navigationHint('Swipe through personalized food content!', { label: 'Got it', onClick: () => {} }, 'Discover Your Feed')}
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            toastHelpers.navigationHint
          </button>
          <button
            onClick={() => toastHelpers.success('Preferences saved!')}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Preferences Saved
          </button>
        </div>
      </section>

      {/* Static Alert Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Static Alert Components</h2>
        <div className="space-y-4 max-w-2xl">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with informational content.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Destructive Alert</AlertTitle>
            <AlertDescription>
              This is a destructive alert for errors or warnings.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Modal Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Modal Dialogs</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowPreferencesModal(true)}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Preferences Hint Modal
          </button>
        </div>
      </section>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <PreferencesHintModal
          onClose={() => setShowPreferencesModal(false)}
          onPreferencesSet={() => setShowPreferencesModal(false)}
        />
      )}
    </div>
  );
}

