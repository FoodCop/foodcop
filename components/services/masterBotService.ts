// Master Bot Service - Simplified approach
// Master Bots are just users with is_master_bot = true

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../utils/supabase";

// Use singleton Supabase client for Master Bot operations
// Note: RLS policies should allow public read access to master bot data
const supabase = getSupabaseClient()!;

export interface MasterBot {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location_city: string | null;
  location_country: string | null;
  total_points: number;
  followers_count: number;
  following_count: number;
  is_master_bot: boolean;
  created_at: string;
  updated_at: string;
}

export class MasterBotService {
  /**
   * Get all Master Bots
   */
  static async getAllMasterBots(): Promise<MasterBot[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_master_bot", true)
        .order("display_name");

      if (error) {
        console.error("Error fetching Master Bots:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAllMasterBots:", error);
      return [];
    }
  }

  /**
   * Get a specific Master Bot by ID
   */
  static async getMasterBotById(id: string): Promise<MasterBot | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .eq("is_master_bot", true)
        .single();

      if (error) {
        console.error("Error fetching Master Bot:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getMasterBotById:", error);
      return null;
    }
  }

  /**
   * Get a Master Bot by username
   */
  static async getMasterBotByUsername(
    username: string
  ): Promise<MasterBot | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("is_master_bot", true)
        .single();

      if (error) {
        console.error("Error fetching Master Bot by username:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getMasterBotByUsername:", error);
      return null;
    }
  }

  /**
   * Get Master Bots by specialty (if we add specialty fields later)
   */
  static async getMasterBotsBySpecialty(
    specialty: string
  ): Promise<MasterBot[]> {
    try {
      // For now, just return all Master Bots
      // Later we can add specialty filtering when we add specialty fields
      return await this.getAllMasterBots();
    } catch (error) {
      console.error("Error in getMasterBotsBySpecialty:", error);
      return [];
    }
  }

  /**
   * Check if a user is a Master Bot
   */
  static async isMasterBot(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("is_master_bot")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking if user is Master Bot:", error);
        return false;
      }

      return data?.is_master_bot || false;
    } catch (error) {
      console.error("Error in isMasterBot:", error);
      return false;
    }
  }
}

// Export a simple hook for React components
export function useMasterBots() {
  const [masterBots, setMasterBots] = useState<MasterBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMasterBots() {
      try {
        setLoading(true);
        setError(null);
        const bots = await MasterBotService.getAllMasterBots();
        setMasterBots(bots);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch Master Bots"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMasterBots();
  }, []);

  return { masterBots, loading, error };
}

// For non-React usage
export const masterBotService = MasterBotService;
