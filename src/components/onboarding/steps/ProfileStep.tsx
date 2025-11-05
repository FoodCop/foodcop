import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { OnboardingService } from '../../../services/onboardingService';
import { useAuth } from '../../auth/AuthProvider';

const ProfileStep: React.FC = () => {
  const { setCurrentStep, setProfile } = useOnboarding();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    if (!user?.id) {
      setError('User session expired. Please refresh the page.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      
      await OnboardingService.saveProfile(user.id, {
        firstName: firstName.trim(),
        avatarUrl,
      });

      setProfile({
        firstName: firstName.trim(),
        avatarUrl,
      });

      setCurrentStep(4);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Tell us about yourself</h2>
          <p className="text-gray-600">What should we call you?</p>
        </div>

        {/* Avatar Display */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fuzo-primary to-fuzo-secondary flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {firstName.trim() ? firstName.trim()[0].toUpperCase() : '?'}
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuzo-primary focus:border-transparent text-lg"
            maxLength={50}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleContinue();
              }
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={isSaving || !firstName.trim()}
          className="w-full text-white font-semibold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          style={{ backgroundColor: (isSaving || !firstName.trim()) ? '#999' : '#ff6900' }}
          onMouseEnter={(e) => (isSaving || !firstName.trim()) ? null : e.currentTarget.style.backgroundColor = '#e05e00'}
          onMouseLeave={(e) => (isSaving || !firstName.trim()) ? null : e.currentTarget.style.backgroundColor = '#ff6900'}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">2 more steps to go!</p>
      </div>
    </div>
  );
};

export default ProfileStep;
