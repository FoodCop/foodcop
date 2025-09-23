export async function GET() {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const configured = !!openaiApiKey;

    const status = {
      configured,
      provider: configured ? "openai" : null,
      model: configured ? "gpt-4o-mini" : null,
      availableModels: configured ? ["openai"] : [],
    };

    return Response.json(status);
  } catch (error) {
    console.error("AI status error:", error);
    return new Response("Failed to load AI status", { status: 500 });
  }
}
