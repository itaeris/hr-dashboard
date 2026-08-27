import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null | undefined;

export function getSupabaseServerClient() {
  if (serverClient !== undefined) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (!url || !key) {
    serverClient = null;
    return serverClient;
  }

  if (process.env.NODE_ENV === "production" && !serviceKey) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Auth tables must not stay readable with the anon key.",
    );
  }

  serverClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serverClient;
}
