"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location_city?: string;
  location_country?: string;
  total_points: number;
  followers_count: number;
  following_count: number;
  is_master_bot: boolean;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = supabaseBrowser();
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/debug/users");
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const refreshUsers = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    const updateLastSeen = async () => {
      try {
        // Get current user session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log("No authenticated user for last_seen update");
          return;
        }

        // Update last_seen directly via Supabase
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_seen: new Date().toISOString() })
          .eq('email', user.email);

        if (updateError) {
          console.error("Error updating last_seen:", updateError);
        } else {
          console.log("Successfully updated last_seen timestamp");
        }
      } catch (err) {
        console.log("Could not update last seen:", err);
      }
    };

    // Update last seen timestamp when component mounts
    updateLastSeen();
    
    fetchUsers().finally(() => setLoading(false));
    
    // Set up interval to update last seen every 2 minutes
    const interval = setInterval(updateLastSeen, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px", color: "red" }}>
        <h3>Users Debug - Error</h3>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h3>Users Debug - Total Users: {users.length}</h3>
        <button
          onClick={() => {
            setLoading(true);
            fetchUsers().finally(() => setLoading(false));
          }}
          disabled={loading}
          style={{
            padding: "5px 10px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      
      {users.length === 0 ? (
        <p>No users found in the database.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>User ID</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Username</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Display Name</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Email</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Online Status</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Location</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Points</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Stats</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Status</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    <strong>{user.id.substring(0, 8)}...</strong>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <strong style={{ color: "#047DD4" }}>@{user.username}</strong>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {user.display_name}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    {user.email}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    {user.is_online ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>🟢 Online</span>
                    ) : (
                      <span style={{ color: "gray" }}>⚫ Offline</span>
                    )}
                    {user.last_seen && (
                      <div style={{ fontSize: "10px", color: "#666" }}>
                        Last seen: {new Date(user.last_seen).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    {user.location_city && user.location_country 
                      ? `${user.location_city}, ${user.location_country}`
                      : user.location_city || user.location_country || "N/A"
                    }
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                    {user.total_points}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    Followers: {user.followers_count}<br/>
                    Following: {user.following_count}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    {user.is_master_bot && "🤖 Bot "}
                    {user.bio && "📝 Bio "}
                    {user.avatar_url && "🖼️ Avatar "}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
