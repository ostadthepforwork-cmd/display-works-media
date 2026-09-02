import { createAuthenticatedServerClient } from "./supabase-server";
import { checkAdminAuthorization } from "./admin-authorization";

export async function requireAdminUser() {
  const supabase = await createAuthenticatedServerClient();
  return checkAdminAuthorization(supabase);
}
