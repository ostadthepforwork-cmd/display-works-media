import { createHmac } from "node:crypto";

export async function consumeQuoteRateLimit(clientId: string, fetcher: typeof fetch = fetch): Promise<
  { state: "allowed" } | { state: "limited"; retryAfter: number } | { state: "unavailable" }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { state: "unavailable" };
  try {
    const hash = createHmac("sha256", key).update(`quote:${clientId}`).digest("hex");
    const response = await fetcher(`${url}/rest/v1/rpc/consume_quote_rate_limit_v1`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000),
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_key_hash: hash }),
    });
    if (!response.ok) return { state: "unavailable" };
    const result = await response.json();
    if (typeof result?.allowed !== "boolean" || !Number.isInteger(result?.retry_after) || result.retry_after < 1 || result.retry_after > 600) return { state: "unavailable" };
    return result.allowed ? { state: "allowed" } : { state: "limited", retryAfter: result.retry_after };
  } catch {
    return { state: "unavailable" };
  }
}
