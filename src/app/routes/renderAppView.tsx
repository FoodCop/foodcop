import React from 'react';
import type { AuthUser } from '../../features/auth/types/auth';
import type { ChatFriend } from '../../features/chat/types/chatUi';
import type { LeaderboardEntry } from '../../features/points/services/pointsService';
import type { AppItem } from '../../shared/types/appItem';

interface RenderComponents {
  FeedView: React.ComponentType<{ onSave: (item: AppItem) => void; onShareRequest: (item: AppItem) => void }>;
  BitesView: React.ComponentType<{ onSave: (item: AppItem) => void; onShareRequest: (item: AppItem) => void }>;
  TrimsView: React.ComponentType<{ onSave: (item: AppItem) => void; onShareRequest: (item: AppItem) => void; authUser: AuthUser | null }>;
  ChefAIView: React.ComponentType;
  ChatView: React.ComponentType<{
    friends: ChatFriend[];
    authUser: AuthUser | null;
    onSave: (item: AppItem) => void;
    onShareRequest: (item: AppItem) => void;
    setTab: (tab: string) => void;
    onConversationOpened: (friendId: string) => void;
  }>;
  ScoutView: React.ComponentType<{ onSave: (item: AppItem) => void; onShareRequest: (item: AppItem) => void; savedItems: AppItem[] }>;
  ProfileView: React.ComponentType<{ savedItems: AppItem[]; authUser: AuthUser | null; friends: ChatFriend[] }>;
  LeaderboardView: React.ComponentType<{ userPoints: number; userLevel: number; leaderboardUsers: LeaderboardEntry[] }>;
  RewardsView: React.ComponentType;
  SettingsView: React.ComponentType<{ onSignOut: () => Promise<void>; authUser: AuthUser | null }>;
}

export const renderAppView = ({
  tab,
  setTab,
  handleSave,
  setActiveShareItem,
  friends,
  savedItems,
  authUser,
  points,
  level,
  leaderboardUsers,
  handleSignOut,
  handleConversationOpened,
  components,
}: {
  tab: string;
  setTab: (tab: string) => void;
  handleSave: (item: AppItem) => void;
  setActiveShareItem: (item: AppItem) => void;
  friends: ChatFriend[];
  savedItems: AppItem[];
  authUser: AuthUser | null;
  points: number;
  level: number;
  leaderboardUsers: LeaderboardEntry[];
  handleSignOut: () => Promise<void>;
  handleConversationOpened: (friendId: string) => void;
  components: RenderComponents;
}) => {
  const {
    FeedView,
    BitesView,
    TrimsView,
    ChefAIView,
    ChatView,
    ScoutView,
    ProfileView,
    LeaderboardView,
    RewardsView,
    SettingsView,
  } = components;

  switch (tab) {
    case 'feed':
      return <FeedView onSave={handleSave} onShareRequest={setActiveShareItem} />;
    case 'bites':
      return <BitesView onSave={handleSave} onShareRequest={setActiveShareItem} />;
    case 'trims':
      return <TrimsView onSave={handleSave} onShareRequest={setActiveShareItem} authUser={authUser} />;
    case 'chef':
      return <ChefAIView />;
    case 'chat':
      return <ChatView friends={friends} authUser={authUser} onSave={handleSave} onShareRequest={setActiveShareItem} setTab={setTab} onConversationOpened={handleConversationOpened} />;
    case 'scout':
      return <ScoutView onSave={handleSave} onShareRequest={setActiveShareItem} savedItems={savedItems} />;
    case 'profile':
      return <ProfileView savedItems={savedItems} authUser={authUser} friends={friends} />;
    case 'leaderboard':
      return <LeaderboardView userPoints={points} userLevel={level} leaderboardUsers={leaderboardUsers} />;
    case 'rewards':
      return <RewardsView />;
    case 'settings':
      return <SettingsView onSignOut={handleSignOut} authUser={authUser} />;
    default:
      return <FeedView onSave={handleSave} onShareRequest={setActiveShareItem} />;
  }
};
