import { generateObject, generateText, streamText } from "ai";
import { z } from "zod";
import { getAIConfig, getDefaultModel } from "./ai-config";

const ensureServer = () => {
  if (typeof window !== "undefined") {
    throw new Error("AI utilities must be called from a server environment");
  }
};

const getModelSelection = () => {
  const config = getAIConfig();
  const selection = getDefaultModel(config);
  return { config, selection };
};

// Common AI schemas for food-related tasks
export const foodRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      cuisine: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      prepTime: z.string(),
      ingredients: z.array(z.string()),
      rating: z.number().min(1).max(5),
    })
  ),
  reasoning: z.string(),
  followUpQuestions: z.array(z.string()),
});

export const chatResponseSchema = z.object({
  message: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  suggestions: z.array(z.string()),
  shouldEscalate: z.boolean(),
});

export const masterBotResponseSchema = z.object({
  response: z.string(),
  specialty: z.string(),
  confidence: z.number().min(0).max(1),
  relatedTopics: z.array(z.string()),
  nextQuestions: z.array(z.string()),
});

// AI Utility Functions
export const aiUtils = {
  async generateFoodRecommendations(
    userInput: string,
    userPreferences?: string[],
    dietaryRestrictions?: string[]
  ) {
    ensureServer();
    const { selection } = getModelSelection();

    const prompt = `
      As a food expert, provide personalized food recommendations based on:
      User Input: ${userInput}
      Preferences: ${userPreferences?.join(", ") || "None specified"}
      Dietary Restrictions: ${dietaryRestrictions?.join(", ") || "None"}

      Provide 3-5 detailed recommendations with ratings, difficulty, and prep time.
    `;

    const result = await generateObject({
      model: selection.model,
      prompt,
      schema: foodRecommendationSchema,
    });

    return result.object;
  },

  async generateChatResponse(message: string, context?: string) {
    ensureServer();
    const { selection } = getModelSelection();

    const prompt = `
      Analyze this chat message and provide a helpful response:
      Message: ${message}
      Context: ${context || "General conversation"}

      Consider the user's sentiment and provide appropriate suggestions.
    `;

    const result = await generateObject({
      model: selection.model,
      prompt,
      schema: chatResponseSchema,
    });

    return result.object;
  },

  async generateMasterBotResponse(
    userMessage: string,
    botSpecialty: string,
    conversationHistory?: string[]
  ) {
    ensureServer();
    const { selection } = getModelSelection();

    const historyContext = conversationHistory?.join("\n") || "";

    const prompt = `
      You are a ${botSpecialty} expert Master Bot. Respond to this user message:

      User Message: ${userMessage}
      Conversation History: ${historyContext}

      Provide an expert response that showcases your specialty knowledge.
      Be helpful, engaging, and suggest related topics or questions.
    `;

    const result = await generateObject({
      model: selection.model,
      prompt,
      schema: masterBotResponseSchema,
    });

    return result.object;
  },

  async streamTextResponse(prompt: string) {
    ensureServer();
    const { selection } = getModelSelection();

    const result = await streamText({
      model: selection.model,
      prompt,
    });

    return result;
  },

  async analyzeSentiment(message: string) {
    ensureServer();
    const { selection } = getModelSelection();

    const prompt = `
      Analyze the sentiment of this message and provide insights:
      Message: "${message}"

      Return only: positive, negative, or neutral
    `;

    const result = await generateText({
      model: selection.model,
      prompt,
    });

    return result.text.trim().toLowerCase();
  },

  async generateMasterBotPost(
    specialty: string,
    topic: string,
    location?: string
  ) {
    ensureServer();
    const { selection } = getModelSelection();

    const prompt = `
      As a ${specialty} expert, create an engaging social media post about ${topic}.
      ${location ? `Location context: ${location}` : ""}

      Make it informative, engaging, and showcase your expertise.
      Include relevant hashtags and call-to-action.
    `;

    const result = await generateText({
      model: selection.model,
      prompt,
    });

    return result.text;
  },

  getModelStatus() {
    const config = getAIConfig();
    const configured = !!config.openai.apiKey;

    return {
      configured,
      provider: configured ? "openai" : null,
      model: configured ? config.openai.model : null,
      availableModels: configured ? ["openai"] : [],
    };
  },
};
