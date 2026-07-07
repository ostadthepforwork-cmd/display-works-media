import { NextResponse } from "next/server";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function base64Url(input: string | ArrayBuffer) {
  const buffer = typeof input === "string" ? Buffer.from(input) : Buffer.from(input);
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getPrivateKey() {
  return (process.env.GA4_PRIVATE_KEY || "").replace(/\\n/g, "\n");
}

function pemToArrayBuffer(pem: string) {
  const body = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  return Buffer.from(body, "base64");
}

async function createJwt(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedJwt = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt)
  );
  return `${unsignedJwt}.${base64Url(signature)}`;
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const assertion = await createJwt(clientEmail, privateKey);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.error || `OAuth failed with ${response.status}`);
  }
  return data.access_token as string;
}

async function runReport(accessToken: string, propertyId: string, body: unknown) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `GA4 report failed with ${response.status}`);
  }
  return data;
}

const metricValue = (row: any, index: number) => Number(row?.metricValues?.[index]?.value || 0);
const dimensionValue = (row: any, index: number) => String(row?.dimensionValues?.[index]?.value || "");

function dateRangesFromRequest(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  if (startDate && endDate) return [{ startDate, endDate }];
  return [{ startDate: "30daysAgo", endDate: "today" }];
}

export async function GET(request: Request) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!propertyId || !clientEmail || !privateKey) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "ยังไม่ได้ตั้งค่า GA4_PROPERTY_ID, GA4_CLIENT_EMAIL หรือ GA4_PRIVATE_KEY",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);
    const dateRanges = dateRangesFromRequest(request);

    const [overview, traffic, topPages] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "eventCount" },
        ],
      }),
      runReport(accessToken, propertyId, {
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }, { name: "sessionSourceMedium" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runReport(accessToken, propertyId, {
        dateRanges,
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
    ]);

    const overviewRow = overview.rows?.[0];

    return NextResponse.json(
      {
        success: true,
        connected: true,
        range: dateRanges[0],
        totals: {
          activeUsers: metricValue(overviewRow, 0),
          sessions: metricValue(overviewRow, 1),
          pageViews: metricValue(overviewRow, 2),
          events: metricValue(overviewRow, 3),
        },
        traffic: (traffic.rows || []).map((row: any) => ({
          channel: dimensionValue(row, 0),
          sourceMedium: dimensionValue(row, 1),
          sessions: metricValue(row, 0),
          activeUsers: metricValue(row, 1),
        })),
        topPages: (topPages.rows || []).map((row: any) => ({
          path: dimensionValue(row, 0),
          title: dimensionValue(row, 1),
          pageViews: metricValue(row, 0),
          activeUsers: metricValue(row, 1),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GA4 API failed", error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูล GA4 ได้",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
