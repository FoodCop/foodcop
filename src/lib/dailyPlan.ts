/**
 * Daily Plan Engine for Master Bot Content Generation
 * Automatically generates fresh restaurant and recipe posts for each bot
 * Implements 90-day rotation to prevent repetition
 */

import { createClient } from "@supabase/supabase-js";
import { BOT_PERSONALITIES, openaiClient } from "./openai.js";

interface DailyPlanConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  enableExecution: boolean;
  testMode: boolean;
}

interface MasterBot {
  id: string;
  username: string;
  display_name: string;
  personality_type: string;
  specialties: string[];
}

interface GenerationResult {
  botId: string;
  botName: string;
  restaurantPost?: {
    postId: string;
    title: string;
  };
  recipePost?: {
    postId: string;
    title: string;
  };
  errors: string[];
  executionTimeMs: number;
  tokensUsed: number;
}

interface DailyPlanResults {
  executionDate: string;
  totalBots: number;
  successfulBots: number;
  failedBots: number;
  totalPosts: number;
  totalTokens: number;
  totalExecutionTimeMs: number;
  results: GenerationResult[];
  errors: string[];
}

class DailyPlanEngine {
  private supabase: any;
  private config: DailyPlanConfig;

  constructor(config: DailyPlanConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  /**
   * Execute daily plan for all Master Bots
   */
  async executeDailyPlan(): Promise<DailyPlanResults> {
    const startTime = Date.now();
    const executionDate = new Date().toISOString().split("T")[0];

    console.log(`🚀 Starting Daily Plan Execution for ${executionDate}`);
    console.log(`⚙️ Test Mode: ${this.config.testMode}`);
    console.log(`💾 Write to Database: ${this.config.enableExecution}`);

    const results: DailyPlanResults = {
      executionDate,
      totalBots: 0,
      successfulBots: 0,
      failedBots: 0,
      totalPosts: 0,
      totalTokens: 0,
      totalExecutionTimeMs: 0,
      results: [],
      errors: [],
    };

    try {
      // Check if today's plan has already been executed
      if (!this.config.testMode) {
        const alreadyExecuted = await this.checkDailyIdempotency(executionDate);
        if (alreadyExecuted) {
          console.log(`✅ Daily plan for ${executionDate} already executed`);
          return results;
        }
      }

      // Get all active Master Bots
      const bots = await this.getActiveMasterBots();
      results.totalBots = bots.length;

      console.log(`🤖 Found ${bots.length} active Master Bots`);

      // Generate content for each bot
      for (const bot of bots) {
        const botResult = await this.generateBotContent(bot, executionDate);
        results.results.push(botResult);

        if (botResult.errors.length === 0) {
          results.successfulBots++;
          results.totalPosts +=
            (botResult.restaurantPost ? 1 : 0) + (botResult.recipePost ? 1 : 0);
        } else {
          results.failedBots++;
          results.errors.push(...botResult.errors);
        }

        results.totalTokens += botResult.tokensUsed;
        results.totalExecutionTimeMs += botResult.executionTimeMs;
      }

      results.totalExecutionTimeMs = Date.now() - startTime;

      console.log(`🎉 Daily Plan Complete!`);
      console.log(
        `📊 Results: ${results.successfulBots}/${results.totalBots} bots successful`
      );
      console.log(`📝 Generated: ${results.totalPosts} posts`);
      console.log(`🤖 AI Tokens: ${results.totalTokens}`);
      console.log(`⏱️ Execution Time: ${results.totalExecutionTimeMs}ms`);
    } catch (error) {
      console.error(`💥 Daily Plan Failed:`, error);
      results.errors.push(`Daily plan execution failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Generate content for a single bot (restaurant + recipe post)
   */
  private async generateBotContent(
    bot: MasterBot,
    executionDate: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      botId: bot.id,
      botName: bot.display_name,
      errors: [],
      executionTimeMs: 0,
      tokensUsed: 0,
    };

    console.log(
      `\n🤖 Generating content for ${bot.display_name} (${bot.personality_type})`
    );

    try {
      // Check if this bot already has posts for today
      if (!this.config.testMode) {
        const existingLog = await this.getBotGenerationLog(
          bot.id,
          executionDate
        );
        if (existingLog) {
          console.log(`✅ ${bot.display_name} already has content for today`);
          return result;
        }
      }

      // Get bot specialty for content filtering
      const primarySpecialty = this.getBotSpecialtyTag(bot);

      // Generate restaurant post
      try {
        const restaurantPost = await this.generateRestaurantPost(
          bot,
          primarySpecialty
        );
        result.restaurantPost = restaurantPost;
        result.tokensUsed += restaurantPost.tokensUsed || 0;
        console.log(`✅ Restaurant post: "${restaurantPost.title}"`);
      } catch (error) {
        console.error(`❌ Restaurant post failed: ${error.message}`);
        result.errors.push(`Restaurant post: ${error.message}`);
      }

      // Generate recipe post
      try {
        const recipePost = await this.generateRecipePost(bot, primarySpecialty);
        result.recipePost = recipePost;
        result.tokensUsed += recipePost.tokensUsed || 0;
        console.log(`✅ Recipe post: "${recipePost.title}"`);
      } catch (error) {
        console.error(`❌ Recipe post failed: ${error.message}`);
        result.errors.push(`Recipe post: ${error.message}`);
      }

      // Log the generation attempt
      if (this.config.enableExecution && !this.config.testMode) {
        await this.logBotGeneration(bot.id, executionDate, result);
      }
    } catch (error) {
      console.error(
        `💥 Bot content generation failed for ${bot.display_name}:`,
        error
      );
      result.errors.push(`Bot generation failed: ${error.message}`);
    }

    result.executionTimeMs = Date.now() - startTime;
    return result;
  }

  /**
   * Generate a restaurant post for a bot
   */
  private async generateRestaurantPost(bot: MasterBot, specialty: string) {
    console.log(`🍽️ Finding restaurant for ${specialty} specialty...`);

    // Get available restaurant (avoiding 90-day history) - try with tags first, then fallback to any
    let { data: restaurants, error } = await this.supabase.rpc(
      "get_available_restaurant_for_bot",
      {
        p_bot_id: bot.id,
        p_tags: [specialty],
        p_exclude_days: 90,
      }
    );

    // If no restaurants found with specific tags, try without tag filtering
    if (error || !restaurants || restaurants.length === 0) {
      console.log(
        `🔄 No restaurants found for ${specialty}, trying without specialty filtering...`
      );
      const result = await this.supabase.rpc(
        "get_available_restaurant_for_bot",
        {
          p_bot_id: bot.id,
          p_tags: null,
          p_exclude_days: 90,
        }
      );
      restaurants = result.data;
      error = result.error;
    }

    if (error || !restaurants || restaurants.length === 0) {
      throw new Error(`No available restaurants found for ${specialty}`);
    }

    const restaurant = restaurants[0];
    console.log(`🎯 Selected: ${restaurant.name} (${restaurant.rating}⭐)`);

    // Get OpenAI prompt for this bot
    const { data: prompts } = await this.supabase
      .from("openai_prompts")
      .select("*")
      .eq("bot_id", bot.id)
      .eq("content_type", "restaurant")
      .eq("is_active", true)
      .single();

    if (!prompts) {
      throw new Error(`No restaurant prompt found for bot ${bot.display_name}`);
    }

    // Generate AI content
    const botPersonality = {
      botId: bot.id,
      botName: bot.display_name,
      personalityType: bot.personality_type,
      specialties: bot.specialties,
      systemPrompt: prompts.system_prompt,
      voice:
        BOT_PERSONALITIES[bot.username]?.voice || "Authentic and knowledgeable",
      contentStyle:
        BOT_PERSONALITIES[bot.username]?.contentStyle ||
        "Engaging and informative",
    };

    const generatedContent = await openaiClient.generateRestaurantPost(
      botPersonality,
      restaurant.restaurant_data
    );

    // Create bot post
    let postId = null;
    if (this.config.enableExecution) {
      const { data: post, error: postError } = await this.supabase
        .from("bot_posts")
        .insert({
          bot_id: bot.id,
          kind: "restaurant",
          title: generatedContent.title,
          subtitle: generatedContent.subtitle,
          content: generatedContent.content,
          restaurant_data: restaurant.restaurant_data,
          restaurant_place_id: restaurant.place_id,
          image_url: restaurant.restaurant_data.image_url,
          hero_url: restaurant.restaurant_data.image_url,
          tags: generatedContent.tags,
          cta_label: generatedContent.ctaLabel,
          cta_url: generatedContent.ctaUrl,
          is_automated: true,
          ai_metadata: generatedContent.metadata,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (postError) {
        throw new Error(`Failed to save restaurant post: ${postError.message}`);
      }

      postId = post.id;

      // Record in bot history
      await this.supabase.rpc("record_bot_history", {
        p_bot_id: bot.id,
        p_entity_ref: restaurant.place_id,
        p_entity_kind: "restaurant",
      });
    }

    return {
      postId,
      title: generatedContent.title,
      tokensUsed: generatedContent.metadata.tokensUsed,
    };
  }

  /**
   * Generate a recipe post for a bot
   */
  private async generateRecipePost(bot: MasterBot, specialty: string) {
    console.log(`🍳 Finding recipe for ${specialty} specialty...`);

    // Get bot specialty filters
    const { data: tagMap } = await this.supabase
      .from("tags_map")
      .select("recipe_filters")
      .eq("tag", specialty)
      .single();

    const filters = tagMap?.recipe_filters || {};

    // Get available recipe (avoiding 90-day history) - try with filters first, then fallback
    let { data: recipes, error } = await this.supabase.rpc(
      "get_available_recipe_for_bot",
      {
        p_bot_id: bot.id,
        p_cuisines: filters.cuisines || null,
        p_diets: filters.diets || null,
        p_exclude_days: 90,
      }
    );

    // If no recipes found with specific filters, try without filtering
    if (error || !recipes || recipes.length === 0) {
      console.log(
        `🔄 No recipes found for ${specialty}, trying without specialty filtering...`
      );
      const result = await this.supabase.rpc("get_available_recipe_for_bot", {
        p_bot_id: bot.id,
        p_cuisines: null,
        p_diets: null,
        p_exclude_days: 90,
      });
      recipes = result.data;
      error = result.error;
    }

    if (error || !recipes || recipes.length === 0) {
      throw new Error(`No available recipes found for ${specialty}`);
    }

    const recipe = recipes[0];
    console.log(
      `🎯 Selected: ${recipe.title} (Health: ${recipe.health_score})`
    );

    // Get OpenAI prompt for this bot
    const { data: prompts } = await this.supabase
      .from("openai_prompts")
      .select("*")
      .eq("bot_id", bot.id)
      .eq("content_type", "recipe")
      .eq("is_active", true)
      .single();

    if (!prompts) {
      throw new Error(`No recipe prompt found for bot ${bot.display_name}`);
    }

    // Generate AI content
    const botPersonality = {
      botId: bot.id,
      botName: bot.display_name,
      personalityType: bot.personality_type,
      specialties: bot.specialties,
      systemPrompt: prompts.system_prompt,
      voice:
        BOT_PERSONALITIES[bot.username]?.voice || "Authentic and knowledgeable",
      contentStyle:
        BOT_PERSONALITIES[bot.username]?.contentStyle ||
        "Engaging and informative",
    };

    const generatedContent = await openaiClient.generateRecipePost(
      botPersonality,
      recipe.recipe_data
    );

    // Create bot post
    let postId = null;
    if (this.config.enableExecution) {
      const { data: post, error: postError } = await this.supabase
        .from("bot_posts")
        .insert({
          bot_id: bot.id,
          kind: "recipe",
          title: generatedContent.title,
          subtitle: generatedContent.subtitle,
          content: generatedContent.content,
          recipe_data: recipe.recipe_data,
          image_url: recipe.recipe_data.image_url,
          hero_url: recipe.recipe_data.image_url,
          tags: generatedContent.tags,
          cta_label: generatedContent.ctaLabel,
          cta_url: generatedContent.ctaUrl,
          is_automated: true,
          ai_metadata: generatedContent.metadata,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (postError) {
        throw new Error(`Failed to save recipe post: ${postError.message}`);
      }

      postId = post.id;

      // Record in bot history
      await this.supabase.rpc("record_bot_history", {
        p_bot_id: bot.id,
        p_entity_ref: recipe.spoon_id.toString(),
        p_entity_kind: "recipe",
      });
    }

    return {
      postId,
      title: generatedContent.title,
      tokensUsed: generatedContent.metadata.tokensUsed,
    };
  }

  /**
   * Get all active Master Bots
   */
  private async getActiveMasterBots(): Promise<MasterBot[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select(
        `
        id,
        username,
        display_name,
        master_bots (
          personality_type,
          specialties,
          is_active
        )
      `
      )
      .eq("is_master_bot", true)
      .eq("master_bots.is_active", true);

    if (error) {
      throw new Error(`Failed to fetch Master Bots: ${error.message}`);
    }

    return data.map((bot) => ({
      id: bot.id,
      username: bot.username,
      display_name: bot.display_name,
      personality_type: bot.master_bots[0]?.personality_type,
      specialties: bot.master_bots[0]?.specialties || [],
    }));
  }

  /**
   * Get bot specialty tag from their specialties
   */
  private getBotSpecialtyTag(bot: MasterBot): string {
    const specialtyMap = {
      "Street Food Explorer": "street_food",
      "Fine Dining Expert": "fine_dining",
      "Vegan Specialist": "vegan",
      "Adventure Foodie": "bbq",
      "Indian/Asian Expert": "spicy",
      "Indian/Asian Cuisine Expert": "asian",
      "Coffee Culture Expert": "coffee",
      "Japanese Master": "japanese",
      "Japanese Cuisine Master": "japanese",
    };

    return specialtyMap[bot.personality_type] || "street_food";
  }

  /**
   * Check if daily plan has already been executed today
   */
  private async checkDailyIdempotency(executionDate: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("daily_generation_log")
      .select("id")
      .eq("generation_date", executionDate)
      .eq("status", "success");

    return !error && data && data.length > 0;
  }

  /**
   * Get existing generation log for a bot and date
   */
  private async getBotGenerationLog(botId: string, executionDate: string) {
    const { data, error } = await this.supabase
      .from("daily_generation_log")
      .select("*")
      .eq("bot_id", botId)
      .eq("generation_date", executionDate)
      .single();

    return error ? null : data;
  }

  /**
   * Log bot generation results
   */
  private async logBotGeneration(
    botId: string,
    executionDate: string,
    result: GenerationResult
  ) {
    const status = result.errors.length === 0 ? "success" : "failed";
    const postsGenerated =
      (result.restaurantPost ? 1 : 0) + (result.recipePost ? 1 : 0);

    await this.supabase.from("daily_generation_log").insert({
      generation_date: executionDate,
      bot_id: botId,
      status,
      posts_generated: postsGenerated,
      restaurant_post_id: result.restaurantPost?.postId,
      recipe_post_id: result.recipePost?.postId,
      error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
      execution_time_ms: result.executionTimeMs,
      ai_tokens_used: result.tokensUsed,
    });
  }
}

// Factory function for creating configured daily plan engine
export function createDailyPlanEngine(
  options: {
    testMode?: boolean;
    enableExecution?: boolean;
  } = {}
): DailyPlanEngine {
  const config: DailyPlanConfig = {
    supabaseUrl: process.env.VITE_SUPABASE_URL || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    enableExecution: options.enableExecution ?? true,
    testMode: options.testMode ?? false,
  };

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error("Supabase configuration is required");
  }

  return new DailyPlanEngine(config);
}

export { DailyPlanEngine };
export type { DailyPlanResults, GenerationResult };
