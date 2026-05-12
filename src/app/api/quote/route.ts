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

    // แจ้ง LINE Notify
    await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINE_NOTIFY_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        message: `\n📋 ใบเสนอราคาใหม่!\n👤 ชื่อ: ${name}\n📞 โทร: ${phone}\n💬 LINE: ${lineId || "-"}\n🖨️ บริการ: ${serviceType}\n📐 ขนาด: ${width || "-"} x ${height || "-"} cm\n🔢 จำนวน: ${quantity || 1} ชิ้น\n📝 รายละเอียด: ${details || "-"}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}