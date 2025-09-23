import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

interface FoodRequest {
  action: "food";
  userInput: string;
  preferences?: string[];
  dietaryRestrictions?: string[];
}

interface ChatRequest {
  action: "chat-response";
  message: string;
  context?: string;
}

interface MasterBotResponseRequest {
  action: "masterbot-response";
  userMessage: string;
  botSpecialty: string;
  conversationHistory?: string[];
}

interface MasterBotPostRequest {
  action: "masterbot-post";
  specialty: string;
  topic: string;
  location?: string;
}

interface SentimentRequest {
  action: "sentiment";
  message: string;
}

type AIActionRequest =
  | FoodRequest
  | ChatRequest
  | MasterBotResponseRequest
  | MasterBotPostRequest
  | SentimentRequest;

export async function POST(req: Request) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const openai = createOpenAI({
      apiKey: openaiApiKey,
    });

    const payload = (await req.json()) as AIActionRequest;

    switch (payload.action) {
      case "food": {
        const prompt = `As a food expert, provide personalized food recommendations based on:
User Input: ${payload.userInput}
Preferences: ${payload.preferences?.join(", ") || "None specified"}
Dietary Restrictions: ${payload.dietaryRestrictions?.join(", ") || "None"}

Provide 3-5 detailed recommendations with ratings, difficulty, and prep time.`;

        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
        });

        return Response.json({ recommendations: result.text });
      }
      case "chat-response": {
        const prompt = `Analyze this chat message and provide a helpful response:
Message: ${payload.message}
Context: ${payload.context || "General conversation"}

Consider the user's sentiment and provide appropriate suggestions.`;

        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
        });

        return Response.json({ response: result.text });
      }
      case "masterbot-response": {
        const historyContext = payload.conversationHistory?.join("\n") || "";
        const prompt = `You are a ${payload.botSpecialty} expert Master Bot. Respond to this user message:

User Message: ${payload.userMessage}
Conversation History: ${historyContext}

Provide an expert response that showcases your specialty knowledge.`;

        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
        });

        return Response.json({ response: result.text });
      }
      case "masterbot-post": {
        const prompt = `As a ${
          payload.specialty
        } expert, create an engaging social media post about ${payload.topic}.
${payload.location ? `Location context: ${payload.location}` : ""}

Make it informative, engaging, and showcase your expertise.`;

        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
        });

        return Response.json({ text: result.text });
      }
      case "sentiment": {
        const prompt = `Analyze the sentiment of this message and provide insights:
Message: "${payload.message}"

Return only: positive, negative, or neutral`;

        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
        });

        return Response.json({ sentiment: result.text.trim().toLowerCase() });
      }
      default:
        return new Response("Unsupported AI action", { status: 400 });
    }
  } catch (error) {
    console.error("AI action error:", error);
    return new Response("Failed to process AI action", { status: 500 });
  }
}
