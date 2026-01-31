import { useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileService } from '../../services/profileService';
import { useAuth } from '../auth/AuthProvider';
import { DIETARY_OPTIONS } from '../../types/onboarding';

interface PreferencesHintModalProps {
  onClose: () => void;
  onPreferencesSet: () => void;
  initialPreferences?: string[];
  isEditMode?: boolean;
}

export function PreferencesHintModal({
  onClose,
  onPreferencesSet,
  initialPreferences = [],
  isEditMode = false
}: PreferencesHintModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(initialPreferences);

  // Update selected preferences when initialPreferences change
  useEffect(() => {
    if (initialPreferences.length > 0) {
      setSelectedDietary(initialPreferences);
    }
  }, [initialPreferences]);

  // Toggle dietary preference selection
  const toggleDietary = (option: string) => {
    setSelectedDietary(prev => {
      const normalized = option.toLowerCase();
      if (prev.includes(normalized)) {
        return prev.filter(item => item !== normalized);
      } else {
        // If selecting "No restrictions", clear all others
        if (normalized === 'no restrictions') {
          return [normalized];
        }
        // If selecting any other option, remove "No restrictions"
        return [...prev.filter(item => item !== 'no restrictions'), normalized];
      }
    });
  };

  // Save preferences and mark hint as shown
  const handleSavePreferences = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Normalize preferences: if "no restrictions" is selected, set empty array
      const dietaryPrefs = selectedDietary.includes('no restrictions')
        ? []
        : selectedDietary;

      console.log('💾 PreferencesHintModal: Saving preferences and setting hint_shown flag');

      const result = await ProfileService.updateProfile({
        dietary_preferences: dietaryPrefs,
        preferences_hint_shown: true
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }

      console.log('✅ PreferencesHintModal: Successfully saved, hint_shown = true');
      toast.success('Preferences saved!');
      onPreferencesSet();
      onClose();
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Skip - just close modal for now (will show again next time)
  const handleSkip = () => {
    console.log('PreferencesHintModal: User skipped, NOT setting hint_shown flag (will show again)');
    if (onClose) onClose();
  };

  // Don't show again - just mark hint as shown
  const handleDontShowAgain = async () => {
    if (!user) {
      onClose();
      return;
    }

    setLoading(true);

    try {
      console.log('🚫 PreferencesHintModal: User clicked "Don\'t Show Again", setting hint_shown flag');

      const result = await ProfileService.updateProfile({
        preferences_hint_shown: true
      });

      if (!result.success) {
        console.error('❌ Failed to save preference:', result.error);
      } else {
        console.log('✅ PreferencesHintModal: "Don\'t Show Again" saved, hint_shown = true');
      }

      onClose();
    } catch (error) {
      console.error('❌ Error saving preference:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Personalize Your Experience</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Set your dietary preferences to get personalized food recommendations tailored just for you.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {DIETARY_OPTIONS.map((option) => {
                const normalized = option.toLowerCase();
                const isSelected = selectedDietary.includes(normalized);

                return (
                  <button
                    key={option}
                    onClick={() => toggleDietary(option)}
                    disabled={loading}
                    className={`py-3 px-4 rounded-full font-medium transition-all ${isSelected
                        ? 'bg-[var(--button-bg-default)] text-[var(--button-text)] shadow-md hover:bg-[var(--button-bg-hover)]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {selectedDietary.length > 0 && (
              <p className="text-sm text-gray-500 mt-3">
                {selectedDietary.length} preference{selectedDietary.length === 1 ? '' : 's'} selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSavePreferences}
              disabled={loading}
              className="w-full py-3 px-4 bg-[var(--button-bg-default)] text-[var(--button-text)] font-semibold rounded-full hover:bg-[var(--button-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Preferences' : 'Save Preferences'}
            </button>

            {!isEditMode && (
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 py-3 px-4 border border-gray-300 text-[var(--button-text)] font-semibold rounded-full hover:bg-[var(--button-bg-hover)] transition-colors disabled:opacity-50"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleDontShowAgain}
                  disabled={loading}
                  className="flex-1 py-3 px-4 border border-gray-300 text-[var(--button-text)] font-semibold rounded-full hover:bg-[var(--button-bg-hover)] transition-colors disabled:opacity-50"
                >
                  Don't Show Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

