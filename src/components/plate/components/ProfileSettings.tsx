import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Separator } from '../../ui/separator';
import { toast } from 'sonner';
import { config } from '../../../config/config';

interface ProfileSettingsProps {
  userId: string;
  user: any;
  onUpdate: (user: any) => void;
}

export function ProfileSettings({ userId, user, onUpdate }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    location: user?.location || '',
    website: user?.website || '',
    dietary_preferences: user?.dietary_preferences || [],
    allergies: user?.allergies || [],
    spice_tolerance: user?.spice_tolerance || 3,
    health_conscious: user?.health_conscious || false,
    location_city: user?.location_city || '',
    location_state: user?.location_state || '',
    location_country: user?.location_country || '',
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'spice_tolerance' ? parseInt(value) : 
               field === 'health_conscious' ? value === 'true' : 
               value 
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${config.supabase.url.split("//")[1].split(".")[0]}.supabase.co/functions/v1/make-server-6eeb9061/profile/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.supabase.anonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error('Error updating profile:', data.error);
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
        onUpdate(data.user);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-8 space-y-8">
      <div>
        <h3 className="mb-6 text-lg font-semibold">Profile Information</h3>
        
        <div className="space-y-5">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="username"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => handleChange('avatar_url', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h3 className="mb-6 text-lg font-semibold">Food Preferences</h3>
        
        <div className="space-y-5">
          {/* Dietary Preferences */}
          <div>
            <Label>Dietary Preferences</Label>
            <div className="mt-2 text-sm text-neutral-600">
              {formData.dietary_preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.dietary_preferences.map((pref: string) => (
                    <span 
                      key={pref}
                      className="px-3 py-1 rounded-full text-white text-xs font-medium"
                      style={{ backgroundColor: '#ff6900' }}
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-neutral-400">No dietary preferences set</span>
              )}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <Label>Allergies</Label>
            <div className="mt-2 text-sm text-neutral-600">
              {formData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy: string) => (
                    <span 
                      key={allergy}
                      className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-neutral-400">No allergies</span>
              )}
            </div>
          </div>

          {/* Spice Tolerance */}
          <div>
            <Label>Spice Tolerance</Label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.spice_tolerance}
                  onChange={(e) => handleChange('spice_tolerance', e.target.value)}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, #ff6900 0%, #ff6900 ${(formData.spice_tolerance - 1) * 25}%, #e5e7eb ${(formData.spice_tolerance - 1) * 25}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <span className="text-sm font-medium text-neutral-700 w-8 text-center">
                {formData.spice_tolerance}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>Mild</span>
              <span>Very Spicy</span>
            </div>
          </div>

          {/* Health Conscious */}
          <div className="flex items-center justify-between py-3">
            <div>
              <Label>Health Conscious</Label>
              <p className="text-xs text-neutral-500 mt-1">Prefer healthy, low-calorie options</p>
            </div>
            <button
              onClick={() => handleChange('health_conscious', (!formData.health_conscious).toString())}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.health_conscious ? 'bg-[#ff6900]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.health_conscious ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs text-orange-800">
              💡 <strong>Tip:</strong> To change dietary preferences or allergies, please complete the onboarding again from your profile settings.
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h3 className="mb-6 text-lg font-semibold">Location</h3>
        
        <div className="space-y-5">
          {formData.location_city && formData.location_country ? (
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">
                    {formData.location_city}
                    {formData.location_state && `, ${formData.location_state}`}
                  </div>
                  <div className="text-sm text-neutral-600 mt-1">
                    {formData.location_country}
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="text-xs text-neutral-500 mt-2">
                      Coordinates: {formData.latitude}, {formData.longitude}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
              <p className="text-sm text-neutral-500">
                No location data available
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Location is captured during onboarding
              </p>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-800">
              ℹ️ <strong>Note:</strong> Your location helps us provide personalized restaurant recommendations nearby. To update your location, please complete the onboarding flow again.
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h3 className="mb-6 text-lg font-semibold">Account Preferences</h3>
        <div className="space-y-4 text-neutral-600">
          <div className="flex items-center justify-between py-3">
            <span>Email notifications</span>
            <span className="text-neutral-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span>Push notifications</span>
            <span className="text-neutral-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span>Profile visibility</span>
            <span className="text-neutral-400">Coming soon</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full py-6 text-base"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
