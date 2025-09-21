import { useCallback, useState } from "react";

// Hook for AI chat using Vercel AI SDK
export function useVercelAIChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(
    async (message: string, context?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the Vercel AI SDK's completion endpoint
        const response = await fetch("/api/ai/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `You are Tako, FUZO's friendly AI food assistant. Help users discover amazing food experiences with enthusiasm and local knowledge.

Context: ${context || "General food conversation"}
User Message: ${message}

Please respond as Tako with helpful food-related advice, restaurant recommendations, or cooking tips. Be friendly and enthusiastic!`,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.status}`);
        }

        // Read the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        let result = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const data = JSON.parse(line.slice(2));
                if (data.type === "text-delta") {
                  result += data.textDelta;
                }
              } catch (e) {
                // Ignore parsing errors for malformed chunks
              }
            }
          }
        }

        return {
          message: result.trim(),
          suggestions: [], // Could be enhanced to extract suggestions from the response
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate response";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    generateResponse,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// Hook for AI status using Vercel AI SDK
export function useVercelAIStatus() {
  const [status, setStatus] = useState<{
    configured: boolean;
    provider: string | null;
    model: string | null;
    availableModels: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/ai/status");
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();
      setStatus(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load AI status";
      setError(errorMessage);
      // Set default status when there's an error
      setStatus({
        configured: false,
        provider: null,
        model: null,
        availableModels: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    configured: status?.configured ?? false,
    provider: status?.provider ?? null,
    model: status?.model ?? null,
    availableModels: status?.availableModels ?? [],
    error,
    isLoading,
    refreshStatus: loadStatus,
  };
}
