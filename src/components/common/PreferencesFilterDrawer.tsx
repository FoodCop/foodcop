import { useState, useEffect } from 'react';
import { X, Filter, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileService } from '../../services/profileService';
import { useAuth } from '../auth/AuthProvider';
import { DIETARY_OPTIONS } from '../../types/onboarding';
import type { UserProfile } from '../../types/profile';

interface PreferencesFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onPreferencesUpdated?: () => void;
}

export function PreferencesFilterDrawer({ 
  isOpen, 
  onClose, 
  userProfile,
  onPreferencesUpdated 
}: PreferencesFilterDrawerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Load current preferences when drawer opens or profile changes
  useEffect(() => {
    if (isOpen && userProfile?.dietary_preferences) {
      setSelectedDietary(userProfile.dietary_preferences);
    } else if (isOpen && !userProfile?.dietary_preferences) {
      setSelectedDietary([]);
    }
  }, [isOpen, userProfile]);

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

  // Save preferences
  const handleSavePreferences = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Normalize preferences: if "no restrictions" is selected, set empty array
      const dietaryPrefs = selectedDietary.includes('no restrictions') 
        ? [] 
        : selectedDietary;

      const result = await ProfileService.updateProfile({
        dietary_preferences: dietaryPrefs
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }

      toast.success('Preferences updated!');
      if (onPreferencesUpdated) {
        onPreferencesUpdated();
      }
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear all preferences
  const handleClearAll = () => {
    setSelectedDietary([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Filter className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Preferences</h2>
              <p className="text-sm text-gray-500">Update your dietary filters</p>
            </div>
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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Current Preferences</h3>
              {selectedDietary.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                  disabled={loading}
                >
                  Clear All
                </button>
              )}
            </div>
            {selectedDietary.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedDietary.map((pref) => (
                  <span
                    key={pref}
                    className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-medium"
                  >
                    {pref.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No preferences selected yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Explore Cuisines</h3>
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_OPTIONS.map((option) => {
                const normalized = option.toLowerCase();
                const isSelected = selectedDietary.includes(normalized);
                
                return (
                  <button
                    key={option}
                    onClick={() => toggleDietary(option)}
                    disabled={loading}
                    className={`relative py-3 px-4 rounded-2xl font-semibold text-left transition-all border ${
                      isSelected
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-white border-gray-200 text-gray-800 hover:border-orange-300'
                    } disabled:opacity-50`}
                  >
                    {option}
                    {isSelected && (
                      <Check className="absolute top-2 right-2 w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col gap-3">
          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full py-3 px-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}




