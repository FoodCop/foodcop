'use client';

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProfileFormData } from '../ProfileEditModal';

interface BasicInfoTabProps {
  formData: ProfileFormData;
  errors: Record<string, string>;
  isCheckingUsername: boolean;
  usernameAvailable: boolean | null;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
  onCheckUsername: (username: string) => void;
}

export function BasicInfoTab({
  formData,
  errors,
  isCheckingUsername,
  usernameAvailable,
  onUpdate,
  onCheckUsername
}: BasicInfoTabProps) {
  const { user } = useAuth();
  
  const handleUsernameChange = useCallback((value: string) => {
    onUpdate({ username: value });
    
    // Debounce username checking
    const timeoutId = setTimeout(() => {
      onCheckUsername(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [onUpdate, onCheckUsername]);

  const handleImageUpload = (type: 'avatar' | 'cover') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (type === 'avatar') {
        onUpdate({ avatar_url: imageUrl });
      } else {
        onUpdate({ cover_photo_url: imageUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (type: 'avatar' | 'cover') => () => {
    if (type === 'avatar') {
      onUpdate({ avatar_url: '' });
    } else {
      onUpdate({ cover_photo_url: '' });
    }
  };

  const getUsernameStatus = () => {
    if (isCheckingUsername) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    if (usernameAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (usernameAvailable === false) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        {/* Profile Picture */}
        <div className="mb-8">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Profile Picture</Label>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formData.avatar_url} alt="Profile picture" />
              <AvatarFallback className="text-lg">
                {formData.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                
                {formData.avatar_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageRemove('avatar')}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Supported: JPG, PNG (max 5MB)
              </p>
            </div>
            
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload('avatar')}
            />
          </div>
        </div>

        {/* Cover Photo */}
        <div className="mb-8">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Cover Photo</Label>
          <div className="space-y-4">
            {formData.cover_photo_url ? (
              <div className="relative">
                <div 
                  className="w-full h-32 bg-cover bg-center rounded-lg border-2 border-dashed border-gray-300"
                  style={{ backgroundImage: `url(${formData.cover_photo_url})` }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleImageRemove('cover')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload cover photo</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {formData.cover_photo_url ? 'Change Cover' : 'Upload Cover'}
              </Button>
              
              {formData.cover_photo_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageRemove('cover')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Cover
                </Button>
              )}
            </div>
            
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload('cover')}
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-6">
          <Label htmlFor="display_name" className="text-sm font-medium text-gray-700">
            Display Name *
          </Label>
          <Input
            id="display_name"
            type="text"
            value={formData.display_name}
            onChange={(e) => onUpdate({ display_name: e.target.value })}
            placeholder="Enter your display name"
            className={`mt-1 ${errors.display_name ? 'border-red-500' : ''}`}
            maxLength={100}
          />
          {errors.display_name && (
            <p className="text-sm text-red-600 mt-1">{errors.display_name}</p>
          )}
        </div>

        {/* Username */}
        <div className="mb-6">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username *
          </Label>
          <div className="mt-1 relative">
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter your username"
              className={`pr-10 ${errors.username ? 'border-red-500' : ''}`}
              maxLength={50}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {getUsernameStatus()}
            </div>
          </div>
          {errors.username && (
            <p className="text-sm text-red-600 mt-1">{errors.username}</p>
          )}
          {usernameAvailable === true && !errors.username && (
            <p className="text-sm text-green-600 mt-1">Username is available</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Username can only contain letters, numbers, and underscores
          </p>
        </div>

        {/* Email (Read-only) */}
        <div className="mb-6">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email (Cannot be changed)
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email || "Loading..."}
            disabled
            className="mt-1 bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            To change your email, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}