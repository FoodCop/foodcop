export async function GET() {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const nodeEnv = process.env.NODE_ENV;
    
    return Response.json({
      hasOpenAIKey: !!openaiKey,
      openAIKeyLength: openaiKey ? openaiKey.length : 0,
      nodeEnv,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Environment test error:", error);
    return new Response("Environment test failed", { status: 500 });
  }
}
