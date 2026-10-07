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

// Tako's landing screen (client, 2026-10-07): three big starting points
// (Eat out / Cook / Explore); picking one opens its options underneath.
// Each option either opens an app page, starts a Tako conversation with a
// ready-made question, or opens Create a card.
export type TakoAction =
  | { type: 'navigate'; href: string }
  | { type: 'prompt'; prompt: string }
  | { type: 'create-card' };

export interface TakoOption {
  /** Colour illustration from /public/SVG. */
  icon: string;
  label: string;
  action: TakoAction;
}

export interface TakoGroup {
  id: 'eat' | 'cook' | 'explore';
  label: string;
  sub: string;
  /** Light and dark end of the 3D ball behind the group's icon. */
  tint: [string, string];
  options: TakoOption[];
}
