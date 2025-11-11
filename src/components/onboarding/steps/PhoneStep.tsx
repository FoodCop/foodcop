import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../../services/supabase';
import Flag from 'react-world-flags';

const PhoneStep: React.FC = () => {
  const { setCurrentStep } = useOnboarding();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [countryIso, setCountryIso] = useState('US');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const countries = [
    { code: '+1', iso: 'US', name: 'United States' },
    { code: '+91', iso: 'IN', name: 'India' },
    { code: '+44', iso: 'GB', name: 'United Kingdom' },
    { code: '+86', iso: 'CN', name: 'China' },
    { code: '+81', iso: 'JP', name: 'Japan' },
    { code: '+49', iso: 'DE', name: 'Germany' },
    { code: '+33', iso: 'FR', name: 'France' },
    { code: '+61', iso: 'AU', name: 'Australia' },
    { code: '+82', iso: 'KR', name: 'South Korea' },
    { code: '+55', iso: 'BR', name: 'Brazil' },
  ];

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

      // Move to profile step
      setCurrentStep(3);
    } catch (err) {
      console.error('Error saving phone number:', err);
      setError('Failed to save phone number. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numbers
    const cleaned = value.replaceAll(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#ff6900' }}>
      {/* Top Section with Image */}
      <div className="px-6 pt-8 pb-6 text-center">
        <img 
          src="/logo_white.png" 
          alt="FUZO" 
          className="w-16 h-16 mx-auto mb-4"
        />
      </div>

      {/* Bottom Sheet - White Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Enter your number</h3>

        {/* Phone Input */}
        <div className="mb-6">
          <label htmlFor="phone-input" className="block text-sm font-semibold mb-2" style={{ color: '#ff6900' }}>
            Mobile Number
          </label>
          <div className="flex items-center border-2 rounded-xl overflow-hidden" style={{ borderColor: '#ff6900' }}>
            {/* Country Code Selector */}
            <div className="flex items-center px-3 py-4 border-r-2 bg-white" style={{ borderRightColor: '#ff6900' }}>
              <Flag code={countryIso} className="w-8 h-6 mr-2" />
              <select
                value={countryCode}
                onChange={(e) => {
                  const selected = countries.find(c => c.code === e.target.value);
                  if (selected) {
                    setCountryCode(selected.code);
                    setCountryIso(selected.iso);
                  }
                }}
                className="bg-white text-gray-900 font-medium focus:outline-none cursor-pointer"
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number Input */}
            <input
              id="phone-input"
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
          onMouseEnter={(e) => {
            if (phoneNumber.length >= 10) {
              e.currentTarget.style.backgroundColor = '#e05e00';
            }
          }}
          onMouseLeave={(e) => {
            if (phoneNumber.length >= 10) {
              e.currentTarget.style.backgroundColor = '#ff6900';
            }
          }}
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
