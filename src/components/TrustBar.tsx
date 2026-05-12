"use client";

import { ShoppingCart, Zap, UserCheck, Truck } from "lucide-react";

const items = [
  {
    icon: ShoppingCart,
    main: "สั่งออนไลน์ 100%",
    sub: "ไม่ต้องเดินทาง สะดวกทุกที่",
  },
  {
    icon: Zap,
    main: "งานไว ตรงเวลา",
    sub: "ตามที่ตกลงไว้ทุกครั้ง",
  },
  {
    icon: UserCheck,
    main: "ดูแลเคสส่วนตัว",
    sub: "มี Project Manager ดูแลตลอด",
  },
  {
    icon: Truck,
    main: "จัดส่งทั่วประเทศ",
    sub: "พร้อมแจ้งเลขพัสดุทุกออเดอร์",
  },
];

export default function TrustBar() {
  return (
    <div
      className="border-t border-b"
      style={{
        background: "#141A24",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-center gap-6 lg:gap-14">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-4">
              {i > 0 && (
                <div
                  className="hidden lg:block w-px h-10 self-center"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
              )}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,107,0,0.1)" }}
                >
                  <Icon size={28} style={{ color: "#FF6B00" }} />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {item.main}
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: "#A8B0C0" }}>
                    {item.sub}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
