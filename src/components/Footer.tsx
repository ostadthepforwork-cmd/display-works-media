"use client";

import Image from "next/image";
import { MessageCircle, Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "#services" },
  { label: "ผลงานของเรา", href: "#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "#process" },
  { label: "เกี่ยวกับเรา", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

const serviceLinks = [
  "ป้ายไวนิล",
  "Sticker Indoor / Outdoor",
  "PP Board / Standee",
  "Roll Up / X-stand",
  "Backdrop",
  "ฉลากสินค้า",
];

const socials = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/profile.php?id=61581015452518",
    label: "Facebook",
    hoverBg: "#1877F2",
  },
  {
    icon: MessageCircle,
    href: "https://lin.ee/O0nPl03",
    label: "LINE",
    hoverBg: "#06C755",
  },
  {
    icon: Instagram,
    href: "https://instagram.com",
    label: "Instagram",
    hoverBg: "#E1306C",
  },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      style={{
        background: "#080B13",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Top CTA strip */}
      <div
        className="py-8 px-6 lg:px-8"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-kanit font-bold text-white text-lg">
              พร้อมเริ่มโปรเจกต์แล้วหรือยัง?
            </p>
            <p className="text-sm" style={{ color: "#A8B0C0" }}>
              ประเมินราคาฟรี ตอบกลับภายใน 24 ชั่วโมง
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#06C755",
                boxShadow: "0 4px 16px rgba(6,199,85,0.25)",
              }}
            >
              <MessageCircle size={16} />
              LINE
            </a>
            <a
              href="#quote"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-black transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#FF6B00",
                boxShadow: "0 4px 16px rgba(255,107,0,0.25)",
              }}
            >
              ขอใบเสนอราคา
            </a>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 sm:pt-14 pb-8 sm:pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Display Works Media"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-kanit font-bold text-sm tracking-wider text-white leading-none">
                  DISPLAY WORKS
                </div>
                <div
                  className="font-kanit font-bold text-sm tracking-wider leading-none"
                  style={{ color: "#FF6B00" }}
                >
                  MEDIA
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-6" style={{ color: "#A8B0C0" }}>
              บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร
              ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5">
              {socials.map(({ icon: Icon, href, label, hoverBg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "#141A24",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#A8B0C0",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = hoverBg;
                    (e.currentTarget as HTMLElement).style.borderColor = hoverBg;
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#141A24";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.color = "#A8B0C0";
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-5 text-white">
              เมนู
            </h4>
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: "#A8B0C0" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-5 text-white">
              บริการของเรา
            </h4>
            <div className="flex flex-col gap-3">
              {serviceLinks.map((s) => (
                <a
                  key={s}
                  href="#services"
                  className="text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: "#A8B0C0" }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-5 text-white">
              ติดต่อเรา
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm transition-colors hover:text-white"
                style={{ color: "#A8B0C0" }}
              >
                <MessageCircle
                  size={16}
                  style={{ color: "#06C755", flexShrink: 0, marginTop: "2px" }}
                />
                LINE @displayworks
              </a>
              <a
                href="tel:0659161539"
                className="flex items-start gap-3 text-sm transition-colors hover:text-white"
                style={{ color: "#A8B0C0" }}
              >
                <Phone
                  size={16}
                  style={{ color: "#FF6B00", flexShrink: 0, marginTop: "2px" }}
                />
                065-916-1539
              </a>
              <a
                href="mailto:info.displayworksmedia@gmail.com"
                className="flex items-start gap-3 text-sm transition-colors hover:text-white"
                style={{ color: "#A8B0C0" }}
              >
                <Mail
                  size={16}
                  style={{ color: "#FF6B00", flexShrink: 0, marginTop: "2px" }}
                />
                info.displayworksmedia@gmail.com
              </a>
              <div
                className="flex items-start gap-3 text-sm"
                style={{ color: "#A8B0C0" }}
              >
                <MapPin
                  size={16}
                  style={{ color: "#FF6B00", flexShrink: 0, marginTop: "2px" }}
                />
                ให้บริการทั่วประเทศไทย
              </div>
            </div>

            {/* Hours */}
            <div
              className="mt-5 p-4 rounded-xl text-xs"
              style={{
                background: "#141A24",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#A8B0C0",
              }}
            >
              <div className="font-semibold text-white mb-1.5">
                เวลาทำการ
              </div>
              <div>จันทร์ – เสาร์: 9:00 – 18:00</div>
              <div>ตอบ LINE ทุกวัน ตลอด 24 ชม.</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row justify-between items-center gap-3 pt-8 border-t text-xs"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            color: "#A8B0C0",
          }}
        >
          <span>© 2025 Display Works Media. All Rights Reserved.</span>
          <span>ออกแบบและพัฒนาโดยทีมงาน Display Works Media</span>
        </div>
      </div>
    </footer>
  );
}
