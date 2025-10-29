import { useState } from 'react';
import type { UserData } from '../App';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

// Inline BasicInfoStep component
function BasicInfoStep({ userData, onNext }: {
  userData: UserData;
  onDataChange: (data: Partial<UserData>) => void;
  onNext: (data: Partial<UserData>) => void;
}) {
  const [localData, setLocalData] = useState({ name: userData.name || '', phone: userData.phone || '' });
  
  const handleNext = () => {
    onNext(localData);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tell us about yourself</h2>
      <Input
        placeholder="Your name"
        value={localData.name}
        onChange={(e) => setLocalData({ ...localData, name: e.target.value })}
      />
      <Input
        placeholder="Phone number"
        value={localData.phone}
        onChange={(e) => setLocalData({ ...localData, phone: e.target.value })}
      />
      <Button onClick={handleNext} className="w-full">Next</Button>
    </div>
  );
}

// Inline LocationStep component  
function LocationStep({ userData, onNext }: {
  userData: UserData;
  onDataChange: (data: Partial<UserData>) => void;
  onNext: (data: Partial<UserData>) => void;
}) {
  const [address, setAddress] = useState(userData.location?.address || '');
  
  const handleNext = () => {
    onNext({ 
      location: { 
        lat: 0, 
        lng: 0, 
        address 
      } 
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Where are you located?</h2>
      <Input
        placeholder="Enter your address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <Button onClick={handleNext} className="w-full">Complete</Button>
    </div>
  );
}
// import { ChevronLeft } from 'lucide-react'; // Removed - not available

interface OnboardingFlowProps {
  userData: UserData;
  onComplete: (data: UserData) => void;
}

export function OnboardingFlow({ userData, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<UserData>({
    ...userData,
  });

  const steps = [
    {
      title: 'Basic Information',
      component: BasicInfoStep,
    },
    {
      title: 'Your Location',
      component: LocationStep,
    },
  ];

  const handleStepComplete = (data: Partial<UserData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
            )}
            <div className="flex-1">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="mb-8">{steps[currentStep].title}</h2>
        <CurrentStepComponent
          userData={formData}
          onDataChange={() => {}}
          onNext={handleStepComplete}
        />
      </div>
    </div>
  );
}
