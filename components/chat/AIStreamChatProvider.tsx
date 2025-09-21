import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Channel, StreamChat, User } from "stream-chat";
import { useAuth } from "../../contexts/AuthContext";
import { useAIChat, useMasterBotAI } from "../../hooks/useAI";
import { getSupabaseClient } from "../../utils/supabase";
import { generateStreamToken, getStreamChatConfig } from "./StreamChatConfig";

interface AIStreamChatContextType {
  client: StreamChat | null;
  user: User | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (channelId: string, message: string) => Promise<void>;
  sendAIMessage: (
    channelId: string,
    message: string,
    botSpecialty?: string
  ) => Promise<void>;
  createChannel: (
    type: string,
    members: string[],
    name?: string
  ) => Promise<Channel>;
  markAsRead: (channelId: string) => Promise<void>;
  queryChannels: (filters: any, sort?: any) => Promise<Channel[]>;
  aiEnabled: boolean;
  toggleAI: () => void;
}

const AIStreamChatContext = createContext<AIStreamChatContextType | null>(null);

interface AIStreamChatProviderProps {
  children: ReactNode;
}

export function AIStreamChatProvider({ children }: AIStreamChatProviderProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);

  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = getSupabaseClient();
  const { generateBotResponse, isLoading: aiLoading } = useMasterBotAI();
  const { generateResponse, analyzeSentiment } = useAIChat();

  const connect = useCallback(async () => {
    if (!authUser || isConnecting || isConnected || !supabase) return;

    setIsConnecting(true);
    setError(null);

    try {
      const config = getStreamChatConfig();
      if (!config) {
        throw new Error("Stream Chat not configured");
      }

      // Initialize client with API key only
      const streamClient = StreamChat.getInstance(config.apiKey);
      setClient(streamClient);

      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session token available");
      }

      // Generate secure token from server
      const tokenData = await generateStreamToken(
        authUser.id,
        session.access_token
      );

      if (!tokenData) {
        throw new Error("Failed to generate Stream token");
      }

      // Connect user with secure token
      const streamUser = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || config.userName,
        image: authUser.user_metadata?.avatar_url || config.userImage,
      };

      await streamClient.connectUser(streamUser, tokenData.token);

      setUser(streamUser);
      setIsConnected(true);

      console.log("[AIStreamChat] Connected successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to Stream Chat";
      setError(errorMessage);
      console.error("[AIStreamChat] Connection failed:", errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [authUser, isConnecting, isConnected, supabase]);

  const disconnect = useCallback(async () => {
    if (!client || !isConnected) return;

    try {
      await client.disconnectUser();
      setClient(null);
      setUser(null);
      setIsConnected(false);
      setError(null);
      console.log("[AIStreamChat] Disconnected");
    } catch (err) {
      console.error("[AIStreamChat] Disconnect failed:", err);
    }
  }, [client, isConnected]);

  // Auto-connect when auth user is available
  useEffect(() => {
    if (authUser && !isConnected && !isConnecting && !authLoading) {
      connect();
    }
  }, [authUser, isConnected, isConnecting, authLoading, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client && isConnected) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [client, isConnected]);

  const sendMessage = useCallback(
    async (channelId: string, message: string) => {
      if (!client || !isConnected) {
        throw new Error("Not connected to Stream Chat");
      }

      try {
        const channel = client.channel("messaging", channelId);
        await channel.sendMessage({ text: message });
      } catch (err) {
        console.error("Failed to send message:", err);
        throw err;
      }
    },
    [client, isConnected]
  );

  const sendAIMessage = useCallback(
    async (channelId: string, message: string, botSpecialty?: string) => {
      if (!client || !isConnected) {
        throw new Error("Not connected to Stream Chat");
      }

      try {
        const channel = client.channel("messaging", channelId);

        // Send the original message
        await channel.sendMessage({ text: message });

        // If AI is enabled, generate and send AI response
        if (aiEnabled && botSpecialty) {
          try {
            // Analyze sentiment of the message
            const sentiment = await analyzeSentiment(message);

            // Generate AI response based on bot specialty
            const aiResponse = await generateBotResponse(message, botSpecialty);

            // Send AI response as a separate message
            await channel.sendMessage({
              text: `[AI] ${aiResponse.response}`,
              metadata: {
                aiGenerated: true,
                specialty: aiResponse.specialty,
                confidence: aiResponse.confidence,
                sentiment: sentiment,
              },
            });

            // If there are follow-up questions, suggest them
            if (aiResponse.nextQuestions.length > 0) {
              const followUpText = `[AI hint] You might also ask: ${aiResponse.nextQuestions
                .slice(0, 2)
                .join(" or ")}`;
              await channel.sendMessage({
                text: followUpText,
                metadata: {
                  aiGenerated: true,
                  type: "suggestion",
                },
              });
            }
          } catch (aiError) {
            console.error("AI response generation failed:", aiError);
            // Don't fail the entire message if AI fails
          }
        }
      } catch (err) {
        console.error("Failed to send AI message:", err);
        throw err;
      }
    },
    [client, isConnected, aiEnabled, generateBotResponse, analyzeSentiment]
  );

  const createChannel = useCallback(
    async (type: string, members: string[], name?: string) => {
      if (!client || !isConnected) {
        throw new Error("Not connected to Stream Chat");
      }

      try {
        const channel = client.channel(type, {
          members,
          name: name || `Channel with ${members.join(", ")}`,
        });

        await channel.create();
        return channel;
      } catch (err) {
        console.error("Failed to create channel:", err);
        throw err;
      }
    },
    [client, isConnected]
  );

  const markAsRead = useCallback(
    async (channelId: string) => {
      if (!client || !isConnected) {
        throw new Error("Not connected to Stream Chat");
      }

      try {
        const channel = client.channel("messaging", channelId);
        await channel.markRead();
      } catch (err) {
        console.error("Failed to mark as read:", err);
        throw err;
      }
    },
    [client, isConnected]
  );

  const queryChannels = useCallback(
    async (filters: any, sort?: any) => {
      if (!client || !isConnected) {
        throw new Error("Not connected to Stream Chat");
      }

      try {
        const channels = await client.queryChannels(
          filters,
          sort || [{ last_message_at: -1 }]
        );
        return channels;
      } catch (err) {
        console.error("Failed to query channels:", err);
        throw err;
      }
    },
    [client, isConnected]
  );

  const toggleAI = useCallback(() => {
    setAiEnabled((prev) => !prev);
  }, []);

  const contextValue: AIStreamChatContextType = {
    client,
    user,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    sendAIMessage,
    createChannel,
    markAsRead,
    queryChannels,
    aiEnabled,
    toggleAI,
  };

  return (
    <AIStreamChatContext.Provider value={contextValue}>
      {children}
    </AIStreamChatContext.Provider>
  );
}

export function useAIStreamChat() {
  const context = useContext(AIStreamChatContext);
  if (!context) {
    throw new Error(
      "useAIStreamChat must be used within an AIStreamChatProvider"
    );
  }
  return context;
}
