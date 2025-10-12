'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Users,
  Camera,
  Search,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';
import { ChatUser } from '../utils/ChatTypes';

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (group: GroupCreationData) => void;
  availableContacts?: ChatUser[];
}

interface GroupCreationData {
  name: string;
  description: string;
  avatar_url?: string;
  member_ids: string[];
  privacy_settings: {
    allow_members_to_add: boolean;
    allow_members_to_edit_info: boolean;
    show_member_add_history: boolean;
    is_private: boolean;
  };
  admin_ids: string[];
}

interface SelectedMember extends ChatUser {
  isAdmin: boolean;
}

export function NewGroupDialog({
  open,
  onOpenChange,
  onGroupCreated,
  availableContacts = [],
}: NewGroupDialogProps) {
  const [step, setStep] = useState<'details' | 'members' | 'settings'>('details');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    allow_members_to_add: true,
    allow_members_to_edit_info: false,
    show_member_add_history: true,
    is_private: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Mock contacts if none provided
  const mockContacts: ChatUser[] = [
    {
      id: 'user1',
      display_name: 'Alex Johnson',
      username: 'alexj2024',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      email: 'alex@example.com',
      is_online: true,
      last_seen: new Date().toISOString(),
      privacy_settings: {
        show_online_status: true,
        show_last_seen: true,
        show_read_receipts: true,
      },
    },
    {
      id: 'user2',
      display_name: 'Sarah Miller',
      username: 'sarahm',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612d8b0?w=150&h=150&fit=crop&crop=face',
      email: 'sarah@example.com',
      is_online: false,
      last_seen: '2024-10-12T10:30:00Z',
      privacy_settings: {
        show_online_status: true,
        show_last_seen: true,
        show_read_receipts: true,
      },
    },
    {
      id: 'user3',
      display_name: 'Mike Chen',
      username: 'mikec',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      email: 'mike@example.com',
      is_online: true,
      last_seen: new Date().toISOString(),
      privacy_settings: {
        show_online_status: true,
        show_last_seen: true,
        show_read_receipts: true,
      },
    },
    {
      id: 'user4',
      display_name: 'Emma Wilson',
      username: 'emmaw',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      email: 'emma@example.com',
      is_online: false,
      last_seen: '2024-10-12T09:15:00Z',
      privacy_settings: {
        show_online_status: true,
        show_last_seen: true,
        show_read_receipts: true,
      },
    },
  ];

  const contacts = availableContacts.length > 0 ? availableContacts : mockContacts;

  const filteredContacts = contacts.filter(contact =>
    contact.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setStep('details');
    setGroupName('');
    setGroupDescription('');
    setGroupAvatar('');
    setSearchQuery('');
    setSelectedMembers([]);
    setPrivacySettings({
      allow_members_to_add: true,
      allow_members_to_edit_info: false,
      show_member_add_history: true,
      is_private: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleMemberToggle = (contact: ChatUser) => {
    setSelectedMembers(prev => {
      const existing = prev.find(m => m.id === contact.id);
      if (existing) {
        return prev.filter(m => m.id !== contact.id);
      } else {
        return [...prev, { ...contact, isAdmin: false }];
      }
    });
  };

  const handleAdminToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? { ...member, isAdmin: !member.isAdmin }
          : member
      )
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setIsCreating(true);
    try {
      const groupData: GroupCreationData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        avatar_url: groupAvatar,
        member_ids: selectedMembers.map(m => m.id),
        privacy_settings: privacySettings,
        admin_ids: selectedMembers.filter(m => m.isAdmin).map(m => m.id),
      };

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onGroupCreated?.(groupData);
      handleClose();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canProceedToMembers = groupName.trim().length > 0;
  const canProceedToSettings = selectedMembers.length > 0;
  const canCreateGroup = groupName.trim().length > 0 && selectedMembers.length > 0;

  const handleAvatarUpload = () => {
    // Mock avatar upload - implement actual file upload
    const mockAvatarUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop';
    setGroupAvatar(mockAvatarUrl);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                {groupAvatar ? (
                  <Image
                    src={groupAvatar}
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAvatarUpload}
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white border-2 border-white shadow-md"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-1"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {groupName.length}/50 characters
                </p>
              </div>

              <div>
                <Label htmlFor="groupDescription">Description (Optional)</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="What&apos;s this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="mt-1 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {groupDescription.length}/200 characters
                </p>
              </div>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    Selected Members ({selectedMembers.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMembers([])}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-full px-3 py-1"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar_url} alt={member.display_name} />
                        <AvatarFallback className="text-xs">
                          {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.display_name}</span>
                      {member.isAdmin && (
                        <Crown className="h-3 w-3 text-yellow-600" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMemberToggle(member)}
                        className="h-4 w-4 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredContacts.map((contact) => {
                const isSelected = selectedMembers.some(m => m.id === contact.id);
                const selectedMember = selectedMembers.find(m => m.id === contact.id);

                return (
                  <div
                    key={contact.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleMemberToggle(contact)}
                      />
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar_url} alt={contact.display_name} />
                          <AvatarFallback>
                            {contact.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {contact.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {contact.display_name}
                        </h3>
                        <p className="text-sm text-gray-500">@{contact.username}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAdminToggle(contact.id)}
                        className={`${
                          selectedMember?.isAdmin
                            ? 'text-yellow-600 bg-yellow-50'
                            : 'text-gray-600'
                        }`}
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        {selectedMember?.isAdmin ? 'Admin' : 'Make Admin'}
                      </Button>
                    )}
                  </div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No contacts found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Group Privacy</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                      {privacySettings.is_private ? (
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Private Group</p>
                      <p className="text-xs text-gray-500">
                        Only group members can see who&apos;s in the group and what they share
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.is_private}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, is_private: checked as boolean }))
                    }
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
                        Allow group members to add new people to the group
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.allow_members_to_add}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, allow_members_to_add: checked as boolean }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                      <Settings className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Members can edit group info</p>
                      <p className="text-xs text-gray-500">
                        Allow members to change group name, description, and photo
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.allow_members_to_edit_info}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, allow_members_to_edit_info: checked as boolean }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Show member add history</p>
                      <p className="text-xs text-gray-500">
                        Display when someone joins or is added to the group
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={privacySettings.show_member_add_history}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, show_member_add_history: checked as boolean }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Group Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Group Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{groupName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Members:</span>
                  <span className="font-medium">{selectedMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admins:</span>
                  <span className="font-medium">
                    {selectedMembers.filter(m => m.isAdmin).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Privacy:</span>
                  <span className="font-medium">
                    {privacySettings.is_private ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {step !== 'details' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 'members') setStep('details');
                  if (step === 'settings') setStep('members');
                }}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <DialogTitle className="flex items-center space-x-2 flex-1 text-center">
              <Users className="h-5 w-5 text-orange-500" />
              <span>
                {step === 'details' && 'Create Group'}
                {step === 'members' && 'Add Members'}
                {step === 'settings' && 'Group Settings'}
              </span>
            </DialogTitle>

            {step !== 'details' && <div className="w-10" />}
          </div>
          
          {/* Progress Indicator */}
          <div className="flex space-x-2 mt-4">
            <div className={`h-1 flex-1 rounded ${step === 'details' ? 'bg-orange-500' : 'bg-orange-200'}`} />
            <div className={`h-1 flex-1 rounded ${step === 'members' ? 'bg-orange-500' : step === 'settings' ? 'bg-orange-200' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded ${step === 'settings' ? 'bg-orange-500' : 'bg-gray-200'}`} />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          <div className="flex space-x-2">
            {step === 'details' && (
              <Button
                onClick={() => setStep('members')}
                disabled={!canProceedToMembers}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            
            {step === 'members' && (
              <Button
                onClick={() => setStep('settings')}
                disabled={!canProceedToSettings}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            
            {step === 'settings' && (
              <Button
                onClick={handleCreateGroup}
                disabled={!canCreateGroup || isCreating}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Create Group
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}