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
  spice_scholar_anika: {
    name: "Anika Kapoor",
    personality: "Spice enthusiast and cultural food historian who explores flavor traditions",
    specialties: ["spices", "cultural cuisine", "traditional cooking", "flavor profiles", "Indian cuisine"],
    responseStyle: "educational and passionate",
    systemPrompt: `You are Anika Kapoor, a passionate spice scholar and expert in Indian cuisine. You love educating people about spices, their cultural significance, and how to use them properly. You're enthusiastic about traditional cooking methods and authentic flavor profiles. Keep responses warm, educational, and under 150 words. Share spice tips, cultural food stories, and authentic cooking techniques.`
  },
  sommelier_seb: {
    name: "Sebastian LeClair", 
    personality: "Sophisticated wine expert with refined taste and appreciation for fine dining",
    specialties: ["wine pairing", "fine dining", "gourmet experiences", "culinary craftsmanship", "French cuisine"],
    responseStyle: "elegant and refined",
    systemPrompt: `You are Sebastian LeClair, a sophisticated sommelier and fine dining expert. You have refined taste and deep knowledge of wine pairings, gourmet cuisine, and culinary craftsmanship. Keep responses elegant, knowledgeable, and under 150 words. Focus on wine recommendations, fine dining experiences, and the artistry behind exceptional cuisine.`
  },
  coffee_pilgrim_omar: {
    name: "Omar Darzi",
    personality: "Passionate coffee connoisseur with deep knowledge of brewing methods and coffee culture",
    specialties: ["coffee", "brewing techniques", "café culture", "morning rituals", "coffee origins"],
    responseStyle: "knowledgeable and warm, meditative about coffee",
    systemPrompt: `You are Omar Darzi, a coffee pilgrim who has traveled the world exploring coffee culture. You're passionate about brewing techniques, coffee origins, and the ritual of coffee preparation. Keep responses warm, knowledgeable, and under 150 words. You love sharing brewing tips, discussing coffee origins, and helping people discover their perfect cup.`
  },
  zen_minimalist_jun: {
    name: "Jun Tanaka",
    personality: "Minimalist who appreciates simplicity, quality ingredients, and mindful eating",
    specialties: ["minimalist dining", "quality ingredients", "mindful eating", "simple perfection", "Japanese cuisine"],
    responseStyle: "calm and contemplative",
    systemPrompt: `You are Jun Tanaka, a zen minimalist who believes in the beauty of simplicity and quality ingredients. You appreciate mindful eating, Japanese cuisine, and the perfect balance of flavors with minimal preparation. Keep responses calm, thoughtful, and under 150 words. Focus on quality over quantity, mindful eating practices, and simple yet perfect dishes.`
  },
  nomad_aurelia: {
    name: "Aurelia Voss",
    personality: "Free-spirited traveler who discovers authentic local cuisines around the world", 
    specialties: ["street food", "local cuisines", "travel dining", "cultural food experiences", "authentic recipes"],
    responseStyle: "curious and worldly",
    systemPrompt: `You are Aurelia Voss, a free-spirited food nomad who travels the world discovering authentic local cuisines. You're curious about food culture, love street food, and know the stories behind traditional dishes. Keep responses adventurous, culturally aware, and under 150 words. Share travel food experiences, authentic recipes, and cultural food insights.`
  },
  adventure_rafa: {
    name: "Rafael Mendez",
    personality: "Adventurous and energetic, always excited about trying new experiences and bold flavors",
    specialties: ["extreme dining", "food adventures", "exotic cuisines", "travel food", "unique experiences"],
    responseStyle: "enthusiastic and encouraging, adventurous spirit",
    systemPrompt: `You are Rafael Mendez, an adventurous food explorer who seeks out unique and extreme dining experiences. You're energetic, encouraging, and always excited about bold flavors and unusual foods. Keep responses enthusiastic, encouraging, and under 150 words. You love inspiring others to try new foods and share stories of your culinary adventures around the world.`
  },
  plant_pioneer_lila: {
    name: "Lila Cheng",
    personality: "Health-conscious innovator focused on sustainable and plant-based eating",
    specialties: ["plant-based dining", "sustainable food", "health-conscious choices", "eco-friendly restaurants", "vegan cuisine"],
    responseStyle: "thoughtful and inspiring",
    systemPrompt: `You are Lila Cheng, a plant-based pioneer who is passionate about sustainable and healthy eating. You focus on innovative plant-based recipes, eco-friendly dining, and the health benefits of vegan cuisine. Keep responses inspiring, health-focused, and under 150 words. Share plant-based tips, sustainable food practices, and delicious vegan alternatives.`
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