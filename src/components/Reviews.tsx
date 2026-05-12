"use client";

import { motion } from "framer-motion";

const reviews = [
  {
    initials: "ก",
    name: "คุณกตัญญู",
    role: "เจ้าของร้านอาหาร",
    text: "งานสวย ตรงตามแบบ ส่งไวมาก มีแจ้งทุกขั้นตอน ไม่ต้องถามเองเลย ประทับใจมากครับ ใช้บริการซ้ำมาหลายครั้งแล้ว",
  },
  {
    initials: "ข",
    name: "คุณขวัญ",
    role: "เจ้าของร้านกาแฟ",
    text: "คุณภาพงานพิมพ์ดีมาก สติ๊กเกอร์ติดดีนะ ใช้งานได้นานมาก สีสดใสไม่ซีดจาง แนะนำให้เพื่อนหลายคนแล้วทุกคนพอใจ",
  },
  {
    initials: "จ",
    name: "คุณจุฬา",
    role: "Marketing Manager",
    text: "บริการเป็นกันเอง ตอบไว งานออกมาน่าประทับใจมาก ช่วยแนะนำแบบให้ด้วย ได้งานดีกว่าที่คาดไว้มาก",
  },
  {
    initials: "ด",
    name: "คุณดวงใจ",
    role: "Event Organizer",
    text: "สั่งทำ Backdrop สำหรับงาน Event ใหญ่ งานออกมาสวยมาก สีสดใส คมชัด ส่งตรงเวลา ไม่มีปัญหาเลย ขอบคุณมากครับ",
  },
  {
    initials: "ต",
    name: "คุณตั้ม",
    role: "เจ้าของ SME",
    text: "ราคาเป็นธรรม คุณภาพดีกว่าที่คิด ทีมงานให้คำแนะนำดีมากก่อนสั่งพิมพ์ ทำให้ได้งานที่ตรงใจที่สุด",
  },
  {
    initials: "ถ",
    name: "คุณถาวร",
    role: "ผู้จัดการร้านค้า",
    text: "เคยสั่งจากที่อื่นมาก่อน แต่พอมาลองที่นี่แล้ว ไม่ไปที่อื่นอีกแล้ว คุณภาพและบริการดีกว่ามาก คุ้มค่าทุกบาท",
  },
];

export default function Reviews() {
  return (
    <section className="py-24 px-6 lg:px-8" style={{ background: "#0B0F19" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">รีวิวลูกค้า</div>
          <h2 className="section-title">
            ความไว้วางใจ คือ
            <br />
            สิ่งที่เราภูมิใจที่สุด
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative p-7 rounded-xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#141A24",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,107,0,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.08)";
              }}
            >
              {/* Big quote mark */}
              <div
                className="absolute top-0 right-4 font-kanit font-extrabold leading-none pointer-events-none select-none"
                style={{ fontSize: "100px", color: "rgba(255,107,0,0.06)" }}
              >
                &quot;
              </div>

              {/* Stars */}
              <div
                className="text-sm tracking-widest mb-4"
                style={{ color: "#FF6B00" }}
              >
                ★★★★★
              </div>

              {/* Text */}
              <p className="text-muted text-sm leading-relaxed mb-6 italic relative z-10">
                &quot;{r.text}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF6B00, #FF3D00)",
                  }}
                >
                  {r.initials}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">
                    {r.name}
                  </div>
                  <div className="text-muted text-xs">{r.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
