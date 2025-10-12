'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Users,
  Shield,
  Camera,
  Crown,
  UserMinus,
  UserPlus,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Trash2,
  LogOut,
  Edit,
  Save,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';

// Local interfaces
interface GroupMember {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  is_online: boolean;
  role: 'admin' | 'member';
  joined_at: string;
  added_by?: string;
}

interface GroupSettings {
  name: string;
  description: string;
  avatar_url: string;
  privacy_settings: {
    is_private: boolean;
    allow_members_to_add: boolean;
    allow_members_to_edit_info: boolean;
    show_member_add_history: boolean;
  };
  notification_settings: {
    mute_notifications: boolean;
    mute_until?: string;
  };
}

interface GroupManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupSettings: GroupSettings;
  members: GroupMember[];
  currentUserId: string;
  onUpdateSettings?: (settings: Partial<GroupSettings>) => void;
  onAddMembers?: () => void;
  onRemoveMember?: (memberId: string) => void;
  onPromoteToAdmin?: (memberId: string) => void;
  onDemoteFromAdmin?: (memberId: string) => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

export function GroupManagement({
  open,
  onOpenChange,
  groupId,
  groupSettings: initialSettings,
  members,
  currentUserId,
  onUpdateSettings,
  onAddMembers,
  onRemoveMember,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onLeaveGroup,
  onDeleteGroup,
}: GroupManagementProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [settings, setSettings] = useState<GroupSettings>(initialSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const currentUser = members.find(m => m.id === currentUserId);
  const isCurrentUserAdmin = currentUser?.role === 'admin';
  const adminMembers = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      onUpdateSettings?.(settings);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSettings(initialSettings);
    setIsEditing(false);
  };

  const handleAvatarUpload = () => {
    // Mock avatar upload
    const mockAvatarUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop';
    setSettings(prev => ({ ...prev, avatar_url: mockAvatarUrl }));
  };

  const handleMuteToggle = () => {
    const newMuteState = !settings.notification_settings.mute_notifications;
    setSettings(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        mute_notifications: newMuteState,
        mute_until: newMuteState ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
      },
    }));
  };

  const MemberManagementItem = ({ member }: { member: GroupMember }) => {
    const canManageMember = isCurrentUserAdmin && member.id !== currentUserId;
    const isOnlyAdmin = member.role === 'admin' && adminMembers.length === 1;

    return (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar_url} alt={member.display_name} />
              <AvatarFallback>
                {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {member.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">{member.display_name}</h4>
              {member.role === 'admin' && (
                <Crown className="h-4 w-4 text-yellow-600" />
              )}
              {member.id === currentUserId && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">@{member.username}</p>
            <p className="text-xs text-gray-400">
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {canManageMember && (
          <div className="flex items-center space-x-1">
            {member.role === 'admin' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDemoteFromAdmin?.(member.id)}
                disabled={isOnlyAdmin}
                className="text-orange-600 hover:text-orange-700"
              >
                <Crown className="h-4 w-4 mr-1" />
                Remove Admin
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPromoteToAdmin?.(member.id)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Crown className="h-4 w-4 mr-1" />
                Make Admin
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveMember?.(member.id)}
              className="text-red-600 hover:text-red-700"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-500" />
            <span>Group Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Group Info</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="info" className="space-y-6 p-4">
              {/* Group Avatar */}
              <div className="text-center">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  {settings.avatar_url ? (
                    <Image
                      src={settings.avatar_url}
                      alt="Group avatar"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                  )}
                  {isCurrentUserAdmin && (isEditing || settings.privacy_settings.allow_members_to_edit_info) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAvatarUpload}
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white border-2 border-white shadow-md"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Group Name */}
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                {isEditing ? (
                  <Input
                    id="groupName"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                    maxLength={50}
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{settings.name}</p>
                  </div>
                )}
              </div>

              {/* Group Description */}
              <div>
                <Label htmlFor="groupDescription">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="groupDescription"
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-700">{settings.description || 'No description'}</p>
                  </div>
                )}
              </div>

              {/* Group Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                      <p className="text-sm text-gray-600">Members</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{adminMembers.length}</p>
                      <p className="text-sm text-gray-600">Admins</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isCurrentUserAdmin && (
                <div className="flex justify-between">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Group Info
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4 p-4">
              {/* Add Members Button */}
              {isCurrentUserAdmin && (
                <Button
                  onClick={onAddMembers}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </Button>
              )}

              {/* Admins Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-yellow-600" />
                  Admins ({adminMembers.length})
                </h3>
                <div className="space-y-1">
                  {adminMembers.map((member) => (
                    <MemberManagementItem key={`admin-${member.id}`} member={member} />
                  ))}
                </div>
              </div>

              {/* Regular Members Section */}
              {regularMembers.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Members ({regularMembers.length})
                  </h3>
                  <div className="space-y-1">
                    {regularMembers.map((member) => (
                      <MemberManagementItem key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 p-4">
              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                        {settings.privacy_settings.is_private ? (
                          <EyeOff className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Private Group</p>
                        <p className="text-xs text-gray-500">
                          Only group members can see who&apos;s in the group
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={settings.privacy_settings.is_private}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          privacy_settings: { ...prev.privacy_settings, is_private: checked as boolean }
                        }))
                      }
                      disabled={!isCurrentUserAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                        <UserPlus className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Members can add others</p>
                        <p className="text-xs text-gray-500">
                          Allow group members to add new people
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={settings.privacy_settings.allow_members_to_add}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          privacy_settings: { ...prev.privacy_settings, allow_members_to_add: checked as boolean }
                        }))
                      }
                      disabled={!isCurrentUserAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                        <Edit className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Members can edit group info</p>
                        <p className="text-xs text-gray-500">
                          Allow members to change group name and description
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={settings.privacy_settings.allow_members_to_edit_info}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({
                          ...prev,
                          privacy_settings: { ...prev.privacy_settings, allow_members_to_edit_info: checked as boolean }
                        }))
                      }
                      disabled={!isCurrentUserAdmin}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                      {settings.notification_settings.mute_notifications ? (
                        <BellOff className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Bell className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Mute notifications</p>
                      <p className="text-xs text-gray-500">
                        Turn off notifications for this group
                        {settings.notification_settings.mute_until && (
                          <span className="block">
                            Muted until {new Date(settings.notification_settings.mute_until).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settings.notification_settings.mute_notifications}
                    onCheckedChange={handleMuteToggle}
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-medium text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Danger Zone
                </h3>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLeaveConfirm(true)}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Group
                  </Button>
                  
                  {isCurrentUserAdmin && adminMembers.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Group
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Confirmation Dialogs */}
        {showLeaveConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="font-semibold text-gray-900 mb-2">Leave Group?</h3>
              <p className="text-sm text-gray-600 mb-4">
                You will no longer receive messages from this group. You can be added back by any group member.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onLeaveGroup?.();
                    setShowLeaveConfirm(false);
                    onOpenChange(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="font-semibold text-gray-900 mb-2">Delete Group?</h3>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. All messages and media will be permanently deleted.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onDeleteGroup?.();
                    setShowDeleteConfirm(false);
                    onOpenChange(false);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}