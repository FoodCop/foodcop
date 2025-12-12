import { useState, useEffect } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useDMChatStore } from '../../stores/chatStore';

interface User {
    id: string;
    email: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    location_city?: string;
    location_country?: string;
    bio?: string;
}

interface UserDiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser?: (userId: string) => void;
}

export function UserDiscoveryModal({
    isOpen,
    onClose,
    onSelectUser,
}: Readonly<UserDiscoveryModalProps>) {
    const { user: currentUser } = useAuthStore();
    const { startConversation, openChat } = useDMChatStore();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all users when modal opens
    useEffect(() => {
        if (isOpen && currentUser?.id) {
            fetchUsers();
        }
    }, [isOpen, currentUser?.id]);

    // Filter users based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = users.filter(
            (user) =>
                user.display_name?.toLowerCase().includes(query) ||
                user.username?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.location_city?.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        if (!currentUser?.id) {
            console.warn('Cannot fetch users: User not authenticated');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('🔍 Fetching users, excluding:', currentUser.id);
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('id, email, display_name, username, avatar_url, location_city, location_country, bio')
                .neq('id', currentUser.id) // Exclude current user
                .order('display_name', { ascending: true, nullsFirst: false });

            console.log('📦 Users fetched:', { count: data?.length, error: fetchError });

            if (fetchError) {
                throw fetchError;
            }

            setUsers(data || []);
            setFilteredUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMessageUser = async (userId: string) => {
        if (!currentUser?.id) return;

        // Start conversation
        const conversationId = await startConversation(currentUser.id, userId);

        if (conversationId) {
            // Open chat drawer
            openChat();

            // Call optional callback
            onSelectUser?.(userId);

            // Close modal
            onClose();
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-xl font-bold">Find People</DialogTitle>
                </DialogHeader>

                {/* Search Bar */}
                <div className="px-6 py-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, username, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* User List */}
                <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(80vh - 180px)' }}>
                    {(() => {
                        if (isLoading) {
                            return (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                </div>
                            );
                        }
                        
                        if (error) {
                            return (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-red-500 mb-4">{error}</p>
                                    <Button onClick={fetchUsers} variant="outline">
                                        Try Again
                                    </Button>
                                </div>
                            );
                        }
                        
                        if (filteredUsers.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-gray-500 mb-2">
                                        {searchQuery ? 'No users found' : 'No users available'}
                                    </p>
                                    {searchQuery && (
                                        <p className="text-sm text-gray-400">
                                            Try a different search term
                                        </p>
                                    )}
                                </div>
                            );
                        }
                        
                        return (
                            <div className="space-y-2">
                                {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="bg-orange-100 text-orange-600">
                                            {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {user.display_name || user.username}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            @{user.username}
                                        </p>
                                        {(user.location_city || user.location_country) && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3 text-gray-400" />
                                                <p className="text-xs text-gray-400 truncate">
                                                    {[user.location_city, user.location_country]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Button */}
                                    <Button
                                        onClick={() => handleMessageUser(user.id)}
                                        size="sm"
                                        className="bg-orange-500 hover:bg-orange-600 shrink-0"
                                    >
                                        Message
                                    </Button>
                                </div>
                                ))}
                            </div>
                        );
                    })()}
                </ScrollArea>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                        {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default UserDiscoveryModal;
