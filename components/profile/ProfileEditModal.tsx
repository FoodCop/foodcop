'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { PersonalTab } from './tabs/PersonalTab';
import { FoodPreferencesTab } from './tabs/FoodPreferencesTab';
import { PrivacySettingsTab } from './tabs/PrivacySettingsTab';
import { profileService } from '@/lib/services/profileService';
import { Loader2 } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export interface ProfileFormData {
  display_name: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location_city: string;
  location_state: string;
  location_country: string;
  dietary_preferences: string[];
  avatar_url: string;
  cover_photo_url: string;
  is_private: boolean;
}

export interface ProfileEditState {
  formData: ProfileFormData;
  activeTab: 'basic' | 'personal' | 'food' | 'privacy';
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  isCheckingUsername: boolean;
  usernameAvailable: boolean | null;
}

export function ProfileEditModal({ isOpen, onClose, onSave }: ProfileEditModalProps) {
  const { user } = useAuth();
  
  const [state, setState] = useState<ProfileEditState>({
    formData: {
      display_name: '',
      username: '',
      first_name: '',
      last_name: '',
      date_of_birth: null,
      location_city: '',
      location_state: '',
      location_country: '',
      dietary_preferences: [],
      avatar_url: '',
      cover_photo_url: '',
      is_private: false,
    },
    activeTab: 'basic',
    isLoading: false,
    isSaving: false,
    errors: {},
    isDirty: false,
    isCheckingUsername: false,
    usernameAvailable: null,
  });

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, errors: {} }));

    try {
      const profileData = await profileService.getProfile(user.id);
      
      setState(prev => ({
        ...prev,
        formData: {
          display_name: profileData.display_name || '',
          username: profileData.username || '',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          date_of_birth: profileData.date_of_birth || null,
          location_city: profileData.location_city || '',
          location_state: profileData.location_state || '',
          location_country: profileData.location_country || '',
          dietary_preferences: profileData.dietary_preferences || [],
          avatar_url: profileData.avatar_url || '',
          cover_photo_url: profileData.cover_photo_url || '',
          is_private: profileData.is_private || false,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // Load user profile data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user, loadProfileData]);

  const updateFormData = (updates: Partial<ProfileFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      isDirty: true,
      errors: { ...prev.errors, ...Object.keys(updates).reduce((acc, key) => ({ ...acc, [key]: '' }), {}) }
    }));
  };

  const setError = (field: string, message: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: message }
    }));
  };

  const clearError = (field: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Display name validation
    if (!state.formData.display_name.trim()) {
      errors.display_name = 'Display name is required';
    } else if (state.formData.display_name.length > 100) {
      errors.display_name = 'Display name must be 100 characters or less';
    }

    // Username validation
    if (!state.formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (state.formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (state.formData.username.length > 50) {
      errors.username = 'Username must be 50 characters or less';
    } else if (!/^[a-zA-Z0-9_]+$/.test(state.formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Name validation (if provided)
    if (state.formData.first_name && state.formData.first_name.length > 50) {
      errors.first_name = 'First name must be 50 characters or less';
    }
    if (state.formData.last_name && state.formData.last_name.length > 50) {
      errors.last_name = 'Last name must be 50 characters or less';
    }

    // Location validation (if provided)
    if (state.formData.location_city && state.formData.location_city.length > 100) {
      errors.location_city = 'City must be 100 characters or less';
    }
    if (state.formData.location_state && state.formData.location_state.length > 100) {
      errors.location_state = 'State must be 100 characters or less';
    }
    if (state.formData.location_country && state.formData.location_country.length > 100) {
      errors.location_country = 'Country must be 100 characters or less';
    }

    // Date of birth validation (if provided)
    if (state.formData.date_of_birth) {
      const birthDate = new Date(state.formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.date_of_birth = 'You must be at least 13 years old';
      }
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validateForm()) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      await profileService.updateProfile(user.id, state.formData);
      toast.success('Profile updated successfully');
      setState(prev => ({ ...prev, isDirty: false, isSaving: false }));
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleClose = () => {
    if (state.isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === state.formData.username) {
      setState(prev => ({ ...prev, usernameAvailable: null }));
      return;
    }

    setState(prev => ({ ...prev, isCheckingUsername: true }));

    try {
      const isAvailable = await profileService.checkUsernameAvailability(username);
      setState(prev => ({ ...prev, usernameAvailable: isAvailable, isCheckingUsername: false }));
      
      if (!isAvailable) {
        setError('username', 'Username is already taken');
      } else {
        clearError('username');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setState(prev => ({ ...prev, isCheckingUsername: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: Sidebar Navigation */}
          <div className="hidden md:block w-48 border-r bg-gray-50">
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { id: 'basic', label: 'Basic Info' },
                  { id: 'personal', label: 'Personal' },
                  { id: 'food', label: 'Food Preferences' },
                  { id: 'privacy', label: 'Privacy & Settings' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      state.activeTab === tab.id
                        ? 'bg-[#F14C35] text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile: Top Tab Navigation */}
          <div className="md:hidden w-full">
            <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as any }))}>
              <div className="border-b px-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                  <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
                  <TabsTrigger value="food" className="text-xs">Food</TabsTrigger>
                  <TabsTrigger value="privacy" className="text-xs">Privacy</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="basic" className="p-6 mt-0">
                  <BasicInfoTab
                    formData={state.formData}
                    errors={state.errors}
                    isCheckingUsername={state.isCheckingUsername}
                    usernameAvailable={state.usernameAvailable}
                    onUpdate={updateFormData}
                    onCheckUsername={checkUsernameAvailability}
                  />
                </TabsContent>

                <TabsContent value="personal" className="p-6 mt-0">
                  <PersonalTab
                    formData={state.formData}
                    errors={state.errors}
                    onUpdate={updateFormData}
                  />
                </TabsContent>

                <TabsContent value="food" className="p-6 mt-0">
                  <FoodPreferencesTab
                    formData={state.formData}
                    errors={state.errors}
                    onUpdate={updateFormData}
                  />
                </TabsContent>

                <TabsContent value="privacy" className="p-6 mt-0">
                  <PrivacySettingsTab
                    formData={state.formData}
                    errors={state.errors}
                    onUpdate={updateFormData}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Desktop: Content Area */}
          <div className="hidden md:flex md:flex-1 md:flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              {state.isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-[#F14C35]" />
                </div>
              ) : (
                <>
                  {state.activeTab === 'basic' && (
                    <BasicInfoTab
                      formData={state.formData}
                      errors={state.errors}
                      isCheckingUsername={state.isCheckingUsername}
                      usernameAvailable={state.usernameAvailable}
                      onUpdate={updateFormData}
                      onCheckUsername={checkUsernameAvailability}
                    />
                  )}

                  {state.activeTab === 'personal' && (
                    <PersonalTab
                      formData={state.formData}
                      errors={state.errors}
                      onUpdate={updateFormData}
                    />
                  )}

                  {state.activeTab === 'food' && (
                    <FoodPreferencesTab
                      formData={state.formData}
                      errors={state.errors}
                      onUpdate={updateFormData}
                    />
                  )}

                  {state.activeTab === 'privacy' && (
                    <PrivacySettingsTab
                      formData={state.formData}
                      errors={state.errors}
                      onUpdate={updateFormData}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Save/Cancel buttons */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={state.isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={state.isSaving || !state.isDirty}
            className="bg-[#F14C35] hover:bg-[#E63E26]"
          >
            {state.isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}