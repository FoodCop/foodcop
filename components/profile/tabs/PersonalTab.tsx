'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileFormData } from '../ProfileEditModal';

interface PersonalTabProps {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
}

export function PersonalTab({ formData, errors, onUpdate }: PersonalTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
        
        {/* First Name */}
        <div className="mb-6">
          <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
            First Name
          </Label>
          <Input
            id="first_name"
            type="text"
            value={formData.first_name}
            onChange={(e) => onUpdate({ first_name: e.target.value })}
            placeholder="Enter your first name"
            className={`mt-1 ${errors.first_name ? 'border-red-500' : ''}`}
            maxLength={50}
          />
          {errors.first_name && (
            <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="mb-6">
          <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
            Last Name
          </Label>
          <Input
            id="last_name"
            type="text"
            value={formData.last_name}
            onChange={(e) => onUpdate({ last_name: e.target.value })}
            placeholder="Enter your last name"
            className={`mt-1 ${errors.last_name ? 'border-red-500' : ''}`}
            maxLength={50}
          />
          {errors.last_name && (
            <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="mb-8">
          <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">
            Date of Birth (Optional)
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => onUpdate({ date_of_birth: e.target.value || null })}
            className={`mt-1 ${errors.date_of_birth ? 'border-red-500' : ''}`}
            max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Must be 13+ years old
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-600 mt-1">{errors.date_of_birth}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            You must be at least 13 years old to use this service
          </p>
        </div>

        {/* Location Section */}
        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Location</h3>
          
          {/* City */}
          <div className="mb-6">
            <Label htmlFor="location_city" className="text-sm font-medium text-gray-700">
              City
            </Label>
            <Input
              id="location_city"
              type="text"
              value={formData.location_city}
              onChange={(e) => onUpdate({ location_city: e.target.value })}
              placeholder="Enter your city"
              className={`mt-1 ${errors.location_city ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.location_city && (
              <p className="text-sm text-red-600 mt-1">{errors.location_city}</p>
            )}
          </div>

          {/* State/Province */}
          <div className="mb-6">
            <Label htmlFor="location_state" className="text-sm font-medium text-gray-700">
              State/Province
            </Label>
            <Input
              id="location_state"
              type="text"
              value={formData.location_state}
              onChange={(e) => onUpdate({ location_state: e.target.value })}
              placeholder="Enter your state or province"
              className={`mt-1 ${errors.location_state ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.location_state && (
              <p className="text-sm text-red-600 mt-1">{errors.location_state}</p>
            )}
          </div>

          {/* Country */}
          <div className="mb-6">
            <Label htmlFor="location_country" className="text-sm font-medium text-gray-700">
              Country
            </Label>
            <Input
              id="location_country"
              type="text"
              value={formData.location_country}
              onChange={(e) => onUpdate({ location_country: e.target.value })}
              placeholder="Enter your country"
              className={`mt-1 ${errors.location_country ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.location_country && (
              <p className="text-sm text-red-600 mt-1">{errors.location_country}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}