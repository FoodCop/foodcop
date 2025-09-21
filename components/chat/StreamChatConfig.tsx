import { getEnvVar } from "../utils/envUtils.basic";

export interface StreamChatConfig {
  apiKey: string;
  userId: string;
  userName: string;
  userImage?: string;
}

/**
 * Get Stream Chat configuration from environment variables
 */
export function getStreamChatConfig(): StreamChatConfig | null {
  const apiKey = getEnvVar("VITE_STREAM_CHAT_API_KEY");

  if (!apiKey) {
    console.warn("Stream Chat API key not configured");
    return null;
  }

  // In a real app, you'd get these from your auth context
  const userId = getEnvVar("VITE_TEST_USER_ID", "demo_user");
  const userName = getEnvVar("VITE_TEST_USER_NAME", "Demo User");
  const userImage = getEnvVar("VITE_TEST_USER_IMAGE", "");

  return {
    apiKey,
    userId,
    userName,
    userImage: userImage || undefined,
  };
}

/**
 * Generate a Stream Chat token by calling the secure server endpoint
 */
export async function generateStreamToken(
  userId: string,
  authToken: string
): Promise<{
  token: string;
  apiKey: string;
  userId: string;
} | null> {
  try {
    const response = await fetch(
      "/make-server-5976446e/functions/v1/stream-token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userName: "User", // This would come from auth context
          userImage: undefined,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate Stream token");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to generate Stream token:", error);
    return null;
  }
}

/**
 * Check if Stream Chat is properly configured
 */
export function isStreamChatConfigured(): boolean {
  const config = getStreamChatConfig();
  return config !== null;
}
