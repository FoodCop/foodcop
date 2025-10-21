import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, UserPlus } from "lucide-react";
import Link from "next/link";

export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  online?: boolean;
  isMasterBot?: boolean;
}

interface FriendsListProps {
  friends: Friend[];
  selectedFriendId?: string;
  onSelectFriend: (friendId: string) => void;
}

export function FriendsList({ friends, selectedFriendId, onSelectFriend }: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Link href="/friends" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Manage Friends
            </Button>
          </Link>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => onSelectFriend(friend.id)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                  selectedFriendId === friend.id ? "bg-gray-100" : ""
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {friend.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="truncate">{friend.name}</p>
                      {friend.isMasterBot && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                          🤖 Bot
                        </span>
                      )}
                    </div>
                    {friend.timestamp && (
                      <span className="text-xs text-gray-500">{friend.timestamp}</span>
                    )}
                  </div>
                  {friend.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">{friend.lastMessage}</p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                {searchQuery ? "No friends found" : "No friends yet"}
              </div>
              {!searchQuery && (
                <Link href="/friends">
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find Friends
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
