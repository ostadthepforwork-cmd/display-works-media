import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AdminAuthorization = {
  user: User | null;
  authenticated: boolean;
  status: 200 | 401 | 403 | 503;
  error: string | null;
};

export async function checkAdminAuthorization(
  supabase: SupabaseClient,
): Promise<AdminAuthorization> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return { user: null, authenticated: false, status: 401, error: "Unauthorized" };
    }

    // Read current membership on every check; JWT metadata is not authorization.
    const { data: membership, error: membershipError } = await supabase
      .from("admin_users")
      .select("user_id, role, active")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (membershipError) {
      return { user: null, authenticated: true, status: 503, error: "Authorization unavailable" };
    }
    if (
      membership?.user_id !== data.user.id ||
      membership.active !== true ||
      !["owner", "admin"].includes(membership.role)
    ) {
      return { user: null, authenticated: true, status: 403, error: "Forbidden" };
    }
    return { user: data.user, authenticated: true, status: 200, error: null };
  } catch {
    return { user: null, authenticated: false, status: 503, error: "Authorization unavailable" };
  }
}
