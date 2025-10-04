'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { ProfileFormData } from '../ProfileEditModal';

interface FoodPreferencesTabProps {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
}

const COMMON_DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Halal',
  'Kosher',
  'Sugar-Free',
];

export function FoodPreferencesTab({ formData, errors, onUpdate }: FoodPreferencesTabProps) {
  const [customRestriction, setCustomRestriction] = useState('');

  const handlePreferenceToggle = (preference: string) => {
    const currentPreferences = formData.dietary_preferences || [];
    const isSelected = currentPreferences.includes(preference);
    
    let updatedPreferences;
    if (isSelected) {
      updatedPreferences = currentPreferences.filter(p => p !== preference);
    } else {
      updatedPreferences = [...currentPreferences, preference];
    }
    
    onUpdate({ dietary_preferences: updatedPreferences });
  };

  const handleCustomRestrictionAdd = () => {
    if (!customRestriction.trim()) return;
    
    const currentPreferences = formData.dietary_preferences || [];
    if (currentPreferences.includes(customRestriction.trim())) return;
    
    const updatedPreferences = [...currentPreferences, customRestriction.trim()];
    onUpdate({ dietary_preferences: updatedPreferences });
    setCustomRestriction('');
  };

  const handleCustomRestrictionRemove = (restriction: string) => {
    const currentPreferences = formData.dietary_preferences || [];
    const updatedPreferences = currentPreferences.filter(p => p !== restriction);
    onUpdate({ dietary_preferences: updatedPreferences });
  };

  const isCommonPreference = (preference: string) => {
    return COMMON_DIETARY_PREFERENCES.includes(preference);
  };

  const getCustomPreferences = () => {
    return (formData.dietary_preferences || []).filter(p => !isCommonPreference(p));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Food Preferences</h2>
        
        {/* Dietary Restrictions */}
        <div className="mb-8">
          <Label className="text-sm font-medium text-gray-700 mb-4 block">
            Dietary Restrictions
          </Label>
          <p className="text-sm text-gray-600 mb-4">
            Select all that apply to help us show you relevant recommendations:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {COMMON_DIETARY_PREFERENCES.map((preference) => {
              const isSelected = (formData.dietary_preferences || []).includes(preference);
              
              return (
                <div key={preference} className="flex items-center space-x-2">
                  <Checkbox
                    id={`preference-${preference}`}
                    checked={isSelected}
                    onCheckedChange={() => handlePreferenceToggle(preference)}
                  />
                  <Label 
                    htmlFor={`preference-${preference}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {preference}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Dietary Restrictions */}
        <div className="mb-8">
          <Label className="text-sm font-medium text-gray-700 mb-4 block">
            Custom Dietary Restriction
          </Label>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              value={customRestriction}
              onChange={(e) => setCustomRestriction(e.target.value)}
              placeholder="Enter custom restriction..."
              className="flex-1"
              maxLength={50}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomRestrictionAdd();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleCustomRestrictionAdd}
              disabled={!customRestriction.trim()}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Current Restrictions Display */}
        {formData.dietary_preferences && formData.dietary_preferences.length > 0 && (
          <div className="mb-8">
            <Label className="text-sm font-medium text-gray-700 mb-4 block">
              Current Dietary Restrictions
            </Label>
            <div className="flex flex-wrap gap-2">
              {formData.dietary_preferences.map((preference) => (
                <Badge
                  key={preference}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {preference}
                  <button
                    type="button"
                    onClick={() => handleCustomRestrictionRemove(preference)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${preference}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Custom Preferences List */}
        {getCustomPreferences().length > 0 && (
          <div className="border-t pt-6">
            <Label className="text-sm font-medium text-gray-700 mb-4 block">
              Custom Restrictions
            </Label>
            <div className="space-y-2">
              {getCustomPreferences().map((preference) => (
                <div
                  key={preference}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm">{preference}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCustomRestrictionRemove(preference)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Adding dietary preferences helps us show you restaurants and recipes that match your needs. You can always update these later.
          </p>
        </div>
      </div>
    </div>
  );
}