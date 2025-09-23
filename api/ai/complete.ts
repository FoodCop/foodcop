import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    // Get OpenAI API key from server environment
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const openai = createOpenAI({
      apiKey: openaiApiKey,
    });

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      prompt: `You are Tako, a friendly AI food assistant for FUZO. Help users discover amazing food experiences, restaurants, and recipes. Be helpful, engaging, and food-focused in your responses.

User: ${prompt}`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI completion error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
