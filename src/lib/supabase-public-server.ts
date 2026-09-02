import "server-only";

import { createClient } from "@supabase/supabase-js";

function requiredPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required public Supabase configuration: ${name}`);
  return value;
}

/** Anonymous server reads. Access is limited by the anon role and RLS. */
export function createPublicServerClient() {
  return createClient(
    requiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
