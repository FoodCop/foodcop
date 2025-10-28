import { useState } from 'react';
import type { UserData } from '../../App';
import { Button } from '../../../ui/button-simple';

interface BasicInfoStepProps {
  data: UserData;
  onNext: (data: Partial<UserData>) => void;
}

export function BasicInfoStep({ data, onNext }: BasicInfoStepProps) {
  const [name, setName] = useState(data.name || '');
  const [phone, setPhone] = useState(data.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ name, phone });
  };

  const isValid = name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
          <input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {data.email && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-600">
              {data.email}
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!isValid}
        className="w-full"
      >
        Continue
      </Button>
    </form>
  );
}
