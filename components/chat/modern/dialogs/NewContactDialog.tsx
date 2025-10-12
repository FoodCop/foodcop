'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  QrCode,
  Users,
  UserPlus,
  Phone,
  Mail,
  Star,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { ChatUser } from '../utils/ChatTypes';

interface NewContactDialogProps {
  children: React.ReactNode;
  onContactAdded?: (contact: ChatUser) => void;
}

interface ContactSuggestion extends ChatUser {
  mutualFriends: number;
  reason: 'mutual_friends' | 'phone_contacts' | 'nearby' | 'recent_activity';
}

interface ContactSearchResult extends ChatUser {
  matchType: 'username' | 'email' | 'phone' | 'name';
}

export function NewContactDialog({ children, onContactAdded }: NewContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [addingContacts, setAddingContacts] = useState<Set<string>>(new Set());

  // Load contact suggestions when dialog opens
  useEffect(() => {
    if (open) {
      loadContactSuggestions();
    }
  }, [open]);

  // Search contacts with debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchContacts(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadContactSuggestions = async () => {
    try {
      // Mock suggestions - replace with actual API call
      const mockSuggestions: ContactSuggestion[] = [
        {
          id: 'user1',
          display_name: 'Alex Johnson',
          username: 'alexj2024',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          email: 'alex@example.com',
          is_online: true,
          last_seen: new Date().toISOString(),
          mutualFriends: 5,
          reason: 'mutual_friends',
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
          mutualFriends: 3,
          reason: 'phone_contacts',
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
          mutualFriends: 8,
          reason: 'nearby',
          privacy_settings: {
            show_online_status: true,
            show_last_seen: true,
            show_read_receipts: true,
          },
        },
      ];
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to load contact suggestions:', error);
    }
  };

  const searchContacts = async (query: string) => {
    setIsSearching(true);
    try {
      // Mock search results - replace with actual API call
      const mockResults: ContactSearchResult[] = [
        {
          id: 'search1',
          display_name: 'Emma Wilson',
          username: 'emmaw',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          email: 'emma@example.com',
          is_online: false,
          last_seen: '2024-10-12T09:15:00Z',
          matchType: 'username' as const,
          privacy_settings: {
            show_online_status: true,
            show_last_seen: true,
            show_read_receipts: true,
          },
        },
      ].filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.display_name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (contact: ChatUser | ContactSuggestion) => {
    const contactId = contact.id;
    setAddingContacts(prev => new Set(prev).add(contactId));
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onContactAdded?.(contact);
      
      // Remove from suggestions if it was a suggestion
      setSuggestions(prev => prev.filter(s => s.id !== contactId));
      setSearchResults(prev => prev.filter(s => s.id !== contactId));
      
    } catch (error) {
      console.error('Failed to add contact:', error);
    } finally {
      setAddingContacts(prev => {
        const next = new Set(prev);
        next.delete(contactId);
        return next;
      });
    }
  };

  const getReasonBadge = (reason: ContactSuggestion['reason']) => {
    const badges = {
      mutual_friends: { label: 'Mutual Friends', variant: 'default' as const },
      phone_contacts: { label: 'From Contacts', variant: 'secondary' as const },
      nearby: { label: 'Nearby', variant: 'outline' as const },
      recent_activity: { label: 'Recent', variant: 'default' as const },
    };
    return badges[reason];
  };

  const getMatchTypeBadge = (matchType: ContactSearchResult['matchType']) => {
    const badges = {
      username: { label: 'Username', variant: 'default' as const },
      email: { label: 'Email', variant: 'secondary' as const },
      phone: { label: 'Phone', variant: 'outline' as const },
      name: { label: 'Name', variant: 'default' as const },
    };
    return badges[matchType];
  };

  const ContactCard = ({ 
    contact, 
    showAddButton = true, 
    badge 
  }: { 
    contact: ChatUser | ContactSuggestion | ContactSearchResult;
    showAddButton?: boolean;
    badge?: { label: string; variant: 'default' | 'secondary' | 'outline' };
  }) => {
    const isAdding = addingContacts.has(contact.id);
    const mutualFriends = 'mutualFriends' in contact ? contact.mutualFriends : 0;

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.avatar_url} alt={contact.display_name} />
              <AvatarFallback>
                {contact.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {contact.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">
                {contact.display_name}
              </h3>
              {badge && (
                <Badge variant={badge.variant} className="text-xs">
                  {badge.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">@{contact.username}</p>
            {mutualFriends > 0 && (
              <p className="text-xs text-gray-400">
                {mutualFriends} mutual friend{mutualFriends > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {showAddButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddContact(contact)}
            disabled={isAdding}
            className="min-w-[80px]"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-orange-500" />
            <span>Add New Contact</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center space-x-1">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Suggestions</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center space-x-1">
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="search" className="h-full flex flex-col">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by username, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        badge={getMatchTypeBadge(contact.matchType)}
                      />
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No contacts found</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Start typing to search for contacts</p>
                      <p className="text-sm">Search by username, email, or phone number</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">People you may know</h3>
                  <Button variant="ghost" size="sm" onClick={loadContactSuggestions}>
                    Refresh
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                  {suggestions.length > 0 ? (
                    suggestions.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        badge={getReasonBadge(contact.reason)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No suggestions available</p>
                      <p className="text-sm">Check back later for new suggestions</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="h-full">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">QR Code Scanner</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Scan someone&apos;s QR code to add them as a contact
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Camera view</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <QrCode className="h-4 w-4 mr-2" />
                    Open Camera
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Or share your QR code</p>
                    <Button variant="ghost" size="sm">
                      Show My QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}