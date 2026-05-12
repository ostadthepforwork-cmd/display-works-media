"use client";

import Image from "next/image";
import { MessageCircle, Facebook, Instagram, Phone, Mail } from "lucide-react";

const navLinks = [
  { label: "หน้าแรก", href: "#hero" },
  { label: "บริการของเรา", href: "#services" },
  { label: "ผลงานของเรา", href: "#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "#process" },
  { label: "เกี่ยวกับเรา", href: "#about" },
  { label: "ติดต่อเรา", href: "#contact" },
];

const serviceLinks = [
  "ป้ายไวนิล",
  "Sticker Indoor / Outdoor",
  "PP Board",
  "Roll up / X-stand",
  "Backdrop / Standee",
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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {/* โลโก้รูปภาพ */}
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
            <p className="text-muted text-sm leading-relaxed mb-5">
              บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร
              <br />
              ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", hoverColor: "#1877F2" },
                { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", hoverColor: "#06C755" },
                { icon: Instagram, href: "https://instagram.com", label: "Instagram", hoverColor: "#E1306C" },
              ].map(({ icon: Icon, href, label, hoverColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "#141A24",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#A8B0C0",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = hoverColor;
                    (e.currentTarget as HTMLElement).style.borderColor = hoverColor;
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

          {/* Nav Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-5 text-white">
              เมนู
            </h4>
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted text-sm transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-5 text-white">
              บริการของเรา
            </h4>
            <div className="flex flex-col gap-3">
              {serviceLinks.map((s) => (
                <a
                  key={s}
                  href="#services"
                  className="text-muted text-sm transition-colors hover:text-white"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-5 text-white">
              ติดต่อเรา
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted text-sm hover:text-white transition-colors"
              >
                <MessageCircle size={15} style={{ color: "#06C755", flexShrink: 0 }} />
                LINE @displayworks
              </a>
              <a
                href="tel:0959161539"
                className="flex items-center gap-3 text-muted text-sm hover:text-white transition-colors"
              >
                <Phone size={15} style={{ color: "#FF6B00", flexShrink: 0 }} />
                065-916-1539
              </a>
              <a
                href="mailto:info.displayworksmedia@gmail.com
"
                className="flex items-center gap-3 text-muted text-sm hover:text-white transition-colors"
              >
                <Mail size={15} style={{ color: "#FF6B00", flexShrink: 0 }} />
                info.displayworksmedia@gmail.com

              </a>
            </div>

            <a
              href="#quote"
              className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#FF6B00",
                boxShadow: "0 4px 20px rgba(255,107,0,0.2)",
              }}
            >
              ขอใบเสนอราคา
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t text-xs text-muted"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <span>© 2024 Display Works Media. All Rights Reserved.</span>
          <span>ออกแบบและพัฒนาโดยทีมงาน Display Works Media</span>
        </div>
      </div>
    </footer>
  );
}
