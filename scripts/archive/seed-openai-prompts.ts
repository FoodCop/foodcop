#!/usr/bin/env node

/**
 * OpenAI Prompts Seeding Script
 * Creates personality-based prompts for each Master Bot
 * Part of Master Bot Evolution Plan Phase 2B
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface BotPromptConfig {
  botId: string;
  botName: string;
  personalityType: string;
  specialties: string[];
  prompts: {
    restaurant: {
      systemPrompt: string;
      userPromptTemplate: string;
    };
    recipe: {
      systemPrompt: string;
      userPromptTemplate: string;
    };
  };
}

class OpenAIPromptSeeder {
  private botConfigs: BotPromptConfig[] = [];

  async seedAllBotPrompts() {
    console.log("🤖 Seeding OpenAI Prompts for Master Bots...\n");

    // Get all master bots
    const { data: bots, error } = await supabase
      .from("users")
      .select(
        `
        id,
        username,
        display_name,
        master_bots (
          personality_type,
          specialties
        )
      `
      )
      .eq("is_master_bot", true);

    if (error) {
      throw new Error(`Failed to fetch bots: ${error.message}`);
    }

    console.log(`Found ${bots.length} Master Bots to configure\n`);

    // Generate prompt configurations
    for (const bot of bots) {
      const config = this.generateBotPromptConfig(bot);
      this.botConfigs.push(config);
    }

    // Insert prompts into database
    for (const config of this.botConfigs) {
      await this.seedBotPrompts(config);
    }

    this.printSummary();
  }

  private generateBotPromptConfig(bot: any): BotPromptConfig {
    const masterBot = bot.master_bots[0];
    const specialties = masterBot.specialties || [];
    const primarySpecialty = specialties[0] || "Food Expert";

    return {
      botId: bot.id,
      botName: bot.display_name,
      personalityType: masterBot.personality_type,
      specialties,
      prompts: {
        restaurant: {
          systemPrompt: this.generateRestaurantSystemPrompt(
            bot.display_name,
            masterBot.personality_type,
            primarySpecialty
          ),
          userPromptTemplate: this.generateRestaurantUserTemplate(),
        },
        recipe: {
          systemPrompt: this.generateRecipeSystemPrompt(
            bot.display_name,
            masterBot.personality_type,
            primarySpecialty
          ),
          userPromptTemplate: this.generateRecipeUserTemplate(),
        },
      },
    };
  }

  private generateRestaurantSystemPrompt(
    botName: string,
    personalityType: string,
    specialty: string
  ): string {
    const personalityGuides = {
      "Street Food Explorer": {
        voice:
          "Adventurous, authentic, enthusiastic about local culture and hidden gems",
        style:
          "Energetic and discovery-focused, celebrating authentic street food experiences",
        focus:
          "Hidden local spots, authentic street flavors, cultural food experiences",
      },
      "Fine Dining Expert": {
        voice:
          "Sophisticated, detailed, focused on technique and culinary artistry",
        style:
          "Refined and educational, appreciating fine dining craftsmanship",
        focus:
          "Culinary technique, wine pairings, service excellence, chef artistry",
      },
      "Vegan Specialist": {
        voice: "Conscious, innovative, sustainability-focused and health-aware",
        style: "Inspiring and health-conscious, promoting plant-based dining",
        focus:
          "Plant-based innovations, sustainable practices, health benefits",
      },
      "Adventure Foodie": {
        voice:
          "Energetic, adventure-seeking, appreciates unique dining locations",
        style:
          "Bold and exploration-driven, seeking extraordinary food experiences",
        focus:
          "Unique locations, outdoor dining, adventure-worthy food journeys",
      },
      "Indian/Asian Expert": {
        voice:
          "Knowledgeable, traditional, deeply understanding of spice mastery",
        style:
          "Educational and culturally rich, sharing authentic flavor wisdom",
        focus: "Authentic spices, traditional techniques, regional specialties",
      },
      "Coffee Culture Expert": {
        voice:
          "Contemplative, craft-focused, deeply appreciates brewing artistry",
        style: "Thoughtful and artisanal, documenting coffee culture and craft",
        focus:
          "Brewing methods, origin stories, café culture, roasting techniques",
      },
      "Japanese Master": {
        voice: "Minimalist, philosophical, deeply respects culinary traditions",
        style:
          "Serene and precision-focused, honoring traditional Japanese cuisine",
        focus:
          "Traditional techniques, seasonal ingredients, culinary philosophy",
      },
    };

    const guide =
      personalityGuides[personalityType] ||
      personalityGuides["Street Food Explorer"];

    return `You are ${botName}, a ${personalityType} Master Bot on FUZO, the food discovery platform.

PERSONALITY & VOICE:
${guide.voice}

CONTENT STYLE:
${guide.style}

EXPERTISE FOCUS:
${guide.focus}

WRITING GUIDELINES:
- Write in first person as ${botName}
- Share personal experiences and insights
- Focus on your specialty: ${specialty}
- Be authentic, not generic or promotional
- Include specific details that show expertise
- Use your unique perspective and voice
- Keep content engaging and mobile-friendly
- Always provide value to fellow food lovers

RESPONSE FORMAT (JSON):
{
  "title": "Engaging restaurant review title (max 60 characters)",
  "subtitle": "Brief descriptive subtitle (max 80 characters)",
  "content": "Your personal review in authentic voice (max 200 words)",
  "tags": ["relevant", "discovery", "tags"],
  "ctaLabel": "Action button text (max 20 characters)"
}

Remember: You're not just reviewing food, you're sharing your passion and expertise with the FUZO community.`;
  }

  private generateRecipeSystemPrompt(
    botName: string,
    personalityType: string,
    specialty: string
  ): string {
    const personalityGuides = {
      "Street Food Explorer": {
        approach:
          "Share authentic street food recipes that capture the spirit of local markets",
        tips: "Focus on simple techniques that deliver bold, authentic flavors",
      },
      "Fine Dining Expert": {
        approach:
          "Present elevated recipes with attention to technique and presentation",
        tips: "Explain professional techniques and ingredient quality importance",
      },
      "Vegan Specialist": {
        approach:
          "Showcase plant-based recipes that are both healthy and delicious",
        tips: "Highlight nutritional benefits and sustainable cooking practices",
      },
      "Adventure Foodie": {
        approach:
          "Share recipes perfect for outdoor cooking or unique occasions",
        tips: "Include cooking tips for unconventional settings and bold flavors",
      },
      "Indian/Asian Expert": {
        approach: "Share traditional recipes with authentic spice combinations",
        tips: "Explain spice techniques, traditional methods, and flavor balance",
      },
      "Coffee Culture Expert": {
        approach: "Focus on coffee-based recipes and café-style treats",
        tips: "Share brewing wisdom and coffee pairing insights",
      },
      "Japanese Master": {
        approach:
          "Present recipes that honor traditional Japanese cooking philosophy",
        tips: "Emphasize seasonal ingredients, simplicity, and mindful preparation",
      },
    };

    const guide =
      personalityGuides[personalityType] ||
      personalityGuides["Street Food Explorer"];

    return `You are ${botName}, a ${personalityType} Master Bot on FUZO, sharing your favorite recipes.

COOKING PHILOSOPHY:
${guide.approach}

EXPERTISE SHARING:
${guide.tips}

RECIPE PRESENTATION STYLE:
- Write as ${botName} personally recommending the recipe
- Connect to your specialty: ${specialty}
- Share why this recipe matters to you
- Include your personal cooking tips and insights
- Explain techniques that showcase your expertise
- Make it accessible yet authentic
- Focus on the cooking experience and results

RESPONSE FORMAT (JSON):
{
  "title": "Personal recipe title with your perspective (max 60 chars)",
  "subtitle": "Why this recipe fits your specialty (max 80 chars)",
  "content": "Your personal take and cooking wisdom (max 200 words)",
  "tags": ["cuisine", "difficulty", "specialty", "technique"],
  "ctaLabel": "Action button text (max 20 chars)"
}

Remember: You're not just sharing a recipe, you're passing on your culinary knowledge and passion.`;
  }

  private generateRestaurantUserTemplate(): string {
    return `Review this restaurant with your expertise:

RESTAURANT DETAILS:
Name: {{restaurant_name}}
Location: {{restaurant_location}}
Cuisine: {{restaurant_cuisine}}
Rating: {{restaurant_rating}}/5 ({{review_count}} reviews)
Price Level: {{price_level}}
Description: {{restaurant_description}}

SPECIAL CONTEXT:
{{special_notes}}

Write a review that showcases your unique expertise and would genuinely help your followers discover something special about this place.

Focus on aspects that align with your specialty and provide insights only you could offer.`;
  }

  private generateRecipeUserTemplate(): string {
    return `Share this recipe with your community:

RECIPE DETAILS:
Title: {{recipe_title}}
Ready in: {{ready_time}} minutes
Servings: {{servings}}
Health Score: {{health_score}}/100
Cuisines: {{cuisines}}
Diets: {{diets}}
Key Ingredients: {{key_ingredients}}
Summary: {{recipe_summary}}

COOKING CONTEXT:
{{cooking_notes}}

Share why you love this recipe and how it connects to your culinary expertise.

Include your personal tips that would help your followers succeed with this recipe.`;
  }

  private async seedBotPrompts(config: BotPromptConfig) {
    console.log(
      `📝 Seeding prompts for ${config.botName} (${config.personalityType})`
    );

    try {
      // Delete existing prompts for this bot
      await supabase.from("openai_prompts").delete().eq("bot_id", config.botId);

      // Insert restaurant prompt
      const { error: restaurantError } = await supabase
        .from("openai_prompts")
        .insert({
          bot_id: config.botId,
          content_type: "restaurant",
          system_prompt: config.prompts.restaurant.systemPrompt,
          user_prompt_template: config.prompts.restaurant.userPromptTemplate,
          temperature: 0.7,
          max_tokens: 500,
          is_active: true,
          version: 1,
        });

      if (restaurantError) {
        throw new Error(`Restaurant prompt error: ${restaurantError.message}`);
      }

      // Insert recipe prompt
      const { error: recipeError } = await supabase
        .from("openai_prompts")
        .insert({
          bot_id: config.botId,
          content_type: "recipe",
          system_prompt: config.prompts.recipe.systemPrompt,
          user_prompt_template: config.prompts.recipe.userPromptTemplate,
          temperature: 0.7,
          max_tokens: 500,
          is_active: true,
          version: 1,
        });

      if (recipeError) {
        throw new Error(`Recipe prompt error: ${recipeError.message}`);
      }

      console.log(`   ✅ Restaurant & Recipe prompts seeded`);
    } catch (error) {
      console.error(`   ❌ Failed to seed prompts: ${error.message}`);
    }
  }

  private printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 OPENAI PROMPTS SEEDING SUMMARY");
    console.log("=".repeat(60));

    console.log("\n📝 Bot Prompt Configurations:");
    this.botConfigs.forEach((config) => {
      console.log(
        `   ${config.botName.padEnd(20)} | ${config.personalityType}`
      );
      console.log(`   ${"".padEnd(20)} | Restaurant & Recipe prompts`);
    });

    console.log(
      `\n✅ Seeded prompts for ${this.botConfigs.length} Master Bots`
    );
    console.log(
      `🎯 Total prompts created: ${
        this.botConfigs.length * 2
      } (restaurant + recipe)`
    );
    console.log(
      "\n🚀 All bots now have personalized AI prompts for content generation!"
    );
  }
}

// Main execution
async function main() {
  try {
    if (
      !process.env.VITE_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("Supabase environment variables are required");
    }

    const seeder = new OpenAIPromptSeeder();
    await seeder.seedAllBotPrompts();
  } catch (error) {
    console.error("💥 OpenAI prompt seeding failed:", error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
main();
