import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAdminAuthorization } from "@/lib/admin-authorization";

export const CRM_READ_ROLES = ["owner", "admin", "sales", "marketing"] as const;
export const CRM_WRITE_ROLES = ["owner", "admin", "sales"] as const;

export async function authorizeCrm(supabase: SupabaseClient, write = false) {
  return checkAdminAuthorization(supabase, write ? CRM_WRITE_ROLES : CRM_READ_ROLES);
}

export function crmError(error: unknown, fallback: string) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : fallback;
  if (code === "42P01" || /crm_leads.*schema cache|relation.*crm_leads.*does not exist/i.test(message)) {
    return { status: 503, error: "CRM database migration has not been applied" };
  }
  return { status: 400, error: message || fallback };
}

export const textOrNull = (value: unknown, max = 500) => {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
};

export const numberOrNull = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
