import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../../services/supabase';

const PhoneStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Save phone number to user profile
      if (user?.id) {
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        
        // Update user table with phone number
        const { error: updateError } = await supabase
          .from('users')
          .update({ phone_number: fullPhoneNumber })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }
      }

      // Move to location step
      setCurrentStep(2);
    } catch (err) {
      console.error('Error saving phone number:', err);
      setError('Failed to save phone number. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#ff6900' }}>
      {/* Top Section with Image */}
      <div className="px-6 pt-8 pb-6 text-center">
        <img 
          src="/logo_mobile.png" 
          alt="FUZO" 
          className="w-16 h-16 mx-auto mb-4"
        />
        <h2 className="text-white text-xl font-bold mb-2">
          One app for food, grocery, dining & more in minutes!
        </h2>
        <div className="mt-4">
          <div className="text-6xl">🍽️</div>
        </div>
      </div>

      {/* Bottom Sheet - White Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Enter your number</h3>

        {/* Phone Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#ff6900' }}>
            Mobile Number
          </label>
          <div className="flex items-center border-2 rounded-xl overflow-hidden" style={{ borderColor: '#ff6900' }}>
            {/* Country Code Selector */}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-3 py-4 border-r-2 bg-white text-gray-900 font-medium focus:outline-none"
              style={{ borderRightColor: '#ff6900' }}
            >
              <option value="+1">🇺🇸 +1</option>
              <option value="+91">🇮🇳 +91</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+86">🇨🇳 +86</option>
              <option value="+81">🇯🇵 +81</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+82">🇰🇷 +82</option>
              <option value="+55">🇧🇷 +55</option>
            </select>

            {/* Phone Number Input */}
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="6502137390"
              className="flex-1 px-4 py-4 text-lg font-medium text-gray-900 focus:outline-none"
              maxLength={15}
            />

            {/* Clear Button */}
            {phoneNumber && (
              <button
                onClick={() => setPhoneNumber('')}
                className="px-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={isSaving || phoneNumber.length < 10}
          className="w-full text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg mb-4"
          style={{ backgroundColor: phoneNumber.length >= 10 ? '#ff6900' : '#999' }}
          onMouseEnter={(e) => phoneNumber.length >= 10 ? e.currentTarget.style.backgroundColor = '#e05e00' : null}
          onMouseLeave={(e) => phoneNumber.length >= 10 ? e.currentTarget.style.backgroundColor = '#ff6900' : null}
        >
          {isSaving ? 'Saving...' : 'Continue'}
        </button>

        {/* Terms */}
        <p className="text-center text-gray-500 text-xs">
          By clicking in, I accept the{' '}
          <a href="/terms" className="underline">terms of service</a>
          {' & '}
          <a href="/privacy" className="underline">privacy policy</a>
        </p>
      </div>
    </div>
  );
};

export default PhoneStep;
