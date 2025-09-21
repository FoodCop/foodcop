import type { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getEnvVar } from "../components/utils/envUtils.basic";

// AI Configuration shape (extendable if we add providers later)
export interface AIConfig {
  openai: {
    apiKey: string;
    model: string;
  };
}

export interface ModelSelection {
  provider: "openai";
  modelId: string;
  model: LanguageModel;
}

function resolveServerEnv(key: string): string {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return "";
}

// Get AI configuration from environment variables
export function getAIConfig(): AIConfig {
  const openaiApiKey =
    resolveServerEnv("OPENAI_API_KEY") || getEnvVar("VITE_OPENAI_API_KEY");

  return {
    openai: {
      apiKey: openaiApiKey,
      model: "gpt-4o-mini",
    },
  };
}

// Default OpenAI model selection
export function getDefaultModel(config: AIConfig): ModelSelection {
  if (!config.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openAI = createOpenAI({
    apiKey: config.openai.apiKey || undefined,
  });

  return {
    provider: "openai",
    modelId: config.openai.model,
    model: openAI(config.openai.model),
  };
}

// Check if AI is properly configured
export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!config.openai.apiKey;
}

// Get available providers (only OpenAI for now)
export function getAvailableModels(config: AIConfig): string[] {
  return config.openai.apiKey ? ["openai"] : [];
}
