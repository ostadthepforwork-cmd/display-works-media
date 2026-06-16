import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type QuotePayload = {
  name?: string;
  phone?: string;
  lineId?: string;
  serviceType?: string;
  width?: string;
  height?: string;
  quantity?: number | string;
  details?: string;
  needDate?: string;
  website?: string;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(["ai", "pdf", "psd", "jpg", "jpeg", "png"]);
const quoteRateLimits = new Map<string, { count: number; resetAt: number }>();

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getSupabase() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    process.env.SUPABASE_SERVICE_ROLE_KEY || requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function cleanText(value: unknown, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function escapeHtml(value: unknown) {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${url} failed with ${response.status}: ${text.slice(0, 300)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const isMultipart = req.headers.get("content-type")?.includes("multipart/form-data");
    let body: QuotePayload;
    let artwork: File | null = null;

    if (isMultipart) {
      const form = await req.formData();
      body = {
        name: cleanText(form.get("name"), 120),
        phone: cleanText(form.get("phone"), 40),
        lineId: cleanText(form.get("lineId"), 80),
        serviceType: cleanText(form.get("serviceType"), 120),
        width: cleanText(form.get("width"), 20),
        height: cleanText(form.get("height"), 20),
        quantity: cleanText(form.get("quantity"), 20),
        needDate: cleanText(form.get("needDate"), 20),
        details: cleanText(form.get("details"), 2000),
        website: cleanText(form.get("website"), 200),
      };
      const candidate = form.get("artwork");
      artwork = candidate instanceof File && candidate.size > 0 ? candidate : null;
    } else {
      body = (await req.json()) as QuotePayload;
    }

    if (cleanText(body.website, 200)) {
      return NextResponse.json({ success: true });
    }

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientId = forwardedFor || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    if (quoteRateLimits.size > 1000) {
      quoteRateLimits.forEach((entry, key) => {
        if (entry.resetAt <= now) quoteRateLimits.delete(key);
      });
    }
    const current = quoteRateLimits.get(clientId);
    if (!current || current.resetAt <= now) {
      quoteRateLimits.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else if (current.count >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "ส่งข้อมูลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    } else {
      current.count += 1;
    }

    const name = cleanText(body.name, 120);
    const phone = cleanText(body.phone, 40);
    const lineId = cleanText(body.lineId, 80);
    const serviceType = cleanText(body.serviceType, 120);
    const width = cleanText(body.width, 20);
    const height = cleanText(body.height, 20);
    const quantity = Number(body.quantity) > 0 ? Number(body.quantity) : 1;
    const details = cleanText(body.details, 2000);
    const needDate = cleanText(body.needDate, 20);

    const phoneDigits = phone.replace(/\D/g, "");
    if (!name || phoneDigits.length < 9 || phoneDigits.length > 15 || !serviceType) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ เบอร์โทร และประเภทสินค้า" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = getSupabase();
    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let attachmentUrl: string | null = null;

    if (artwork) {
      const extension = artwork.name.split(".").pop()?.toLowerCase() || "";
      if (artwork.size > MAX_ATTACHMENT_SIZE || !ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
        return NextResponse.json(
          { error: "รองรับไฟล์ AI, PDF, PSD, JPG และ PNG ขนาดไม่เกิน 20 MB" },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        return NextResponse.json(
          { error: "ระบบแนบไฟล์ยังไม่พร้อมใช้งาน กรุณาติดต่อผ่าน LINE" },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }

      const storageClient = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      attachmentName = artwork.name.slice(0, 255);
      const safeName = attachmentName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const month = new Date().toISOString().slice(0, 7);
      attachmentPath = `${month}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await storageClient.storage
        .from("quote-attachments")
        .upload(attachmentPath, new Uint8Array(await artwork.arrayBuffer()), {
          contentType: artwork.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("quote attachment upload failed", uploadError);
        return NextResponse.json(
          { error: "อัปโหลดไฟล์แนบไม่สำเร็จ กรุณาลองอีกครั้ง" },
          { status: 502, headers: { "Cache-Control": "no-store" } }
        );
      }

      const { data: signedData } = await storageClient.storage
        .from("quote-attachments")
        .createSignedUrl(attachmentPath, 7 * 24 * 60 * 60);
      attachmentUrl = signedData?.signedUrl || null;
    }

    const { error: insertError } = await supabase.from("quote_requests").insert([
      {
        name,
        phone,
        line_id: lineId || null,
        service_type: serviceType,
        width: width || null,
        height: height || null,
        quantity,
        details: details || null,
        need_date: needDate || null,
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
      },
    ]);

    if (insertError) {
      if (attachmentPath && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase.storage.from("quote-attachments").remove([attachmentPath]).catch(() => undefined);
      }
      console.error("quote insert failed", insertError);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const notificationErrors: string[] = [];

    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      try {
        await sendJson("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "Display Works Media <onboarding@resend.dev>",
            to: process.env.NOTIFY_EMAIL,
            subject: `ใบเสนอราคาใหม่จาก ${name}`,
            html: `
              <h2>ใบเสนอราคาใหม่</h2>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:8px;border:1px solid #ddd"><b>ชื่อ</b></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(name)}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>โทร</b></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(phone)}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>LINE</b></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(lineId || "-")}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>บริการ</b></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(serviceType)}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>ขนาด</b></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(width || "-")} x ${escapeHtml(height || "-")} cm</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>จำนวน</b></td><td style="padding:8px;border:1px solid #ddd">${quantity} ชิ้น</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>วันที่ต้องการ</b></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(needDate || "-")}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>รายละเอียด</b></td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${escapeHtml(details || "-")}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd"><b>ไฟล์แนบ</b></td><td style="padding:8px;border:1px solid #ddd">${attachmentUrl ? `<a href="${escapeHtml(attachmentUrl)}">${escapeHtml(attachmentName || "เปิดไฟล์แนบ")}</a>` : "-"}</td></tr>
              </table>
            `,
          }),
        });
      } catch (error) {
        console.error("resend notification failed", error);
        notificationErrors.push("email");
      }
    }

    if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_USER_ID) {
      try {
        await sendJson("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: process.env.LINE_USER_ID,
            messages: [
              {
                type: "text",
                text: [
                  "ใบเสนอราคาใหม่",
                  `ชื่อ: ${name}`,
                  `โทร: ${phone}`,
                  `LINE: ${lineId || "-"}`,
                  `บริการ: ${serviceType}`,
                  `ขนาด: ${width || "-"} x ${height || "-"} cm`,
                  `จำนวน: ${quantity} ชิ้น`,
                  `วันที่ต้องการ: ${needDate || "-"}`,
                  `รายละเอียด: ${details || "-"}`,
                  `ไฟล์แนบ: ${attachmentUrl || "-"}`,
                ].join("\n"),
              },
            ],
          }),
        });
      } catch (error) {
        console.error("line notification failed", error);
        notificationErrors.push("line");
      }
    }

    return NextResponse.json(
      {
        success: true,
        notifications: notificationErrors.length ? "partial" : "sent",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("quote request failed", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
