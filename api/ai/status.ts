import { aiUtils } from "../../lib/ai-utils";

export async function GET() {
  try {
    const status = aiUtils.getModelStatus();
    return Response.json(status);
  } catch (error) {
    console.error("AI status error:", error);
    return new Response("Failed to load AI status", { status: 500 });
  }
}
