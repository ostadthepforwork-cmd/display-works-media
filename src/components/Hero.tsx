import { ArrowRight, Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

const trustPoints = [
  "ออกแบบ ผลิต ติดตั้ง ครบจบในที่เดียว",
  "บริการหลังการขายครบวงจร",
  "จัดส่งทั่วประเทศ พร้อมแจ้งเลขพัสดุ",
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[720px] items-center overflow-hidden lg:min-h-[760px]"
      style={{ background: "#0B0F19" }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg-home.jpg"
          alt="Display Works Media"
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,15,25,0.95) 40%, rgba(11,15,25,0.7) 70%, rgba(11,15,25,0.5) 100%)",
          }}
        />
      </div>

      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8"
        style={{ paddingTop: "96px", paddingBottom: "56px" }}
      >
        <div className="max-w-3xl">

          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 mb-6 sm:mb-8">
            <div
              className="px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-[2px] sm:tracking-[3px] uppercase border"
              style={{
                background: "rgba(255,107,0,0.1)",
                borderColor: "rgba(255,107,0,0.3)",
                color: "#FF6B00",
              }}
            >
              DISPLAY WORKS MEDIA
            </div>
          </div>

          {/* Headline */}
          <h1
            className="hero-h1 font-kanit font-extrabold leading-[1.1] mb-5 sm:mb-6 text-white"
            style={{ fontSize: "clamp(32px, 7vw, 72px)" }}
          >
            ผลิตสื่อโฆษณา
            <br />
            <span style={{ color: "#FF6B00" }}>ครบวงจร</span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-sub leading-relaxed mb-6 sm:mb-8"
            style={{
              fontSize: "clamp(13px, 2.5vw, 17px)",
              maxWidth: "480px",
              color: "#A8B0C0",
            }}
          >
            ออกแบบ ผลิต ติดตั้ง งานป้าย ร้านค้า และสื่อโฆษณาทุกประเภท
            พร้อมทีมงานมืออาชีพดูแลตลอดกระบวนการ
          </p>

          {/* Trust points */}
          <div className="hero-trust flex flex-col gap-2 mb-8 sm:mb-10">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-3">
                <CheckCircle2
                  size={15}
                  style={{ color: "#FF6B00", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: "clamp(12px, 2vw, 14px)",
                    color: "#C8D0DC",
                  }}
                >
                  {point}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hero-cta flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5">
            <a
              href="#quote"
              className="group inline-flex items-center justify-center gap-2 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
              style={{
                background: "#FF6B00",
                boxShadow: "0 4px 24px rgba(255,107,0,0.3)",
                fontSize: "15px",
              }}
            >
              ขอใบเสนอราคา
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center justify-center gap-2 text-white font-medium px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border transition-all duration-200 hover:bg-white/5 w-full sm:w-auto"
              style={{
                borderColor: "rgba(255,255,255,0.2)",
                fontSize: "15px",
              }}
            >
              ดูผลงานของเรา
            </a>
          </div>

          {/* Quick contact */}
          <div
            className="hero-contact inline-flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5"
            style={{ color: "#A8B0C0", fontSize: "13px", background: "rgba(11,15,25,0.72)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <a
              href="tel:0659161539"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:text-white transition-colors"
            >
              <Phone size={14} style={{ color: "#FF6B00" }} /> 065-916-1539
            </a>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:text-white transition-colors"
            >
              <MessageCircle size={14} style={{ color: "#06C755" }} />{" "}
              ปรึกษาฟรีผ่าน LINE
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator — hidden on mobile */}
      <div className="hero-scroll absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 opacity-40 xl:flex">
        <div
          className="text-xs tracking-widest uppercase"
          style={{ color: "#A8B0C0" }}
        >
          scroll
        </div>
        <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1">
          <div
            className="hero-scroll-dot w-1 h-2 rounded-full"
            style={{ background: "#FF6B00" }}
          />
        </div>
      </div>
    </section>
  );
}
