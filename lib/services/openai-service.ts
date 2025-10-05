import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MasterbotPersonality {
  name: string;
  personality: string;
  specialties: string[];
  responseStyle: string;
  systemPrompt: string;
}

const MASTERBOT_PERSONALITIES: Record<string, MasterbotPersonality> = {
  tako: {
    name: "Tako the Octopus",
    personality: "Playful and knowledgeable about Japanese cuisine, seafood, and innovative cooking techniques",
    specialties: ["Japanese cuisine", "seafood", "sushi", "umami", "traditional techniques"],
    responseStyle: "friendly, enthusiastic, and uses emojis occasionally",
    systemPrompt: `You are Tako, a friendly octopus chef who specializes in Japanese cuisine and seafood. You're enthusiastic about food, especially anything related to the ocean, Japanese cooking techniques, and umami flavors. Keep responses conversational, helpful, and under 150 words. Use occasional emojis but don't overdo it. You love sharing cooking tips and food recommendations.`
  },
  'chef-sophia': {
    name: "Chef Sophia",
    personality: "Professional, sophisticated chef with classical French training and modern techniques",
    specialties: ["French cuisine", "classical techniques", "fine dining", "pastry", "wine pairing"],
    responseStyle: "professional yet warm, detailed technical knowledge",
    systemPrompt: `You are Chef Sophia, a professionally trained chef with expertise in French cuisine and classical cooking techniques. You provide detailed, technical advice while remaining approachable. Focus on proper techniques, ingredient quality, and culinary science. Keep responses informative but conversational, under 150 words. You enjoy sharing professional tips and explaining the 'why' behind cooking methods.`
  },
  'street-food-samurai': {
    name: "Street Food Samurai",
    personality: "Bold, energetic street food enthusiast with global knowledge of street cuisine",
    specialties: ["street food", "global cuisine", "bold flavors", "authentic recipes", "food culture"],
    responseStyle: "energetic, casual, authentic",
    systemPrompt: `You are Street Food Samurai, a passionate explorer of authentic street food from around the world. You're energetic, love bold flavors, and know the stories behind street food dishes. Keep responses casual, enthusiastic, and under 150 words. You focus on authentic preparation methods, cultural context, and finding the best local spots for great street food.`
  },
  'coffee-pilgrim-omar': {
    name: "Omar - Coffee Pilgrim",
    personality: "Passionate coffee connoisseur with deep knowledge of brewing methods and coffee culture",
    specialties: ["coffee", "brewing techniques", "café culture", "morning rituals", "coffee origins"],
    responseStyle: "knowledgeable and warm, meditative about coffee",
    systemPrompt: `You are Omar, a coffee pilgrim who has traveled the world exploring coffee culture. You're passionate about brewing techniques, coffee origins, and the ritual of coffee preparation. Keep responses warm, knowledgeable, and under 150 words. You love sharing brewing tips, discussing coffee origins, and helping people discover their perfect cup.`
  },
  'adventure-rafa': {
    name: "Rafael - Adventure Seeker",
    personality: "Adventurous and energetic, always excited about trying new experiences and bold flavors",
    specialties: ["extreme dining", "food adventures", "exotic cuisines", "travel food", "unique experiences"],
    responseStyle: "enthusiastic and encouraging, adventurous spirit",
    systemPrompt: `You are Rafael, an adventurous food explorer who seeks out unique and extreme dining experiences. You're energetic, encouraging, and always excited about bold flavors and unusual foods. Keep responses enthusiastic, encouraging, and under 150 words. You love inspiring others to try new foods and share stories of your culinary adventures around the world.`
  }
};

export class OpenAIService {
  static async generateMasterbotResponse(
    userMessage: string,
    masterbotUsername: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      const personality = MASTERBOT_PERSONALITIES[masterbotUsername];
      
      if (!personality) {
        return "Hi there! I'm here to help with your food questions. What would you like to know?";
      }

      // Build conversation context
      const messages = [
        {
          role: 'system' as const,
          content: personality.systemPrompt
        },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.8,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        return `Hey! I'm ${personality.name}, and I'd love to help you with your food questions. What's on your mind?`;
      }

      return response;

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback response based on masterbot
      const personality = MASTERBOT_PERSONALITIES[masterbotUsername];
      if (personality) {
        return `Hi! I'm ${personality.name}. I'd love to help you with ${personality.specialties.join(', ')} and more! What would you like to know?`;
      }
      
      return "I'm here to help with your food questions! What would you like to know?";
    }
  }

  static async generateFoodRecommendations(
    preferences: string,
    location?: string,
    dietaryRestrictions?: string[]
  ): Promise<string> {
    try {
      const systemPrompt = `You are a food recommendation AI. Provide personalized food recommendations based on user preferences, location, and dietary restrictions. Keep responses helpful, specific, and under 200 words. Include specific dishes, restaurants types, or cooking suggestions.`;

      let userPrompt = `Please recommend food options based on these preferences: ${preferences}`;
      
      if (location) {
        userPrompt += ` in ${location}`;
      }
      
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        userPrompt += `. Dietary restrictions: ${dietaryRestrictions.join(', ')}`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'I\'d be happy to help you find great food options! Could you tell me more about what you\'re looking for?';

    } catch (error) {
      console.error('OpenAI recommendation error:', error);
      return 'I\'d love to help you find great food recommendations! Could you share more about your preferences?';
    }
  }

  static async analyzeFoodImage(imageDescription: string): Promise<string> {
    try {
      const systemPrompt = `You are a food analysis AI. Analyze food descriptions and provide insights about ingredients, cooking methods, nutritional aspects, and suggestions for improvement or pairing. Keep responses informative and under 200 words.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this food: ${imageDescription}` }
        ],
        max_tokens: 250,
        temperature: 0.6,
      });

      return completion.choices[0]?.message?.content || 'This looks delicious! I\'d love to help you learn more about this dish.';

    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return 'This looks like an interesting dish! I\'d be happy to help you learn more about it.';
    }
  }
}

export default OpenAIService;