// Tako / Chef AI types. Ported from:
// - legacy/fuzoapp/src/features/chef (chat message + structured response shape)
// - FUZO_V3/js/tako.js (mood/quick-action landing screen)

export interface ChefStructuredResponse {
  speech: string;
  bullets?: string[];
  cards?: {
    title: string;
    description: string;
    meta?: string;
    suggestion: string;
  }[];
  actions?: {
    label: string;
    command: string;
  }[];
  suggestions?: string[];
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface Mood {
  icon: string;
  label: string;
  prompt: string;
}

// Quick Discovery actions are either a real in-app navigation, a conversation
// starter handled by Tako itself, or (for features not built yet) a "coming
// soon" notice - unlike tako.js's version, where every action was a no-op
// toast regardless of type.
export type QuickAction =
  | { icon: string; label: string; color: string; type: 'navigate'; href: string }
  | { icon: string; label: string; color: string; type: 'prompt'; prompt: string }
  | { icon: string; label: string; color: string; type: 'create-card' }
  | { icon: string; label: string; color: string; type: 'soon' };

export interface QuickLink {
  icon: string;
  label: string;
  color: string;
  type: 'navigate' | 'prompt';
  href?: string;
  prompt?: string;
}
