import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v20.0";

const accessTokenKeys = [
  "META_ACCESS_TOKEN",
  "META_ADS_ACCESS_TOKEN",
  "FACEBOOK_ACCESS_TOKEN",
  "FACEBOOK_ADS_ACCESS_TOKEN",
  "FB_ACCESS_TOKEN",
];

const adAccountKeys = [
  "META_AD_ACCOUNT_ID",
  "META_ADS_ACCOUNT_ID",
  "FACEBOOK_AD_ACCOUNT_ID",
  "FACEBOOK_ADS_ACCOUNT_ID",
  "FB_AD_ACCOUNT_ID",
];

function readFirstEnv(keys: string[]) {
  for (const key of keys) {
    const value = (process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function getAdAccountId() {
  const raw = readFirstEnv(adAccountKeys);
  if (!raw) return "";
  const clean = raw.replace(/^act_/, "");
  return `act_${clean}`;
}

function getAccessToken() {
  return readFirstEnv(accessTokenKeys);
}

async function graphGet(path: string, params: Record<string, string>) {
  const token = getAccessToken();
  if (!token) throw new Error(`ยังไม่ได้ตั้งค่า Meta access token (${accessTokenKeys.join(" หรือ ")})`);

  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || `Meta API failed with ${response.status}`);
  }

  return data;
}

async function graphGetAll(path: string, params: Record<string, string>, maxPages = 8) {
  const rows: any[] = [];
  let nextUrl = "";

  for (let page = 0; page < maxPages; page += 1) {
    const data = nextUrl
      ? await fetch(nextUrl, { cache: "no-store" }).then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error?.message || `Meta API failed with ${response.status}`);
          return payload;
        })
      : await graphGet(path, params);

    rows.push(...(Array.isArray(data.data) ? data.data : []));
    nextUrl = data.paging?.next || "";
    if (!nextUrl) break;
  }

  return rows;
}

const numberValue = (value: unknown) => Number(value || 0);

const formLeadActionTypes = [
  "lead",
  "leadgen_grouped",
  "offsite_conversion.fb_pixel_lead",
  "onsite_conversion.lead",
  "onsite_conversion.lead_grouped",
];

const messageLeadActionTypes = [
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.messaging_conversation_started",
  "omni_messaging_conversation_started_7d",
  "omni_messaging_conversation_started",
  "onsite_conversion.messaging_first_reply",
  "onsite_conversion.messaging_user_subscribed",
];

const leadActionTypes = [...formLeadActionTypes, ...messageLeadActionTypes];

const engagementActionTypes = [
  "onsite_conversion.post_save",
  "onsite_conversion.post_save_7d",
  "post_save",
  "post_engagement",
  "page_engagement",
  "omni_post_engagement",
];

const purchaseActionTypes = [
  "purchase",
  "omni_purchase",
  "offsite_conversion.purchase",
  "offsite_conversion.fb_pixel_purchase",
  "onsite_conversion.purchase",
  "onsite_conversion.purchase_grouped",
  "offline_conversion.purchase",
];

function actionCount(actions: any[] | undefined, names: string[]) {
  if (!Array.isArray(actions)) return 0;
  return actions
    .filter((item) => names.includes(item.action_type))
    .reduce((sum, item) => sum + numberValue(item.value), 0);
}

function actionValue(actions: any[] | undefined, names: string[]) {
  return actionCount(actions, names);
}

function roasValue(purchaseRoas: any[] | undefined) {
  if (!Array.isArray(purchaseRoas)) return 0;
  const exact = purchaseRoas.find((item) => purchaseActionTypes.includes(item.action_type));
  const fallback = purchaseRoas.find((item) => Number(item.value || 0) > 0);
  return numberValue((exact || fallback)?.value);
}

function valueBreakdown(values: any[] | undefined) {
  const source = Array.isArray(values) ? values : [];
  return source
    .map((item) => ({
      type: item.action_type,
      value: numberValue(item.value),
    }))
    .filter((item) => item.value > 0);
}

function actionBreakdown(actions: any[] | undefined) {
  const source = Array.isArray(actions) ? actions : [];
  const breakdown = leadActionTypes.map((type) => ({
    type,
    value: source
      .filter((item) => item.action_type === type)
      .reduce((sum, item) => sum + numberValue(item.value), 0),
  })).filter((item) => item.value > 0);

  return {
    breakdown,
    messageLeads: actionCount(source, messageLeadActionTypes),
    formLeads: actionCount(source, formLeadActionTypes),
  };
}

function engagementBreakdown(actions: any[] | undefined) {
  const source = Array.isArray(actions) ? actions : [];
  const breakdown = engagementActionTypes.map((type) => ({
    type,
    value: source
      .filter((item) => item.action_type === type)
      .reduce((sum, item) => sum + numberValue(item.value), 0),
  })).filter((item) => item.value > 0);

  return {
    breakdown,
    total: breakdown.reduce((sum, item) => sum + item.value, 0),
  };
}

function outboundClicks(row: any) {
  if (!Array.isArray(row?.outbound_clicks)) return 0;
  return row.outbound_clicks.reduce((sum: number, item: any) => sum + numberValue(item.value), 0);
}

function clickCount(row: any) {
  return numberValue(row.clicks) || numberValue(row.inline_link_clicks) || outboundClicks(row);
}

function insightDateParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  if (startDate && endDate) {
    return {
      time_range: JSON.stringify({ since: startDate, until: endDate }),
    };
  }
  return { date_preset: "last_30d" };
}

function insightRangeLabel(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  if (startDate && endDate) return { mode: "custom", startDate, endDate, label: `${startDate} to ${endDate}` };
  return { mode: "preset", preset: "last_30d", label: "last_30d" };
}

function settledData<T>(result: PromiseSettledResult<T>, fallback: T) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function settledError(result: PromiseSettledResult<unknown>, label: string) {
  if (result.status === "fulfilled") return null;
  return {
    section: label,
    message: result.reason instanceof Error ? result.reason.message : "Meta API request failed",
  };
}

export async function GET(request: Request) {
  const { user } = await requireAdminUser();
  if (!user) {
    return NextResponse.json(
      { success: false, connected: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const adAccountId = getAdAccountId();
  const accessToken = getAccessToken();
  if (!adAccountId || !accessToken) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: `ยังไม่ได้ตั้งค่า Meta API ให้ครบ ต้องมี Ad Account (${adAccountKeys.join(" หรือ ")}) และ Token (${accessTokenKeys.join(" หรือ ")})`,
        requiredEnv: {
          adAccount: adAccountKeys,
          accessToken: accessTokenKeys,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const dateParams = insightDateParams(request);
    const requestedRange = insightRangeLabel(request);
    const accountFields = [
      "spend",
      "impressions",
      "reach",
      "clicks",
      "inline_link_clicks",
      "outbound_clicks",
      "cpc",
      "cpm",
      "ctr",
      "actions",
      "action_values",
      "purchase_roas",
    ].join(",");

    const campaignFields = [
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "inline_link_clicks",
      "outbound_clicks",
      "cpc",
      "ctr",
      "actions",
      "action_values",
      "purchase_roas",
    ].join(",");

    const adSetFields = [
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "inline_link_clicks",
      "outbound_clicks",
      "cpc",
      "ctr",
      "actions",
      "action_values",
      "purchase_roas",
    ].join(",");

    const adFields = [
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "inline_link_clicks",
      "outbound_clicks",
      "cpc",
      "ctr",
      "actions",
      "action_values",
      "purchase_roas",
    ].join(",");

    const [accountResult, campaignResult, adSetResult, adResult] = await Promise.allSettled([
      graphGet(`${adAccountId}/insights`, {
        ...dateParams,
        level: "account",
        fields: accountFields,
      }),
      graphGetAll(`${adAccountId}/insights`, {
        ...dateParams,
        level: "campaign",
        fields: campaignFields,
        limit: "100",
        sort: "spend_descending",
      }),
      graphGetAll(`${adAccountId}/insights`, {
        ...dateParams,
        level: "adset",
        fields: adSetFields,
        limit: "100",
        sort: "spend_descending",
      }),
      graphGetAll(`${adAccountId}/insights`, {
        ...dateParams,
        level: "ad",
        fields: adFields,
        limit: "100",
        sort: "spend_descending",
      }),
    ]);

    const sourceErrors = [
      settledError(accountResult, "account"),
      settledError(campaignResult, "campaign"),
      settledError(adSetResult, "adset"),
      settledError(adResult, "ad"),
    ].filter(Boolean);

    const accountInsights = settledData(accountResult, { data: [] } as any);
    const campaignInsights = settledData(campaignResult, [] as any[]);
    const adSetInsights = settledData(adSetResult, [] as any[]);
    const adInsights = settledData(adResult, [] as any[]);

    if (
      sourceErrors.length === 4 &&
      !accountInsights.data?.length &&
      !campaignInsights.length &&
      !adSetInsights.length &&
      !adInsights.length
    ) {
      throw new Error(sourceErrors.map((item: any) => `${item.section}: ${item.message}`).join(" | "));
    }

    const account = accountInsights.data?.[0] || {};
    const accountLeadBreakdown = actionBreakdown(account.actions);
    const accountEngagementBreakdown = engagementBreakdown(account.actions);
    const leads = accountLeadBreakdown.messageLeads + accountLeadBreakdown.formLeads;
    const accountReportedRevenue = actionValue(account.action_values, purchaseActionTypes);
    const accountReportedRoas = roasValue(account.purchase_roas);
    const spend = numberValue(account.spend);

    return NextResponse.json(
      {
        success: true,
        connected: true,
        range: {
          request: requestedRange,
          metaParams: dateParams,
        },
        source: {
          graphVersion: GRAPH_VERSION,
          adAccountId,
          accountRows: Array.isArray(accountInsights.data) ? accountInsights.data.length : 0,
          campaignRows: campaignInsights.length,
          adSetRows: adSetInsights.length,
          adRows: adInsights.length,
          partial: sourceErrors.length > 0,
          errors: sourceErrors,
        },
        totals: {
          spend,
          impressions: numberValue(account.impressions),
          reach: numberValue(account.reach),
          clicks: clickCount(account),
          cpc: numberValue(account.cpc),
          cpm: numberValue(account.cpm),
          ctr: numberValue(account.ctr),
          leads,
          messageLeads: accountLeadBreakdown.messageLeads,
          formLeads: accountLeadBreakdown.formLeads,
          leadBreakdown: accountLeadBreakdown.breakdown,
          engagementActions: accountEngagementBreakdown.total,
          engagementBreakdown: accountEngagementBreakdown.breakdown,
          metaReportedRevenue: accountReportedRevenue,
          metaReportedRoas: accountReportedRoas || (spend > 0 && accountReportedRevenue > 0 ? accountReportedRevenue / spend : 0),
          actionValues: valueBreakdown(account.action_values),
          purchaseRoas: valueBreakdown(account.purchase_roas),
          cpl: leads > 0 ? spend / leads : 0,
        },
        campaigns: campaignInsights.map((row: any) => {
          const rowLeadBreakdown = actionBreakdown(row.actions);
          const rowEngagementBreakdown = engagementBreakdown(row.actions);
          const rowLeads = rowLeadBreakdown.messageLeads + rowLeadBreakdown.formLeads;
          const rowSpend = numberValue(row.spend);
          const rowReportedRevenue = actionValue(row.action_values, purchaseActionTypes);
          const rowReportedRoas = roasValue(row.purchase_roas);
          return {
            id: row.campaign_id,
            name: row.campaign_name,
            spend: rowSpend,
            impressions: numberValue(row.impressions),
            reach: numberValue(row.reach),
            clicks: clickCount(row),
            cpc: numberValue(row.cpc),
            ctr: numberValue(row.ctr),
            leads: rowLeads,
            messageLeads: rowLeadBreakdown.messageLeads,
            formLeads: rowLeadBreakdown.formLeads,
            leadBreakdown: rowLeadBreakdown.breakdown,
            engagementActions: rowEngagementBreakdown.total,
            engagementBreakdown: rowEngagementBreakdown.breakdown,
            metaReportedRevenue: rowReportedRevenue,
            metaReportedRoas: rowReportedRoas || (rowSpend > 0 && rowReportedRevenue > 0 ? rowReportedRevenue / rowSpend : 0),
            actionValues: valueBreakdown(row.action_values),
            purchaseRoas: valueBreakdown(row.purchase_roas),
            cpl: rowLeads > 0 ? rowSpend / rowLeads : 0,
          };
        }),
        adSets: adSetInsights.map((row: any) => {
          const rowLeadBreakdown = actionBreakdown(row.actions);
          const rowEngagementBreakdown = engagementBreakdown(row.actions);
          const rowLeads = rowLeadBreakdown.messageLeads + rowLeadBreakdown.formLeads;
          const rowSpend = numberValue(row.spend);
          const rowReportedRevenue = actionValue(row.action_values, purchaseActionTypes);
          const rowReportedRoas = roasValue(row.purchase_roas);
          return {
            id: row.adset_id,
            name: row.adset_name,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            spend: rowSpend,
            impressions: numberValue(row.impressions),
            reach: numberValue(row.reach),
            clicks: clickCount(row),
            cpc: numberValue(row.cpc),
            ctr: numberValue(row.ctr),
            leads: rowLeads,
            messageLeads: rowLeadBreakdown.messageLeads,
            formLeads: rowLeadBreakdown.formLeads,
            leadBreakdown: rowLeadBreakdown.breakdown,
            engagementActions: rowEngagementBreakdown.total,
            engagementBreakdown: rowEngagementBreakdown.breakdown,
            metaReportedRevenue: rowReportedRevenue,
            metaReportedRoas: rowReportedRoas || (rowSpend > 0 && rowReportedRevenue > 0 ? rowReportedRevenue / rowSpend : 0),
            actionValues: valueBreakdown(row.action_values),
            purchaseRoas: valueBreakdown(row.purchase_roas),
            cpl: rowLeads > 0 ? rowSpend / rowLeads : 0,
          };
        }),
        ads: adInsights.map((row: any) => {
          const rowLeadBreakdown = actionBreakdown(row.actions);
          const rowEngagementBreakdown = engagementBreakdown(row.actions);
          const rowLeads = rowLeadBreakdown.messageLeads + rowLeadBreakdown.formLeads;
          const rowSpend = numberValue(row.spend);
          const rowReportedRevenue = actionValue(row.action_values, purchaseActionTypes);
          const rowReportedRoas = roasValue(row.purchase_roas);
          return {
            id: row.ad_id,
            name: row.ad_name,
            adSetId: row.adset_id,
            adSetName: row.adset_name,
            campaignId: row.campaign_id,
            campaignName: row.campaign_name,
            spend: rowSpend,
            impressions: numberValue(row.impressions),
            reach: numberValue(row.reach),
            clicks: clickCount(row),
            cpc: numberValue(row.cpc),
            ctr: numberValue(row.ctr),
            leads: rowLeads,
            messageLeads: rowLeadBreakdown.messageLeads,
            formLeads: rowLeadBreakdown.formLeads,
            leadBreakdown: rowLeadBreakdown.breakdown,
            engagementActions: rowEngagementBreakdown.total,
            engagementBreakdown: rowEngagementBreakdown.breakdown,
            metaReportedRevenue: rowReportedRevenue,
            metaReportedRoas: rowReportedRoas || (rowSpend > 0 && rowReportedRevenue > 0 ? rowReportedRevenue / rowSpend : 0),
            actionValues: valueBreakdown(row.action_values),
            purchaseRoas: valueBreakdown(row.purchase_roas),
            cpl: rowLeads > 0 ? rowSpend / rowLeads : 0,
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Meta Marketing API failed", error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูล Meta Ads ได้",
        requiredEnv: {
          adAccount: adAccountKeys,
          accessToken: accessTokenKeys,
        },
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
