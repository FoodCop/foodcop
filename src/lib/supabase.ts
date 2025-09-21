import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

const readEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const fromProcess =
      typeof globalThis !== "undefined" &&
      (globalThis as any).process &&
      (globalThis as any).process.env
        ? (globalThis as any).process.env[key]
        : undefined;
    if (fromProcess) {
      return fromProcess;
    }

    const fromImportMeta =
      typeof import.meta !== "undefined" && (import.meta as any).env
        ? (import.meta as any).env[key]
        : undefined;
    if (fromImportMeta) {
      return fromImportMeta as string;
    }

    const fromDeno =
      typeof globalThis !== "undefined" &&
      (globalThis as any).Deno &&
      typeof (globalThis as any).Deno.env?.get === "function"
        ? (globalThis as any).Deno.env.get(key)
        : undefined;
    if (fromDeno) {
      return fromDeno;
    }
  }
  return undefined;
};

export const sbService = (): SupabaseClient => {
  if (serviceClient) {
    return serviceClient;
  }

  const url = readEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceKey = readEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "VITE_SUPABASE_SERVICE_ROLE_KEY"
  );

  if (!url || !serviceKey) {
    throw new Error("Supabase service credentials are not configured");
  }

  serviceClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serviceClient;
};
