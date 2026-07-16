import { createBrowserClient } from "@supabase/ssr";

import { supabasePublicEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = supabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
