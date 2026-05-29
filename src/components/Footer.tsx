"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Facebook, Instagram, Phone, Mail, MapPin, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "/#services" },
  { label: "ผลงานของเรา", href: "/#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "/#process" },
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
  { label: "FAQ", href: "/#faq" },
];

const serviceLinks = [
  { label: "ป้ายไวนิล", href: "/services/vinyl" },
  { label: "สติ๊กเกอร์ Indoor / Outdoor", href: "/services/sticker" },
  { label: "PP Board / Standee", href: "/services/ppboard" },
  { label: "Roll Up / X-Stand", href: "/services/rollup" },
  { label: "แบ็คดรอปผ้า", href: "/services/backdrop" },
  { label: "ฉลากสินค้า", href: "/services/label" },
];

const socials = [
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", color: "#1877F2" },
  { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", color: "#06C755" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram", color: "#E1306C" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#080B13", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

      {/* CTA Strip */}
      <div className="px-5 py-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-[#FF7A00]/20"
          style={{ background: "linear-gradient(135deg, #0d1525 0%, #1a0f05 100%)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at right, rgba(255,122,0,0.12) 0%, transparent 60%)" }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="font-['Kanit'] font-bold text-white text-lg leading-tight">
                พร้อมเริ่มโปรเจกต์แล้วหรือยัง?
              </p>
              <p className="text-[#A7B0C0] text-sm mt-1">ประเมินราคาฟรี ตอบกลับภายใน 30 นาที</p>
            </div>
            <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
              <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ background: "#06C755", boxShadow: "0 4px 16px rgba(6,199,85,0.2)" }}>
                <MessageCircle size={15} /> LINE
              </a>
              <a href="/#quote"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ background: "#FF7A00", boxShadow: "0 4px 16px rgba(255,122,0,0.2)" }}>
                ขอใบเสนอราคา
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-5xl mx-auto px-5 pt-12 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image src="/images/logo.png" alt="Display Works Media" fill className="object-contain" />
              </div>
              <div>
                <div className="font-['Kanit'] font-bold text-xs tracking-widest text-white leading-none uppercase">DISPLAY WORKS</div>
                <div className="font-['Kanit'] font-bold text-xs tracking-widest leading-none uppercase" style={{ color: "#FF7A00" }}>MEDIA</div>
              </div>
            </Link>
            <p className="text-[#A7B0C0] text-xs leading-relaxed mb-5">
              บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร<br />ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ
            </p>
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, href, label, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", color: "#A7B0C0" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = color; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#141A24"; (e.currentTarget as HTMLElement).style.color = "#A7B0C0"; }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-4">เมนู</h4>
            <div className="flex flex-col gap-2.5">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="text-[#A7B0C0] hover:text-white text-xs transition-colors leading-snug">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-4">บริการ</h4>
            <div className="flex flex-col gap-2.5">
              {serviceLinks.map(({ label, href }) => (
                <Link key={href} href={href}
                  className="text-[#A7B0C0] hover:text-white text-xs transition-colors leading-snug">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-4">ติดต่อ</h4>
            <div className="flex flex-col gap-3">
              <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-[#A7B0C0] hover:text-white text-xs transition-colors">
                <MessageCircle size={13} style={{ color: "#06C755", flexShrink: 0, marginTop: "1px" }} />
                LINE @displayworks
              </a>
              <a href="tel:0659161539"
                className="flex items-start gap-2.5 text-[#A7B0C0] hover:text-white text-xs transition-colors">
                <Phone size={13} style={{ color: "#FF7A00", flexShrink: 0, marginTop: "1px" }} />
                065-916-1539
              </a>
              <a href="mailto:info.displayworksmedia@gmail.com"
                className="flex items-start gap-2.5 text-[#A7B0C0] hover:text-white text-xs transition-colors break-all">
                <Mail size={13} style={{ color: "#FF7A00", flexShrink: 0, marginTop: "1px" }} />
                info.displayworksmedia@gmail.com
              </a>
              <div className="flex items-start gap-2.5 text-[#A7B0C0] text-xs">
                <MapPin size={13} style={{ color: "#FF7A00", flexShrink: 0, marginTop: "1px" }} />
                ให้บริการทั่วประเทศไทย
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl text-xs"
              style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="font-semibold text-white text-[11px] mb-1">เวลาทำการ</div>
              <div className="text-[#A7B0C0]">จันทร์–เสาร์: 9:00–18:00</div>
              <div className="text-[#A7B0C0]">ตอบ LINE ทุกวัน 24 ชม.</div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 text-[11px] text-[#A7B0C0]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span>© 2025 Display Works Media. All Rights Reserved.</span>
          <span className="hidden sm:block">ออกแบบและพัฒนาโดยทีมงาน Display Works Media</span>
        </div>
      </div>
    </footer>
  );
}
