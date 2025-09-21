import { aiUtils } from "../../lib/ai-utils";

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
    const payload = (await req.json()) as AIActionRequest;

    switch (payload.action) {
      case "food": {
        const result = await aiUtils.generateFoodRecommendations(
          payload.userInput,
          payload.preferences,
          payload.dietaryRestrictions
        );
        return Response.json(result);
      }
      case "chat-response": {
        const result = await aiUtils.generateChatResponse(
          payload.message,
          payload.context
        );
        return Response.json(result);
      }
      case "masterbot-response": {
        const result = await aiUtils.generateMasterBotResponse(
          payload.userMessage,
          payload.botSpecialty,
          payload.conversationHistory
        );
        return Response.json(result);
      }
      case "masterbot-post": {
        const result = await aiUtils.generateMasterBotPost(
          payload.specialty,
          payload.topic,
          payload.location
        );
        return Response.json({ text: result });
      }
      case "sentiment": {
        const sentiment = await aiUtils.analyzeSentiment(payload.message);
        return Response.json({ sentiment });
      }
      default:
        return new Response("Unsupported AI action", { status: 400 });
    }
  } catch (error) {
    console.error("AI action error:", error);
    return new Response("Failed to process AI action", { status: 500 });
  }
}
