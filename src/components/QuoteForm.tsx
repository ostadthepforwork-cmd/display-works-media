"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Send, CheckCircle, Upload } from "lucide-react";

type FormData = {
  name: string;
  phone: string;
  lineId: string;
  serviceType: string;
  width: string;
  height: string;
  quantity: number;
  details: string;
  needDate: string;
};

const services = [
  "ป้ายไวนิล",
  "Sticker Indoor",
  "Sticker Outdoor",
  "PP Board",
  "Roll Up",
  "X-Stand",
  "Backdrop",
  "Standee",
  "อื่นๆ",
];

export default function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          lineId: data.lineId,
          serviceType: data.serviceType,
          width: data.width,
          height: data.height,
          quantity: data.quantity,
          details: data.details,
          needDate: data.needDate,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch (_error) {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="quote"
      className="py-24 px-6 lg:px-8"
      style={{ background: "#0B0F19" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          {/* Left info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="section-label">ขอใบเสนอราคา</div>
            <h2 className="section-title">
              มีงานอยู่?
              <br />
              เราช่วยดูแลให้
            </h2>
            <p className="section-sub mb-10">
              กรอกรายละเอียดงาน ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
            </p>

            <div className="flex flex-col gap-4">
              {[
                "ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา",
                "ตอบกลับภายใน 24 ชั่วโมง",
                "ให้คำปรึกษาฟรีก่อนตัดสินใจ",
                "ไม่ต้องมีไฟล์งาน สามารถบอกแนวคิดได้เลย",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={18} style={{ color: "#FF6B00", flexShrink: 0 }} />
                  <span className="text-muted text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div
              className="mt-10 p-6 rounded-xl border"
              style={{
                background: "#141A24",
                borderColor: "rgba(255,107,0,0.2)",
              }}
            >
              <div className="text-sm font-semibold text-white mb-3">
                ติดต่อด่วน
              </div>
              <a
                href="https://lin.ee/O0nPl03"
                className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-2"
              >
                💬 LINE: @displayworks
              </a>
              <a
                href="tel:0659161539"
                className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-2"
              >
                📞 065-916-1539
              </a>
              <a
                href="mailto:info.displayworksmedia@gmail.com"
                className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
              >
                ✉️ info.displayworksmedia@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-3"
          >
            <div
              className="p-10 rounded-2xl border"
              style={{
                background: "#141A24",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
                  <CheckCircle size={56} style={{ color: "#FF6B00" }} />
                  <h3 className="font-kanit font-bold text-2xl text-white">
                    ส่งข้อมูลสำเร็จ!
                  </h3>
                  <p className="text-muted text-sm max-w-xs">
                    ทีมงานได้รับข้อมูลของคุณแล้ว
                    จะติดต่อกลับภายใน 24 ชั่วโมง
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-sm underline"
                    style={{ color: "#FF6B00" }}
                  >
                    ส่งใบเสนอราคาอีกครั้ง
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        {...register("name", { required: true })}
                        placeholder="ชื่อของคุณ"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-colors"
                        style={{
                          background: "#0d1220",
                          border: `1px solid ${errors.name ? "#FF4444" : "rgba(255,255,255,0.08)"}`,
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = errors.name
                            ? "#FF4444"
                            : "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        เบอร์โทรศัพท์ *
                      </label>
                      <input
                        {...register("phone", { required: true })}
                        placeholder="08X-XXX-XXXX"
                        type="tel"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: `1px solid ${errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)"}`,
                          fontFamily: "'Prompt', sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = errors.phone
                            ? "#FF4444"
                            : "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        LINE ID
                      </label>
                      <input
                        {...register("lineId")}
                        placeholder="@lineid"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontFamily: "'Prompt', sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ประเภทสินค้า *
                      </label>
                      <select
                        {...register("serviceType", { required: true })}
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: `1px solid ${errors.serviceType ? "#FF4444" : "rgba(255,255,255,0.08)"}`,
                          fontFamily: "'Prompt', sans-serif",
                        }}
                      >
                        <option value="">เลือกประเภท</option>
                        {services.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ขนาดกว้าง (cm)
                      </label>
                      <input
                        {...register("width")}
                        placeholder="เช่น 100"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontFamily: "'Prompt', sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ขนาดสูง (cm)
                      </label>
                      <input
                        {...register("height")}
                        placeholder="เช่น 200"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontFamily: "'Prompt', sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        จำนวน (ชิ้น)
                      </label>
                      <input
                        {...register("quantity")}
                        type="number"
                        min={1}
                        placeholder="1"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontFamily: "'Prompt', sans-serif",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        วันที่ต้องการรับงาน
                      </label>
                      <input
                        {...register("needDate")}
                        type="date"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: "#0d1220",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontFamily: "'Prompt', sans-serif",
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                      รายละเอียดเพิ่มเติม
                    </label>
                    <textarea
                      {...register("details")}
                      rows={4}
                      placeholder="รายละเอียดงาน วัสดุ ความต้องการพิเศษ หรือสิ่งที่อยากให้เราทราบ..."
                      className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-y"
                      style={{
                        background: "#0d1220",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontFamily: "'Prompt', sans-serif",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "rgba(255,107,0,0.5)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                      }
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                      แนบไฟล์ (ถ้ามี)
                    </label>
                    <label
                      className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed cursor-pointer transition-colors duration-200 hover:border-orange-DEFAULT/50"
                      style={{ borderColor: "rgba(255,107,0,0.25)" }}
                    >
                      <Upload size={24} className="text-muted mb-2" />
                      <span className="text-muted text-sm">
                        คลิกเพื่ออัปโหลดไฟล์ หรือลากวางที่นี่
                      </span>
                      <span className="text-xs mt-1" style={{ color: "rgba(168,176,192,0.5)" }}>
                        รองรับ AI, PDF, PSD, JPG, PNG (สูงสุด 50MB)
                      </span>
                      <input type="file" className="hidden" accept=".ai,.pdf,.psd,.jpg,.jpeg,.png" />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-white text-base transition-all duration-200 disabled:opacity-70"
                    style={{
                      background: loading ? "#CC5500" : "#FF6B00",
                      boxShadow: "0 4px 20px rgba(255,107,0,0.25)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLElement).style.background =
                          "#FF8C33";
                    }}
                    onMouseLeave={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLElement).style.background =
                          "#FF6B00";
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังส่งข้อมูล...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        ส่งข้อมูลขอใบเสนอราคา
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs" style={{ color: "#A8B0C0" }}>
                    ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง •
                    ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
