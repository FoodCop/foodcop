/**
 * OpenAI Integration for Master Bot Content Generation
 * Generates personalized posts matching each bot's personality
 */

interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  retryDelay: number;
}

export interface BotPersonality {
  botId: string;
  botName: string;
  personalityType: string;
  specialties: string[];
  systemPrompt: string;
  voice: string;
  contentStyle: string;
}

export interface ContentGenerationRequest {
  bot: BotPersonality;
  contentType: "restaurant" | "recipe";
  entity: any; // Restaurant or Recipe data
  previousPosts?: string[]; // For avoiding repetition
}

export interface GeneratedContent {
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
  ctaLabel: string;
  ctaUrl: string;
  metadata: {
    tokensUsed: number;
    model: string;
    temperature: number;
    generatedAt: string;
    botPersonality: string;
  };
}

class OpenAIClient {
  private config: OpenAIConfig | null = null;

  private getConfig(): OpenAIConfig {
    if (!this.config) {
      this.config = {
        apiKey: this.getApiKey(),
        baseUrl: "https://api.openai.com/v1",
        maxRetries: 3,
        retryDelay: 1000,
      };
    }
    return this.config;
  }

  private getApiKey(): string {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    return apiKey;
  }

  private async makeRequest<T>(endpoint: string, body: any): Promise<T> {
    const config = this.getConfig();
    const url = `${config.baseUrl}${endpoint}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`🤖 OpenAI API Request (Attempt ${attempt}): ${endpoint}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `OpenAI API error: ${response.status} ${response.statusText} - ${
              errorData.error?.message || "Unknown error"
            }`
          );
        }

        const data = await response.json();
        console.log(`✅ OpenAI API Success: ${endpoint}`);
        return data;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ OpenAI API error (Attempt ${attempt}):`, error);

        if (attempt < config.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.retryDelay * attempt)
          );
        }
      }
    }

    throw new Error(
      `OpenAI API failed after ${config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Generate content for a restaurant post
   */
  async generateRestaurantPost(
    bot: BotPersonality,
    restaurant: any,
    previousPosts: string[] = []
  ): Promise<GeneratedContent> {
    const systemPrompt = this.buildRestaurantSystemPrompt(bot);
    const userPrompt = this.buildRestaurantUserPrompt(
      restaurant,
      previousPosts
    );

    const response = await this.makeRequest<any>("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(response.choices[0].message.content);

    return {
      title: content.title,
      subtitle: content.subtitle,
      content: content.content,
      tags: content.tags || [],
      ctaLabel: content.ctaLabel || "View Restaurant",
      ctaUrl: restaurant.google_url || restaurant.website || "#",
      metadata: {
        tokensUsed: response.usage.total_tokens,
        model: "gpt-4o-mini",
        temperature: 0.7,
        generatedAt: new Date().toISOString(),
        botPersonality: bot.personalityType,
      },
    };
  }

  /**
   * Generate content for a recipe post
   */
  async generateRecipePost(
    bot: BotPersonality,
    recipe: any,
    previousPosts: string[] = []
  ): Promise<GeneratedContent> {
    const systemPrompt = this.buildRecipeSystemPrompt(bot);
    const userPrompt = this.buildRecipeUserPrompt(recipe, previousPosts);

    const response = await this.makeRequest<any>("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(response.choices[0].message.content);

    return {
      title: content.title,
      subtitle: content.subtitle,
      content: content.content,
      tags: content.tags || [],
      ctaLabel: content.ctaLabel || "Try Recipe",
      ctaUrl: recipe.source_url || "#",
      metadata: {
        tokensUsed: response.usage.total_tokens,
        model: "gpt-4o-mini",
        temperature: 0.7,
        generatedAt: new Date().toISOString(),
        botPersonality: bot.personalityType,
      },
    };
  }

  /**
   * Build system prompt for restaurant content generation
   */
  private buildRestaurantSystemPrompt(bot: BotPersonality): string {
    return `You are ${bot.botName}, a ${bot.personalityType} Master Bot on FUZO.

Your personality: ${bot.voice}
Content style: ${bot.contentStyle}
Specialties: ${bot.specialties.join(", ")}

Write restaurant reviews that match your unique voice and expertise.

Response format (JSON):
{
  "title": "Engaging restaurant review title (max 60 chars)",
  "subtitle": "Brief descriptive subtitle (max 80 chars)",
  "content": "Your personal review in your authentic voice (max 200 words)",
  "tags": ["relevant", "tags", "array"],
  "ctaLabel": "Action button text (max 20 chars)"
}

Guidelines:
- Write in first person as ${bot.botName}
- Focus on your specialty: ${bot.specialties[0]}
- Be specific and authentic, not generic
- Include personal insights and expertise
- Use your unique voice and style
- Keep titles punchy and engaging
- Make content scannable and mobile-friendly
- Always include relevant tags for discovery`;
  }

  /**
   * Build system prompt for recipe content generation
   */
  private buildRecipeSystemPrompt(bot: BotPersonality): string {
    return `You are ${bot.botName}, a ${bot.personalityType} Master Bot on FUZO.

Your personality: ${bot.voice}
Content style: ${bot.contentStyle}
Specialties: ${bot.specialties.join(", ")}

Share recipes that align with your expertise and cooking philosophy.

Response format (JSON):
{
  "title": "Compelling recipe title with your perspective (max 60 chars)",
  "subtitle": "Why this recipe fits your specialty (max 80 chars)",
  "content": "Your personal take on the recipe in your voice (max 200 words)",
  "tags": ["cuisine", "diet", "difficulty", "time"],
  "ctaLabel": "Action button text (max 20 chars)"
}

Guidelines:
- Write as ${bot.botName} sharing your favorite recipes
- Connect recipe to your specialty: ${bot.specialties[0]}
- Share cooking tips and personal insights
- Mention health benefits when relevant
- Use your authentic voice and expertise
- Focus on why YOU recommend this recipe
- Include practical cooking advice
- Make it personal and relatable`;
  }

  /**
   * Build user prompt for restaurant content
   */
  private buildRestaurantUserPrompt(
    restaurant: any,
    previousPosts: string[]
  ): string {
    const avoidContent =
      previousPosts.length > 0
        ? `\n\nAvoid repeating these themes from previous posts: ${previousPosts.join(
            ", "
          )}`
        : "";

    return `Review this restaurant:

Name: ${restaurant.name}
Location: ${restaurant.city}, ${restaurant.country}
Cuisine: ${restaurant.categories?.join(", ") || "Not specified"}
Rating: ${restaurant.rating}/5 (${restaurant.reviews_count} reviews)
Price: ${
      restaurant.price_level
        ? "$".repeat(restaurant.price_level)
        : "Not specified"
    }
Description: ${restaurant.description || "No description available"}

Google URL: ${restaurant.google_url || "Not available"}

Write a review that showcases your expertise and personality.${avoidContent}

Focus on aspects that matter to your specialty and would interest your followers.`;
  }

  /**
   * Build user prompt for recipe content
   */
  private buildRecipeUserPrompt(recipe: any, previousPosts: string[]): string {
    const avoidContent =
      previousPosts.length > 0
        ? `\n\nAvoid repeating these themes from previous posts: ${previousPosts.join(
            ", "
          )}`
        : "";

    return `Share this recipe:

Title: ${recipe.title}
Ready in: ${recipe.ready_in_minutes} minutes
Servings: ${recipe.servings}
Health Score: ${recipe.health_score}/100
Cuisines: ${recipe.cuisines?.join(", ") || "Various"}
Diets: ${recipe.diets?.join(", ") || "Standard"}
Key Ingredients: ${
      recipe.ingredients
        ?.slice(0, 5)
        ?.map((ing: any) => ing.name)
        ?.join(", ") || "Various"
    }

Summary: ${recipe.summary?.replace(/<[^>]*>/g, "") || "Delicious recipe to try"}

Source URL: ${recipe.source_url || "Not available"}

Share why you love this recipe and how it fits your cooking philosophy.${avoidContent}

Include your personal tips and what makes this special for your followers.`;
  }
}

/**
 * Bot personality definitions matching our Master Bots
 */
export const BOT_PERSONALITIES: Record<string, Partial<BotPersonality>> = {
  street_food_sophie: {
    personalityType: "Street Food Explorer",
    voice: "Adventurous, authentic, enthusiastic about local culture",
    contentStyle: "Energetic and discovery-focused, celebrating hidden gems",
    specialties: ["Street Food Explorer"],
  },
  fine_dining_sebastian: {
    personalityType: "Fine Dining Expert",
    voice: "Sophisticated, detailed, focused on technique and tradition",
    contentStyle: "Refined and educational, appreciating culinary artistry",
    specialties: ["Fine Dining Expert"],
  },
  vegan_lila: {
    personalityType: "Vegan Specialist",
    voice: "Conscious, innovative, sustainability-focused",
    contentStyle:
      "Inspiring and health-conscious, promoting plant-based living",
    specialties: ["Vegan Specialist"],
  },
  adventure_rafael: {
    personalityType: "Adventure Foodie",
    voice: "Energetic, adventure-seeking, scenery-appreciative",
    contentStyle: "Bold and exploration-driven, seeking unique experiences",
    specialties: ["Adventure Foodie"],
  },
  spice_anika: {
    personalityType: "Indian/Asian Expert",
    voice: "Knowledgeable, traditional, spice-focused",
    contentStyle:
      "Educational and culturally rich, mastering authentic flavors",
    specialties: ["Indian/Asian Expert"],
  },
  coffee_omar: {
    personalityType: "Coffee Culture Expert",
    voice: "Contemplative, craft-focused, culture-documenting",
    contentStyle:
      "Thoughtful and artisanal, appreciating brewing craftsmanship",
    specialties: ["Coffee Culture Expert"],
  },
  zen_jun: {
    personalityType: "Japanese Master",
    voice: "Minimalist, philosophical, tradition-respecting",
    contentStyle: "Serene and precision-focused, honoring culinary traditions",
    specialties: ["Japanese Master"],
  },
};

// Export singleton instance
export const openaiClient = new OpenAIClient();

// Export for testing
export { OpenAIClient };
