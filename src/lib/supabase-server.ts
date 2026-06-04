import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (ใช้ใน middleware หรือ Server Components)
export function createSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn(
      "[supabase-server] WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Falling back to ANON_KEY — RLS may block some queries."
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function createSupabaseMiddlewareClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
