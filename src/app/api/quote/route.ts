import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, lineId, serviceType, width, height, quantity, details, needDate } = body;

    if (!name || !phone || !serviceType) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น" }, { status: 400 });
    }

    // บันทึกลง Supabase
    await supabase.from("quote_requests").insert([{
      name,
      phone,
      line_id: lineId,
      service_type: serviceType,
      width,
      height,
      quantity,
      details,
      need_date: needDate || null,
    }]);

    // แจ้งเตือนทาง Email ผ่าน Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: process.env.NOTIFY_EMAIL,
        subject: `📋 ใบเสนอราคาใหม่จาก ${name}`,
        html: `
          <h2>📋 ใบเสนอราคาใหม่!</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #ddd"><b>👤 ชื่อ</b></td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>📞 โทร</b></td><td style="padding:8px;border:1px solid #ddd">${phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>💬 LINE</b></td><td style="padding:8px;border:1px solid #ddd">${lineId || "-"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>🖨️ บริการ</b></td><td style="padding:8px;border:1px solid #ddd">${serviceType}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>📐 ขนาด</b></td><td style="padding:8px;border:1px solid #ddd">${width || "-"} x ${height || "-"} cm</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>🔢 จำนวน</b></td><td style="padding:8px;border:1px solid #ddd">${quantity || 1} ชิ้น</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>📅 วันที่ต้องการ</b></td><td style="padding:8px;border:1px solid #ddd">${needDate || "-"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><b>📝 รายละเอียด</b></td><td style="padding:8px;border:1px solid #ddd">${details || "-"}</td></tr>
          </table>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
