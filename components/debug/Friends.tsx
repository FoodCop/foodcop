"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import { FriendPlate } from '@/components/FriendPlate';
import { FriendSearch } from '@/components/FriendSearch';
import Image from 'next/image';

interface FriendRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  updated_at?: string;
  requester: {
    id: string;
    display_name: string;
    username: string;
    email: string;
  };
  requested: {
    id: string;
    display_name: string;
    username: string;
    email: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface SharedSave {
  id: string;
  sharer_id: string;
  shared_with_id: string;
  item_type: 'recipe' | 'restaurant';
  item_id: string;
  item_title: string;
  item_image_url?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  shared_at: string;
  sharer: {
    display_name: string;
    username: string;
  };
}

export function Friends() {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sharedSaves, setSharedSaves] = useState<SharedSave[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFriendId, setViewingFriendId] = useState<string | null>(null);

  useEffect(() => {
    console.log('Friends component useEffect triggered, user:', user);
    if (!user?.id) {
      console.log('No user ID available, skipping friend requests load');
      return;
    }

    const loadFriendRequests = async () => {
      console.log('Loading friend requests for user:', user.id);
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester:requester_id(id, display_name, username, email),
          requested:requested_id(id, display_name, username, email)
        `)
        .or(`requester_id.eq.${user?.id},requested_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading friend requests:', error);
      } else {
        console.log('Loaded friend requests:', data);
        setFriendRequests(data || []);
      }
    };

    const loadNotifications = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading notifications:', error);
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };

    const loadSharedSaves = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('shared_saves')
        .select(`
          *,
          sharer:sharer_id(display_name, username)
        `)
        .eq('shared_with_id', user?.id)
        .eq('status', 'pending')
        .order('shared_at', { ascending: false });

      if (error) {
        console.error('Error loading shared saves:', error);
      } else {
        setSharedSaves(data || []);
      }
    };

    const subscribeToRealtime = () => {
      const supabase = supabaseBrowser();
      
      const friendRequestsSubscription = supabase
        .channel('friend_requests_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'friend_requests' }, 
          () => loadFriendRequests()
        )
        .subscribe();

      const notificationsSubscription = supabase
        .channel('notifications_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications' }, 
          () => loadNotifications()
        )
        .subscribe();

      const sharedSavesSubscription = supabase
        .channel('shared_saves_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'shared_saves' }, 
          () => loadSharedSaves()
        )
        .subscribe();

      return () => {
        friendRequestsSubscription.unsubscribe();
        notificationsSubscription.unsubscribe();
        sharedSavesSubscription.unsubscribe();
      };
    };

    loadFriendRequests();
    loadNotifications();
    loadSharedSaves();
    const cleanup = subscribeToRealtime();

    return cleanup;
  }, [user]);

  const acceptFriendRequest = async (requestId: string) => {
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Error accepting friend request:', error);
    } else {
      // Create acceptance notification for the requester
      const request = friendRequests.find(req => req.id === requestId);
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.requester_id,
            type: 'friend_accepted',
            title: '🎉 Friend Request Accepted!',
            message: `${request.requested.display_name} accepted your friend request. You can now chat and share plates!`,
            data: {
              friend_id: request.requested_id,
              friend_name: request.requested.display_name,
              friend_username: request.requested.username
            }
          });
      }
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const respondToSharedSave = async (sharedSaveId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/respond-to-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharedSaveId,
          action
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully ${action}ed shared save:`, result.message);
        // Remove from pending list
        setSharedSaves(prev => prev.filter(save => save.id !== sharedSaveId));
      } else {
        console.error(`Error ${action}ing shared save:`, result.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing shared save:`, error);
    }
  };

  if (loading) {
    return <div>Loading friends and notifications...</div>;
  }

  // If viewing a friend's plate, render the FriendPlate component
  if (viewingFriendId) {
    return (
      <FriendPlate 
        friendId={viewingFriendId} 
        onBack={() => setViewingFriendId(null)} 
      />
    );
  }

  const pendingRequests = friendRequests.filter(req => 
    req.status === 'pending' && req.requested_id === user?.id
  );
  const sentRequests = friendRequests.filter(req => 
    req.status === 'pending' && req.requester_id === user?.id
  );
  const acceptedFriends = friendRequests.filter(req => req.status === 'accepted');

  // Debug logging
  console.log('Friends component debug:');
  console.log('- Current user ID:', user?.id);
  console.log('- Total friend requests:', friendRequests.length);
  console.log('- Pending requests (to me):', pendingRequests.length);
  console.log('- Sent requests (from me):', sentRequests.length);
  console.log('- Friend requests data:', friendRequests);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Friends & Notifications</h2>
      
      {/* Debug Information */}
      <div style={{ backgroundColor: '#f0f8ff', padding: '15px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h4>🐛 Debug Info</h4>
        <p><strong>Current User ID:</strong> {user?.id || 'Not loaded'}</p>
        <p><strong>User Email:</strong> {user?.email || 'Not loaded'}</p>
        <p><strong>Total Friend Requests:</strong> {friendRequests.length}</p>
        <p><strong>Pending Requests (to me):</strong> {pendingRequests.length}</p>
        <p><strong>Sent Requests (from me):</strong> {sentRequests.length}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        
        {/* Manual Accept Button for Testing */}
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffebcd', border: '1px dashed #ff6b35' }}>
          <h5>🧪 Manual Test - Accept Quantum Climb&apos;s Friend Request</h5>
          <button 
            onClick={async () => {
              const supabase = supabaseBrowser();
              const { error } = await supabase
                .from('friend_requests')
                .update({ status: 'accepted', updated_at: new Date().toISOString() })
                .eq('id', 'ce1fa149-9bcb-4228-a98e-4ccd9a358058');
              
              if (error) {
                alert('Error: ' + error.message);
              } else {
                alert('Friend request accepted! Refresh the page to see changes.');
                window.location.reload();
              }
            }}
            style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🤝 Accept Quantum Climb&apos;s Request
          </button>
        </div>
      </div>
      
      {/* Friend Search */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #e3f2fd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h3 style={{ marginBottom: '15px' }}>🔍 Find Friends</h3>
        <FriendSearch onFriendAdded={() => {
          // Reload friend requests when a new friend is added
          window.location.reload();
        }} />
      </div>
      
      {/* Notifications */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🔔 Notifications ({notifications.filter(n => !n.is_read).length} unread)</h3>
        {notifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                margin: '5px 0',
                backgroundColor: notification.is_read ? '#f9f9f9' : '#fff3cd'
              }}
            >
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small>{new Date(notification.created_at).toLocaleString()}</small>
              {!notification.is_read && (
                <button 
                  onClick={() => markNotificationAsRead(notification.id)}
                  style={{ marginLeft: '10px', fontSize: '12px' }}
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Shared Saves (Pending Approvals) */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🍽️ Pending Save-to-Plate Shares ({sharedSaves.length})</h3>
        {sharedSaves.length === 0 ? (
          <p>No pending shared saves</p>
        ) : (
          sharedSaves.map(save => (
            <div key={save.id} style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {save.item_image_url && (
                  <Image 
                    src={save.item_image_url} 
                    alt={save.item_title}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '16px' }}>
                    {save.item_type === 'recipe' ? '🍳' : '🍽️'} {save.item_title}
                  </strong>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    Shared by <strong>{save.sharer.display_name}</strong> (@{save.sharer.username})
                  </p>
                  {save.message && (
                    <p style={{ margin: '5px 0', fontStyle: 'italic' }}>&ldquo;{save.message}&rdquo;</p>
                  )}
                  <small style={{ color: '#888' }}>
                    {new Date(save.shared_at).toLocaleString()}
                  </small>
                </div>
              </div>
              <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button 
                  onClick={() => respondToSharedSave(save.id, 'accept')}
                  style={{ 
                    marginRight: '10px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Accept & Save to My Plate
                </button>
                <button 
                  onClick={() => respondToSharedSave(save.id, 'reject')}
                  style={{ 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Friend Requests */}
      <div style={{ marginBottom: '30px' }}>
        <h3>📬 Pending Friend Requests ({pendingRequests.length})</h3>
        {pendingRequests.length === 0 ? (
          <p>No pending friend requests</p>
        ) : (
          pendingRequests.map(request => {
            // Safety check for null user data
            const requester = request.requester;
            if (!requester) {
              console.warn('Missing requester data for request:', request);
              return null;
            }
            
            return (
            <div key={request.id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0' }}>
              <strong>{requester.display_name} (@{requester.username})</strong>
              <p>{request.message}</p>
              <small>{new Date(request.created_at).toLocaleString()}</small>
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => acceptFriendRequest(request.id)}
                  style={{ marginRight: '10px', backgroundColor: '#28a745', color: 'white', padding: '5px 10px' }}
                >
                  Accept
                </button>
                <button 
                  onClick={() => rejectFriendRequest(request.id)}
                  style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px' }}
                >
                  Reject
                </button>
              </div>
            </div>
            );
          }).filter(Boolean)
        )}
      </div>

      {/* Sent Requests */}
      <div style={{ marginBottom: '30px' }}>
        <h3>📤 Sent Friend Requests ({sentRequests.length})</h3>
        {sentRequests.map(request => {
          // Safety check for null user data
          const requested = request.requested;
          if (!requested) {
            console.warn('Missing requested user data for request:', request);
            return null;
          }
          
          return (
          <div key={request.id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0' }}>
            <strong>To: {requested.display_name} (@{requested.username})</strong>
            <p>{request.message}</p>
            <small>Sent: {new Date(request.created_at).toLocaleString()}</small>
            <span style={{ color: 'orange', marginLeft: '10px' }}>⏳ Pending</span>
          </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Current Friends */}
      <div>
        <h3>👥 Friends ({acceptedFriends.length})</h3>
        {acceptedFriends.map(request => {
          const friend = request.requester_id === user?.id ? request.requested : request.requester;
          
          // Safety check for null friend data
          if (!friend) {
            console.warn('Missing friend data for request:', request);
            return null;
          }
          
          return (
            <div key={request.id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{friend.display_name} (@{friend.username})</strong>
                  <span style={{ color: 'green', marginLeft: '10px' }}>
                    ✅ Friends since {new Date(request.updated_at || request.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <button 
                    onClick={() => window.open('/chat', '_blank')}
                    style={{ 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginRight: '10px'
                    }}
                  >
                    💬 Chat
                  </button>
                  <button 
                    onClick={() => setViewingFriendId(friend.id)}
                    style={{ 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    🍽️ View Plate
                  </button>
                </div>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}