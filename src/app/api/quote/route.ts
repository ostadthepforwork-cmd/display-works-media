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
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getSupabase() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
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
    const body = (await req.json()) as QuotePayload;
    const name = cleanText(body.name, 120);
    const phone = cleanText(body.phone, 40);
    const lineId = cleanText(body.lineId, 80);
    const serviceType = cleanText(body.serviceType, 120);
    const width = cleanText(body.width, 20);
    const height = cleanText(body.height, 20);
    const quantity = Number(body.quantity) > 0 ? Number(body.quantity) : 1;
    const details = cleanText(body.details, 2000);
    const needDate = cleanText(body.needDate, 20);

    if (!name || !phone || !serviceType) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ เบอร์โทร และประเภทสินค้า" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
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
      },
    ]);

    if (insertError) {
      console.error("quote insert failed", insertError);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 502 }
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

    return NextResponse.json({
      success: true,
      notifications: notificationErrors.length ? "partial" : "sent",
    });
  } catch (error) {
    console.error("quote request failed", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
