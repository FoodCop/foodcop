'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { ProfileFormData } from '../ProfileEditModal';

interface PrivacySettingsTabProps {
  formData: ProfileFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
}

export function PrivacySettingsTab({ formData, errors, onUpdate }: PrivacySettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy & Account Settings</h2>
        
        {/* Profile Visibility */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Profile Visibility
            </CardTitle>
            <CardDescription>
              Control who can view your profile and saved items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.is_private ? 'private' : 'public'}
              onValueChange={(value: string) => onUpdate({ is_private: value === 'private' })}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="public" className="font-medium cursor-pointer">
                    Public Profile
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Anyone can view your profile, saved restaurants, and activity. 
                    Your profile will appear in search results and recommendations.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="private" id="private" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="private" className="font-medium cursor-pointer">
                    Private Profile
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Only your friends can view your profile and saved items. 
                    Your profile won&apos;t appear in public search results.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-md">Account Status</CardTitle>
            <CardDescription>
              Information about your account verification and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Verified Account</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your account has been verified. This helps build trust with other users.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-md">Account Actions</CardTitle>
            <CardDescription>
              Manage your account security and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <p className="text-xs text-gray-500">
              Update your password to keep your account secure
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-md text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                // TODO: Implement account deactivation flow
                alert('Account deactivation feature coming soon');
              }}
            >
              Deactivate Account
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              This will permanently deactivate your account and remove all your data. 
              This action cannot be undone.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            🔒 <strong>Privacy:</strong> We take your privacy seriously. View our{' '}
            <button className="underline hover:no-underline">Privacy Policy</button>{' '}
            to learn more about how we protect your data.
          </p>
        </div>
      </div>
    </div>
  );
}