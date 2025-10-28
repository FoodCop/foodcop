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
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    <div className="py-6 space-y-6">
      <div>
        <h3 className="mb-4">Profile Information</h3>
        
        <div className="space-y-4">
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

      <Separator />

      <div>
        <h3 className="mb-4">Account Preferences</h3>
        <div className="space-y-3 text-neutral-600">
          <div className="flex items-center justify-between py-2">
            <span>Email notifications</span>
            <span className="text-neutral-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Push notifications</span>
            <span className="text-neutral-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Profile visibility</span>
            <span className="text-neutral-400">Coming soon</span>
          </div>
        </div>
      </div>

      <Separator />

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
