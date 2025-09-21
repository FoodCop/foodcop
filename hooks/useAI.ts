import { useChat, useCompletion } from "@ai-sdk/react";
import { useCallback, useEffect, useState } from "react";

const postAIAction = async <T>(
  payload: Record<string, unknown>
): Promise<T> => {
  const response = await fetch("/api/ai/actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "AI action request failed");
  }

  return (await response.json()) as T;
};

const getAIStatus = async () => {
  const response = await fetch("/api/ai/status");
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to load AI status");
  }
  return response.json();
};

interface AIStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
  availableModels: string[];
}

// Hook for food recommendations
export function useFoodRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const generateRecommendations = useCallback(
    async (
      userInput: string,
      preferences?: string[],
      dietaryRestrictions?: string[]
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await postAIAction<{ recommendations: any[] }>({
          action: "food",
          userInput,
          preferences,
          dietaryRestrictions,
        });
        setRecommendations(result.recommendations || []);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate recommendations";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    generateRecommendations,
    recommendations,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// Hook for chat responses with AI
export function useAIChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(
    async (message: string, context?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await postAIAction({
          action: "chat-response",
          message,
          context,
        });
        return result;
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

  const analyzeSentiment = useCallback(async (message: string) => {
    try {
      const result = await postAIAction<{ sentiment: string }>({
        action: "sentiment",
        message,
      });
      return result.sentiment;
    } catch (err) {
      console.error("Sentiment analysis failed:", err);
      return "neutral";
    }
  }, []);

  return {
    generateResponse,
    analyzeSentiment,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// Hook for Master Bot AI responses
export function useMasterBotAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBotResponse = useCallback(
    async (
      userMessage: string,
      botSpecialty: string,
      conversationHistory?: string[]
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await postAIAction({
          action: "masterbot-response",
          userMessage,
          botSpecialty,
          conversationHistory,
        });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate bot response";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generatePost = useCallback(
    async (specialty: string, topic: string, location?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await postAIAction<{ text: string }>({
          action: "masterbot-post",
          specialty,
          topic,
          location,
        });
        return result.text;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate post";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    generateBotResponse,
    generatePost,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// Hook for streaming text generation
export function useStreamingAI() {
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/ai/complete",
  });

  return {
    completion,
    complete,
    isLoading,
    error,
  };
}

// Hook for chat with streaming
export function useStreamingChat() {
  const chat = useChat({
    // Remove the api property as it's not supported in this version
  });

  return {
    messages: chat.messages,
    sendMessage: chat.sendMessage,
    regenerate: chat.regenerate,
    stop: chat.stop,
    status: chat.status,
    error: chat.error,
    clearError: chat.clearError,
  };
}

// Hook for AI status and configuration
export function useAIStatus() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      const result = await getAIStatus();
      setStatus(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load AI status";
      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return {
    configured: status?.configured ?? false,
    provider: status?.provider ?? null,
    model: status?.model ?? null,
    availableModels: status?.availableModels ?? [],
    error,
    refreshStatus: loadStatus,
  };
}
