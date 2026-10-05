import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type MessengerReferral = {
  eventReference: string;
  conversationId: string;
  referralId: string | null;
  campaignId: string | null;
  adsetId: string | null;
  adId: string | null;
  occurredAt: string;
  metadata: Record<string, string>;
};

const value = (input: unknown, max = 300) => {
  const result = String(input ?? "").trim();
  return result ? result.slice(0, max) : null;
};

function referralFrom(event: any) {
  return event?.message?.referral || event?.postback?.referral || event?.referral || {};
}

export function verifyMetaSignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature) || !appSecret) return false;
  const supplied = Buffer.from(signature.slice(7), "hex");
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"), "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function extractMessengerReferrals(payload: any, appSecret: string): MessengerReferral[] {
  const rows: MessengerReferral[] = [];
  for (const entry of Array.isArray(payload?.entry) ? payload.entry : []) {
    for (const event of Array.isArray(entry?.messaging) ? entry.messaging : []) {
      if (event?.message?.is_echo || event?.delivery || event?.read) continue;
      const senderId = value(event?.sender?.id);
      if (!senderId) continue;
      const referral = referralFrom(event);
      const timestamp = Number(event?.timestamp ?? Date.now());
      const occurredDate = new Date(timestamp);
      if (!Number.isFinite(occurredDate.getTime())) continue;
      const occurredAt = occurredDate.toISOString();
      const messageId = value(event?.message?.mid || event?.postback?.mid);
      const referralId = value(referral?.ref || referral?.referral_id);
      const adId = value(referral?.ad_id || event?.ad_id);
      const campaignId = value(referral?.campaign_id || event?.campaign_id);
      const adsetId = value(referral?.adset_id || event?.adset_id);
      if (!messageId && !referralId && !adId) continue;

      const conversationId = createHmac("sha256", appSecret).update(senderId).digest("hex");
      const eventReference = messageId || createHash("sha256")
        .update([conversationId, occurredAt, referralId, campaignId, adsetId, adId].join("|"))
        .digest("hex");
      rows.push({
        eventReference,
        conversationId,
        referralId,
        campaignId,
        adsetId,
        adId,
        occurredAt,
        metadata: Object.fromEntries(Object.entries({
          source: value(referral?.source),
          type: value(referral?.type),
          adsContextData: value(referral?.ads_context_data),
        }).filter(([, field]) => field !== null)) as Record<string, string>,
      });
    }
  }
  return rows;
}
