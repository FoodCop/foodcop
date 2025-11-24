import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { PreferencesHintModal } from './PreferencesHintModal';
import type { UserProfile } from '../../types/profile';

interface PreferencesChipsProps {
  userProfile: UserProfile | null;
  onPreferencesUpdated?: () => void;
  className?: string;
}

export function PreferencesChips({ userProfile, onPreferencesUpdated, className = '' }: PreferencesChipsProps) {
  const [showModal, setShowModal] = useState(false);

  const preferences = userProfile?.dietary_preferences || [];
  const hasPreferences = preferences.length > 0;

  const formatPreferenceLabel = (pref: string): string => {
    // Capitalize first letter of each word
    return pref
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handlePreferencesUpdated = () => {
    setShowModal(false);
    if (onPreferencesUpdated) {
      onPreferencesUpdated();
    }
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {hasPreferences ? (
          <>
            {preferences.map((pref) => (
              <span
                key={pref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
              >
                {formatPreferenceLabel(pref)}
              </span>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              title="Edit preferences"
            >
              <Settings className="w-3.5 h-3.5" />
              Edit
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            title="Set preferences"
          >
            <Settings className="w-3.5 h-3.5" />
            No preferences set
          </button>
        )}
      </div>

      {showModal && (
        <PreferencesHintModal
          onClose={() => setShowModal(false)}
          onPreferencesSet={handlePreferencesUpdated}
        />
      )}
    </>
  );
}

