// Server Component — ไม่ใช้ framer-motion ป้องกัน hydration mismatch

// ป้องกัน hydration mismatch ที่ทำให้ต้อง refresh 2 รอบ
import { FileCheck2, MessagesSquare, Truck } from "lucide-react";

const trustFeatures = [
  { icon: MessagesSquare, main: "ปรึกษาก่อนตัดสินใจ", sub: "ช่วยเลือกวัสดุและรูปแบบที่เหมาะกับงาน" },
  { icon: FileCheck2, main: "ตรวจไฟล์ก่อนผลิต", sub: "ลดความผิดพลาดก่อนเริ่มงานจริง" },
  { icon: Truck, main: "จัดส่งทั่วประเทศ", sub: "แจ้งรายละเอียดและติดตามสถานะได้" },
];

export default function TrustBar() {
  return (
    <section
      style={{
        background: "#0D121A",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="py-7">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-0">
            {trustFeatures.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="reveal-item flex items-center gap-4 md:px-8 first:md:pl-0 last:md:pr-0">
                  {i > 0 && (
                    <div
                      className="hidden lg:block w-px h-10 self-center"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,101,0,0.1)" }}
                    >
                      <Icon size={22} style={{ color: "#FF6500" }} />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white leading-tight">{item.main}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#A8B0C0" }}>{item.sub}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
