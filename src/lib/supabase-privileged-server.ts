import "server-only";

import { createClient } from "@supabase/supabase-js";

function requiredServerEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server Supabase configuration: ${name}`);
  return value;
}

/** Explicit RLS-bypassing client. Import only from reviewed server-only data paths. */
export function createPrivilegedServerClient() {
  return createClient(
    requiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
