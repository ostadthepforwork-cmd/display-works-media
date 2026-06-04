import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (ใช้ใน middleware หรือ Server Components)
export function createSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This key is required for server-side data fetching to bypass RLS."
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
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
