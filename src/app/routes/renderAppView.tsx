import React from 'react';

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
  handleSave: (item: any) => void;
  setActiveShareItem: (item: any) => void;
  friends: any[];
  savedItems: any[];
  authUser: any;
  points: number;
  level: number;
  leaderboardUsers: any[];
  handleSignOut: () => Promise<void>;
  handleConversationOpened: (friendId: string) => void;
  components: {
    FeedView: any;
    BitesView: any;
    TrimsView: any;
    ChefAIView: any;
    ChatView: any;
    ScoutView: any;
    ProfileView: any;
    LeaderboardView: any;
    RewardsView: any;
    SettingsView: any;
  };
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
      return <FeedView onSave={handleSave} onShareRequest={(item: any) => setActiveShareItem(item)} />;
    case 'bites':
      return <BitesView onSave={handleSave} onShareRequest={(item: any) => setActiveShareItem(item)} />;
    case 'trims':
      return <TrimsView onSave={handleSave} onShareRequest={(item: any) => setActiveShareItem(item)} authUser={authUser} />;
    case 'chef':
      return <ChefAIView />;
    case 'chat':
      return <ChatView friends={friends} authUser={authUser} onSave={handleSave} onShareRequest={(item: any) => setActiveShareItem(item)} setTab={setTab} onConversationOpened={handleConversationOpened} />;
    case 'scout':
      return <ScoutView onSave={handleSave} onShareRequest={(item: any) => setActiveShareItem(item)} savedItems={savedItems} />;
    case 'profile':
      return <ProfileView savedItems={savedItems} authUser={authUser} friends={friends} />;
    case 'leaderboard':
      return <LeaderboardView userPoints={points} userLevel={level} leaderboardUsers={leaderboardUsers} />;
    case 'rewards':
      return <RewardsView />;
    case 'settings':
      return <SettingsView onSignOut={handleSignOut} authUser={authUser} />;
    default:
      return <FeedView onSave={handleSave} onShareRequest={(item: any) => setActiveShareItem(item)} />;
  }
};
