import { createAuthenticatedServerClient } from "./supabase-server";
import { checkAdminAuthorization } from "./admin-authorization";

export async function requireAdminUser(allowedRoles?: readonly string[]) {
  const supabase = await createAuthenticatedServerClient();
  return { ...(await checkAdminAuthorization(supabase, allowedRoles)), supabase };
}
