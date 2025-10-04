import { createServerClient } from "@supabase/ssr";

interface MasterbotInteraction {
  id: string;
  masterbot_id: string;
  user_id: string;
  interaction_type: string;
  context: any;
  response_status: string;
  created_at: string;
  masterbot: {
    username: string;
    display_name: string;
  };
  user: {
    username: string;
    display_name: string;
  };
}

interface MasterbotPersonality {
  name: string;
  personality: string;
  specialties: string[];
  responseStyle: string;
}

const MASTERBOT_PERSONALITIES: Record<string, MasterbotPersonality> = {
  adventure_rafa: {
    name: "Rafael Mendez",
    personality: "Adventurous and energetic, always excited about trying new experiences and bold flavors",
    specialties: ["extreme dining", "food adventures", "exotic cuisines", "travel food"],
    responseStyle: "enthusiastic and encouraging"
  },
  coffee_pilgrim_omar: {
    name: "Omar Darzi", 
    personality: "Passionate coffee connoisseur with deep knowledge of brewing methods and coffee culture",
    specialties: ["coffee", "brewing techniques", "café culture", "morning rituals"],
    responseStyle: "knowledgeable and warm"
  },
  nomad_aurelia: {
    name: "Aurelia Voss",
    personality: "Free-spirited traveler who discovers authentic local cuisines around the world", 
    specialties: ["street food", "local cuisines", "travel dining", "cultural food experiences"],
    responseStyle: "curious and worldly"
  },
  plant_pioneer_lila: {
    name: "Lila Cheng",
    personality: "Health-conscious innovator focused on sustainable and plant-based eating",
    specialties: ["plant-based dining", "sustainable food", "health-conscious choices", "eco-friendly restaurants"],
    responseStyle: "thoughtful and inspiring"
  },
  sommelier_seb: {
    name: "Sebastian LeClair", 
    personality: "Sophisticated wine expert with refined taste and appreciation for fine dining",
    specialties: ["wine pairing", "fine dining", "gourmet experiences", "culinary craftsmanship"],
    responseStyle: "elegant and refined"
  },
  spice_scholar_anika: {
    name: "Anika Kapoor",
    personality: "Spice enthusiast and cultural food historian who explores flavor traditions",
    specialties: ["spices", "cultural cuisine", "traditional cooking", "flavor profiles"],
    responseStyle: "educational and passionate"
  },
  zen_minimalist_jun: {
    name: "Jun Tanaka",
    personality: "Minimalist who appreciates simplicity, quality ingredients, and mindful eating",
    specialties: ["minimalist dining", "quality ingredients", "mindful eating", "simple perfection"],
    responseStyle: "calm and contemplative"
  }
};

export class MasterbotAIService {
  private supabase;

  constructor() {
    this.supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {}
        }
      }
    );
  }

  async processPendingInteractions(): Promise<number> {
    try {
      // Fetch pending interactions directly from Supabase
      const { data: interactions, error } = await this.supabase
        .from('masterbot_interactions')
        .select(`
          *,
          masterbot:users!masterbot_id(username, display_name),
          user:users!user_id(username, display_name)
        `)
        .eq('response_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error('Error fetching masterbot interactions:', error);
        return 0;
      }

      let processedCount = 0;

      for (const interaction of interactions || []) {
        try {
          await this.processInteraction(interaction);
          processedCount++;
        } catch (error) {
          console.error(`Failed to process interaction ${interaction.id}:`, error);
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Error processing masterbot interactions:', error);
      return 0;
    }
  }

  private async processInteraction(interaction: MasterbotInteraction): Promise<void> {
    const personality = MASTERBOT_PERSONALITIES[interaction.masterbot.username];
    
    if (!personality) {
      console.warn(`No personality found for masterbot: ${interaction.masterbot.username}`);
      return;
    }

    let responseData: any = {};

    switch (interaction.interaction_type) {
      case 'share_received':
        responseData = await this.generateShareResponse(interaction, personality);
        break;
      case 'friend_request':
        responseData = await this.generateFriendRequestResponse(interaction, personality);
        break;
      case 'plate_view':
        responseData = await this.generatePlateViewResponse(interaction, personality);
        break;
      default:
        responseData = { message: 'Interaction acknowledged' };
    }

    // Update the interaction status directly
    const { error } = await this.supabase
      .from('masterbot_interactions')
      .update({
        response_status: 'responded',
        response_data: responseData,
        processed_at: new Date().toISOString()
      })
      .eq('id', interaction.id);

    if (error) {
      console.error('Error updating interaction:', error);
      throw error;
    }
  }

  private async generateShareResponse(
    interaction: MasterbotInteraction, 
    personality: MasterbotPersonality
  ): Promise<any> {
    // This is where you'd integrate with AI services like OpenAI
    // For now, we'll generate simple templated responses
    
    const responses = [
      `Thanks for sharing this with me, ${interaction.user.display_name}! This looks right up my alley.`,
      `Wow, this looks amazing! I need to check this place out soon.`,
      `Great find! This is exactly the kind of spot I love discovering.`,
      `Thanks for thinking of me! This is definitely going on my must-try list.`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      type: 'share_acknowledgment',
      message: randomResponse,
      personality_note: `Response in ${personality.responseStyle} style`,
      specialties_match: this.checkSpecialtiesMatch(interaction.context, personality.specialties)
    };
  }

  private async generateFriendRequestResponse(
    interaction: MasterbotInteraction,
    personality: MasterbotPersonality
  ): Promise<any> {
    return {
      type: 'friend_welcome',
      message: `Welcome to my food journey, ${interaction.user.display_name}! Looking forward to sharing great discoveries with you.`,
      personality_note: `Welcome in ${personality.responseStyle} style`
    };
  }

  private async generatePlateViewResponse(
    interaction: MasterbotInteraction,
    personality: MasterbotPersonality
  ): Promise<any> {
    return {
      type: 'plate_interest',
      message: `Checking out your food adventures! Some great choices there.`,
      personality_note: `Comment in ${personality.responseStyle} style`
    };
  }

  private checkSpecialtiesMatch(context: any, specialties: string[]): string[] {
    // Simple keyword matching - in a real implementation you'd use more sophisticated NLP
    const contextString = JSON.stringify(context).toLowerCase();
    return specialties.filter(specialty => 
      contextString.includes(specialty.toLowerCase())
    );
  }

  // Method to manually trigger an interaction for testing
  async triggerTestInteraction(masterbotUsername: string, userUsername: string): Promise<boolean> {
    try {
      // Get user IDs
      const { data: users, error } = await this.supabase
        .from('users')
        .select('id, username')
        .in('username', [masterbotUsername, userUsername]);

      if (error || !users || users.length !== 2) {
        throw new Error('Users not found');
      }

      const masterbot = users.find(u => u.username === masterbotUsername);
      const user = users.find(u => u.username === userUsername);

      if (!masterbot || !user) {
        throw new Error('Could not match users');
      }

      // Create a test interaction
      const { error: insertError } = await this.supabase
        .rpc('trigger_masterbot_interaction', {
          p_masterbot_id: masterbot.id,
          p_user_id: user.id,
          p_interaction_type: 'share_received',
          p_context: {
            test: true,
            message: 'Test interaction for AI activation'
          }
        });

      if (insertError) {
        throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error triggering test interaction:', error);
      return false;
    }
  }
}

export const masterbotAI = new MasterbotAIService();