"use client";

import { motion } from "framer-motion";

const reasons = [
  {
    num: "01",
    title: "ประสบการณ์จริง ไม่ใช่แค่คำพูด",
    desc: "ทีมงานที่ผ่านงานพิมพ์หลายร้อยโปรเจกต์ รู้จักปัญหา รู้วิธีแก้ไข และให้คำแนะนำก่อนผลิตจริงทุกครั้ง",
  },
  {
    num: "02",
    title: "ตอบไวภายใน 24 ชั่วโมง",
    desc: "เราเข้าใจว่าธุรกิจไม่รอ ทีมงานพร้อมตอบคำถาม ประเมินราคา และให้คำแนะนำภายใน 24 ชั่วโมง",
  },
  {
    num: "03",
    title: "จัดส่งทั่วประเทศ มีระบบติดตาม",
    desc: "ส่งถึงมือคุณทุกจังหวัดในประเทศไทย มีบริการแจ้งเลขพัสดุ ติดตามสินค้าได้ตลอดเวลา",
  },
  {
    num: "04",
    title: "คุณภาพระดับมืออาชีพ",
    desc: "พาร์ทเนอร์การผลิตที่เราคัดสรรมาคุณภาพสูง มาตรฐานสม่ำเสมอทุกชิ้นงาน ทุกออเดอร์",
  },
  {
    num: "05",
    title: "สั่งออนไลน์ ง่ายทุกขั้นตอน",
    desc: "ระบบการสั่งงานที่ออกแบบมาให้ง่ายที่สุด ไม่ต้องเดินทาง ไม่ต้องนัดหมาย ทำได้ทุกที่ทุกเวลา",
  },
  {
    num: "06",
    title: "ให้คำแนะนำฟรีก่อนตัดสินใจ",
    desc: "ไม่แน่ใจว่าเลือกวัสดุแบบไหน ขนาดเท่าไหร่ดี ทีมงานยินดีให้คำปรึกษาฟรีก่อนทุกครั้ง",
  },
];

export default function WhyUs() {
  return (
    <section
      id="about"
      className="py-24 px-6 lg:px-8"
      style={{ background: "#141A24" }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">ทำไมต้องเรา</div>
          <h2 className="section-title">
            เหตุผลที่ลูกค้าเลือก
            <br />
            Display Works Media
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {reasons.map((r, i) => (
            <motion.div
              key={r.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex gap-5 p-8 rounded-xl border transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#0B0F19",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,107,0,0.3)";
                (e.currentTarget as HTMLElement).style.background = "#141A24";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.background = "#0B0F19";
              }}
            >
              <div
                className="font-kanit font-extrabold text-5xl leading-none flex-shrink-0 transition-colors duration-300"
                style={{ color: "rgba(255,107,0,0.15)" }}
              >
                {r.num}
              </div>
              <div>
                <h3 className="font-semibold text-white text-base mb-2">
                  {r.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
