"use client";

import { useState, useEffect } from "react";
import GlobalNavbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  Phone,
  MessageCircle,
  Facebook,
  ArrowRight,
  Menu,
  X,
  Shield,
  Zap,
  Truck,
  Home,
  Droplets,
  Sun,
  Scissors,
  Award,
  ShoppingCart,
  UserCheck,
  PackageCheck,
  FileText,
  Calculator,
  CheckCircle2,
  Cog,
  Layers,
  Eye,
} from "lucide-react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const navLinks = [
  { label: "หน้าแรก", href: "#hero" },
  { label: "บริการของเรา", href: "#services" },
  { label: "ผลงานของเรา", href: "#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "#process" },
  { label: "เกี่ยวกับเรา", href: "#about" },
  { label: "ติดต่อเรา", href: "#quote" },
];

// ขนาดสติ๊กเกอร์ยอดฮิต
const sizes = [
  { w: "5", h: "5", label: "5 × 5 ซม.", use: "สติ๊กเกอร์โลโก้ ฉลากสินค้าเล็ก", popular: false },
  { w: "10", h: "10", label: "10 × 10 ซม.", use: "สติ๊กเกอร์ทั่วไป ติดผลิตภัณฑ์", popular: true },
  { w: "10", h: "15", label: "10 × 15 ซม.", use: "ฉลากสินค้า บรรจุภัณฑ์", popular: false },
  { w: "A5", h: "", label: "A5 (14.8×21 ซม.)", use: "สติ๊กเกอร์หน้าร้าน ป้ายโปรโมชั่น", popular: false },
  { w: "A4", h: "", label: "A4 (21×29.7 ซม.)", use: "สติ๊กเกอร์ขนาดใหญ่ กระจกร้าน", popular: false },
];

// วัสดุสติ๊กเกอร์
const materials = [
  {
    name: "PVC Sticker Outdoor",
    sub: "ทนแดด ทนฝน กลางแจ้ง",
    img: "bg-gradient-to-br from-[#1e2a3a] to-[#0d1520]",
    tag: "ยอดนิยม",
  },
  {
    name: "Sticker Indoor",
    sub: "คมชัด สีสด ในอาคาร",
    img: "bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]",
    tag: null,
  },
  {
    name: "Transparent Sticker",
    sub: "พื้นหลังใส ดูทันสมัย",
    img: "bg-gradient-to-br from-[#1a2030] to-[#0d1220]",
    tag: "พรีเมียม",
  },
  {
    name: "Holographic Sticker",
    sub: "เปลี่ยนสีตามมุมแสง",
    img: "bg-gradient-to-br from-[#2a1a30] to-[#100d20]",
    tag: null,
  },
  {
    name: "Die-Cut Sticker",
    sub: "ตัดตามรูปทรงได้ทุกแบบ",
    img: "bg-gradient-to-br from-[#1a2a1a] to-[#0d1a0d]",
    tag: null,
  },
];

// รูปแบบการตัด
const cutOptions = [
  { name: "ตัดสี่เหลี่ยม", sub: "มาตรฐาน", icon: "▭" },
  { name: "ตัดวงกลม", sub: "กลม / รี", icon: "○" },
  { name: "Die-Cut", sub: "ตามรูปทรง", icon: "✦" },
  { name: "Kiss-Cut", sub: "แผ่นพร้อมลอก", icon: "⊡" },
];

const portfolioItems = [
  { label: "โลโก้ร้านกาแฟ", color: "#FF7A00" },
  { label: "ฉลากสินค้า Organic", color: "#FF7A00" },
  { label: "สติ๊กเกอร์ Event", color: "#FF7A00" },
  { label: "แบรนด์สินค้า", color: "#FF7A00" },
];

const faqs = [
  { q: "ใช้เวลาผลิตนานแค่ไหน?", a: "โดยปกติ 1–3 วันทำการ ขึ้นอยู่กับจำนวนและประเภทงาน สำหรับงานด่วนแจ้งล่วงหน้าได้เลยครับ" },
  { q: "ต้องส่งไฟล์แบบไหน?", a: "รองรับไฟล์ AI, PDF, PSD ความละเอียดขั้นต่ำ 150 dpi ขึ้นไป สำหรับงานที่ต้องการคมชัดสูงแนะนำ 300 dpi" },
  { q: "สั่งขั้นต่ำเท่าไหร่?", a: "ไม่มีขั้นต่ำครับ สั่งได้ตั้งแต่ 1 ชิ้น บางประเภทอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งให้ทราบ" },
  { q: "Die-Cut ตัดรูปทรงอะไรได้บ้าง?", a: "ตัดได้ทุกรูปทรงตามไฟล์ที่ส่งมา ทั้งวงกลม สี่เหลี่ยม รูปดาว หรือรูปทรงอิสระตามแบบของคุณ" },
];

const features = [
  { icon: Droplets, label: "กันน้ำ 100%", sub: "ทนแดด ทนฝน" },
  { icon: Sun, label: "สีไม่ซีดจาง", sub: "UV Resistant" },
  { icon: Scissors, label: "ไดคัทได้ทุกรูปทรง", sub: "ตามแบบที่ต้องการ" },
  { icon: Award, label: "วัสดุเกรดดี", sub: "ใช้ได้นาน" },
];

const trustFeatures = [
  { icon: ShoppingCart, main: "สั่งออนไลน์ 100%", sub: "ไม่ต้องเดินทาง สะดวกทุกที่" },
  { icon: Zap, main: "งานไว ตรงเวลา", sub: "ตามที่ตกลงไว้ทุกครั้ง" },
  { icon: UserCheck, main: "ดูแลเคสส่วนตัว", sub: "มี Project Manager ดูแลตลอด" },
  { icon: Truck, main: "จัดส่งทั่วประเทศ", sub: "พร้อมแจ้งเลขพัสดุทุกออเดอร์" },
];

const bigStats = [
  { num: "500+", label: "งานสติ๊กเกอร์ที่ส่งมอบ" },
  { num: "120+", label: "ลูกค้าที่ไว้วางใจ" },
  { num: "5+", label: "ปีประสบการณ์" },
  { num: "100%", label: "พึงพอใจในคุณภาพ" },
];

const processSteps = [
  {
    num: 1,
    icon: FileText,
    title: "ส่งรายละเอียดงาน",
    desc: "แจ้งขนาด ประเภท และรายละเอียดงานผ่าน LINE หรือแบบฟอร์มออนไลน์ ง่าย ไม่ต้องเดินทาง",
    time: "ภายใน 5 นาที",
  },
  {
    num: 2,
    icon: Calculator,
    title: "ประเมินราคา",
    desc: "ทีมงานประเมินราคาและส่งใบเสนอราคาให้พร้อมรายละเอียดครบถ้วน ภายใน 24 ชั่วโมง",
    time: "ภายใน 24 ชั่วโมง",
  },
  {
    num: 3,
    icon: CheckCircle2,
    title: "ยืนยันแบบและชำระเงิน",
    desc: "ตรวจสอบและยืนยันแบบร่วมกันก่อนผลิตจริงทุกครั้ง ชำระผ่านโอน/พร้อมเพย์ สะดวกรวดเร็ว",
    time: "ขั้นตอนง่าย",
  },
  {
    num: 4,
    icon: Cog,
    title: "ผลิตงาน",
    desc: "พิมพ์ด้วยเครื่องพิมพ์คุณภาพสูง ตรวจสอบความคมชัดและสีทุกชิ้นก่อนส่ง",
    time: "1–3 วันทำการ",
  },
  {
    num: 5,
    icon: PackageCheck,
    title: "จัดส่งทั่วประเทศ",
    desc: "จัดส่งถึงมือคุณทุกจังหวัด พร้อมแจ้งเลขพัสดุให้ติดตามได้ตลอดเวลา",
    time: "ทั่วประเทศ",
  },
];

// ─── NAVBAR ─────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-md shadow-lg shadow-black/20" : "bg-transparent"
      }`}
      style={{
        background: scrolled ? "rgba(5, 8, 6, 0.95)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[70px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image
              src="/images/logo.png"
              alt="Display Works Media"
              fill
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div>
            <div className="font-['Kanit',sans-serif] font-bold text-sm tracking-wider leading-none text-white">
              DISPLAY WORKS
            </div>
            <div className="font-['Kanit',sans-serif] font-bold text-sm tracking-wider leading-none" style={{ color: "#FF7A00" }}>
              MEDIA
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-normal transition-colors duration-200"
              style={{ color: "#A7B0C0" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A7B0C0")}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-3 border-r pr-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: "#A7B0C0" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00E5FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A7B0C0")}
              aria-label="LINE"
            >
              <MessageCircle size={18} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61581015452518"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: "#A7B0C0" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A7B0C0")}
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          </div>
          <a
            href="#quote"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 text-white"
            style={{ background: "#FF7A00", boxShadow: "0 4px 20px rgba(255,122,0,0.2)" }}
          >
            ขอใบเสนอราคา
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden px-6 py-6 flex flex-col gap-4 border-t overflow-hidden"
            style={{ background: "#0E1310", borderColor: "rgba(255,255,255,0.08)" }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base py-2 border-b transition-colors"
                style={{ color: "#A7B0C0", borderColor: "rgba(255,255,255,0.05)" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#quote"
              className="mt-2 text-white text-center py-3 rounded-lg font-semibold text-sm"
              style={{ background: "#FF7A00" }}
              onClick={() => setMobileOpen(false)}
            >
              ขอใบเสนอราคา
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function StickerServicePage() {
  const [selectedSize, setSelectedSize] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [portfolioIndex, setPortfolioIndex] = useState(0);

  return (
    <div
      className="brand-interior brand-service-detail min-h-screen font-['Prompt',sans-serif] text-white"
      style={{ background: "#050806" }}
    >
      {/* ── NAVBAR ── */}
      <GlobalNavbar />

      {/* ── BREADCRUMB ── */}
      <div
        id="hero"
        className="pt-[70px]"
        style={{ background: "#050806", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-sm"
          style={{ color: "#A7B0C0" }}>
          <Home size={14} />
          <ChevronRight size={12} />
          <span>บริการของเรา</span>
          <ChevronRight size={12} />
          <span style={{ color: "#FF7A00" }}>สติ๊กเกอร์</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          1. HERO SECTION
      ════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: "520px" }}
      >
        {/* Background Image */}
        <Image
          src="/images/services/sticker.jpg"
          alt="Sticker Service Background"
          fill
          priority
          className="object-cover object-center z-0"
          onError={(e) => {
            console.error("Image failed to load. Please check the path.");
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-[#050806]/70 z-0" />

        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle at 70% 30%, rgba(255,122,0,0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(255,122,0,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border bg-white/5 backdrop-blur-sm"
                style={{
                  borderColor: "rgba(255,122,0,0.3)",
                  color: "#FF7A00",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
                บริการออกแบบและผลิต
              </div>

              <h1
                className="font-['Kanit',sans-serif] font-extrabold leading-tight mb-2 text-white"
                style={{ fontSize: "clamp(36px,5vw,60px)" }}
              >
                บริการออกแบบและผลิต
              </h1>
              <h1
                className="font-['Kanit',sans-serif] font-extrabold leading-tight mb-5 drop-shadow-md"
                style={{ fontSize: "clamp(36px,5vw,60px)", color: "#FF7A00" }}
              >
                สติ๊กเกอร์คุณภาพสูง
              </h1>

              <p className="text-base leading-relaxed mb-8 max-w-md text-gray-200">
                สติ๊กเกอร์คุณภาพดี ติดได้ทุกพื้นผิว รองรับทั้ง Indoor และ Outdoor
                ไดคัทได้ตามรูปแบบที่ต้องการ พิมพ์สีคมชัดสวยงาม
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-4 mb-10">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                        style={{ background: "rgba(255,122,0,0.15)", border: "1px solid rgba(255,122,0,0.3)" }}
                      >
                        <Icon size={24} strokeWidth={1.5} style={{ color: "#FF7A00" }} />
                      </div>
                      <span className="text-xs font-semibold text-white drop-shadow-sm">{f.label}</span>
                      <span className="text-xs text-gray-300 drop-shadow-sm">{f.sub}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#quote"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "#FF7A00", boxShadow: "0 4px 24px rgba(255,122,0,0.4)" }}
                >
                  ขอใบเสนอราคา
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#portfolio"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-semibold text-white text-sm border backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
                  style={{ borderColor: "rgba(255,255,255,0.3)" }}
                >
                  ดูตัวอย่างผลงาน ▶
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          2. SIZE SELECTOR
      ════════════════════════════════════════════════════════ */}
      <section id="services" className="py-16 px-6 lg:px-8" style={{ background: "#050806" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{ background: "rgba(255,122,0,0.08)", borderColor: "rgba(255,122,0,0.2)", color: "#FF7A00" }}
            >
              ขนาดยอดฮิต
            </div>
            <h2
              className="font-['Kanit',sans-serif] font-bold text-white"
              style={{ fontSize: "clamp(24px,3vw,36px)" }}
            >
              ขนาดสติ๊กเกอร์ยอดฮิต
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {sizes.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                onClick={() => setSelectedSize(i)}
                className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: selectedSize === i ? "rgba(255,122,0,0.1)" : "#0E1310",
                  borderColor: selectedSize === i ? "#FF7A00" : "rgba(255,255,255,0.08)",
                  boxShadow: selectedSize === i ? "0 0 24px rgba(255,122,0,0.15)" : "none",
                }}
              >
                {s.popular && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                    style={{ background: "#FF7A00", color: "#fff" }}
                  >
                    ยอดนิยม
                  </div>
                )}
                {/* Sticker shape preview */}
                <div
                  className="rounded-lg flex items-center justify-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: selectedSize === i ? "rgba(255,122,0,0.2)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${selectedSize === i ? "rgba(255,122,0,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: i === 1 ? "50%" : "8px",
                  }}
                />
                <div
                  className="font-['Kanit',sans-serif] font-bold text-sm"
                  style={{ color: selectedSize === i ? "#FF7A00" : "#fff" }}
                >
                  {s.label}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#A7B0C0" }}>{s.use}</p>
              </motion.button>
            ))}

            {/* Custom size card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border text-center"
              style={{ background: "#0E1310", borderColor: "rgba(255,255,255,0.08)", borderStyle: "dashed" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,122,0,0.1)" }}
              >
                <Plus size={20} style={{ color: "#FF7A00" }} />
              </div>
              <div className="font-semibold text-sm text-white">ขนาดพิเศษ</div>
              <p className="text-xs" style={{ color: "#A7B0C0" }}>สั่งผลิตตามขนาดที่ต้องการได้</p>
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "rgba(255,122,0,0.1)", color: "#FF7A00" }}
              >
                สอบถามเพิ่มเติม →
              </button>
            </motion.div>
          </div>

          <p className="text-xs mt-4" style={{ color: "rgba(167,176,192,0.6)" }}>
            * ขนาดสามารถปรับเปลี่ยนได้ตามความต้องการ รองรับทั้ง Portrait และ Landscape
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          3. MATERIAL + CUT OPTIONS
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 lg:px-8" style={{ background: "#0E1310" }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">

          {/* Materials */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{ background: "rgba(255,122,0,0.08)", borderColor: "rgba(255,122,0,0.2)", color: "#FF7A00" }}
            >
              วัสดุ
            </div>
            <h2
              className="font-['Kanit',sans-serif] font-bold text-white mb-6"
              style={{ fontSize: "clamp(20px,2.5vw,28px)" }}
            >
              วัสดุสติ๊กเกอร์{" "}
              <span style={{ color: "#A7B0C0", fontSize: "0.75em", fontWeight: 400 }}>
                (เลือกตามการใช้งาน)
              </span>
            </h2>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {materials.map((m, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-2xl overflow-hidden border"
                  style={{
                    width: "130px",
                    background: "#050806",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className={`${m.img} h-20 relative`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {m.tag && (
                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "#FF7A00", color: "#fff" }}
                      >
                        {m.tag}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-semibold text-white leading-snug">{m.name}</div>
                    <div className="text-xs mt-1" style={{ color: "#A7B0C0" }}>{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cut Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{ background: "rgba(255,122,0,0.08)", borderColor: "rgba(255,122,0,0.2)", color: "#FF7A00" }}
            >
              รูปแบบการตัด
            </div>
            <h2
              className="font-['Kanit',sans-serif] font-bold text-white mb-6"
              style={{ fontSize: "clamp(20px,2.5vw,28px)" }}
            >
              รูปแบบการตัดสติ๊กเกอร์
            </h2>

            <div className="grid grid-cols-4 gap-3">
              {cutOptions.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center border"
                  style={{ background: "#050806", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(255,122,0,0.08)" }}
                  >
                    {c.icon}
                  </div>
                  <div className="text-xs font-semibold text-white leading-tight">{c.name}</div>
                  {c.sub && (
                    <div className="text-xs" style={{ color: "#A7B0C0" }}>{c.sub}</div>
                  )}
                </div>
              ))}
            </div>

            <div
              className="mt-4 p-3 rounded-xl text-xs"
              style={{ background: "rgba(255,122,0,0.06)", border: "1px solid rgba(255,122,0,0.12)", color: "#A7B0C0" }}
            >
              + เคลือบ Glossy / Matte &nbsp;|&nbsp; + เคลือบ UV กันน้ำ 100%
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          4. WHY CHOOSE US — Stats + Trust Features
      ════════════════════════════════════════════════════════ */}
      <section
        id="about"
        className="py-10"
        style={{
          background: "#141A24",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Big Stats Row */}
        <div
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          className="pb-10"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
              {bigStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="text-center lg:py-2 relative"
                >
                  {i > 0 && (
                    <div
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-10"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                  )}
                  <div
                    className="font-['Kanit',sans-serif] font-extrabold"
                    style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#FF7A00" }}
                  >
                    {s.num}
                  </div>
                  <div
                    className="text-sm mt-1"
                    style={{ color: "#A7B0C0" }}
                  >
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Features Row */}
        <div className="pt-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-center gap-6 lg:gap-12">
              {trustFeatures.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex items-center gap-4"
                  >
                    {i > 0 && (
                      <div
                        className="hidden lg:block w-px h-10 self-center"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      />
                    )}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,122,0,0.1)" }}
                      >
                        <Icon size={22} style={{ color: "#FF7A00" }} />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white leading-tight">
                          {item.main}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "#A7B0C0" }}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          5. PORTFOLIO
      ════════════════════════════════════════════════════════ */}
      <section id="portfolio" className="py-16 px-6 lg:px-8" style={{ background: "#0E1310" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
                style={{ background: "rgba(255,122,0,0.08)", borderColor: "rgba(255,122,0,0.2)", color: "#FF7A00" }}
              >
                ผลงาน
              </div>
              <h2
                className="font-['Kanit',sans-serif] font-bold text-white"
                style={{ fontSize: "clamp(24px,3vw,36px)" }}
              >
                ตัวอย่างผลงานสติ๊กเกอร์
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPortfolioIndex(Math.max(0, portfolioIndex - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                style={{ background: "#050806", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPortfolioIndex(Math.min(portfolioItems.length - 1, portfolioIndex + 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                style={{ background: "#050806", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* Portfolio grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { gradient: "from-[#7a0000] to-[#2a0000]", title: "โลโก้ร้านกาแฟ", sub: "Die-Cut" },
              { gradient: "from-[#002080] to-[#001040]", title: "ฉลากสินค้า Organic", sub: "Indoor" },
              { gradient: "from-[#1a4020] to-[#0a1a10]", title: "สติ๊กเกอร์ Event", sub: "Outdoor" },
              { gradient: "from-[#3a1a50] to-[#15082a]", title: "แบรนด์สินค้าพรีเมียม", sub: "Holographic" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group relative overflow-hidden rounded-2xl cursor-pointer"
                style={{ aspectRatio: "4/3" }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${p.gradient} transition-transform duration-500 group-hover:scale-105`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="font-['Kanit',sans-serif] font-extrabold text-white text-lg leading-tight mb-1">
                    {p.title}
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#FF7A00", color: "#fff" }}
                  >
                    {p.sub}
                  </div>
                </div>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: "rgba(255,122,0,0.15)" }}
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="#quote"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,122,0,0.3)", color: "#FF7A00" }}
            >
              ดูผลงานเพิ่มเติม
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          6. WORKFLOW PROCESS
      ════════════════════════════════════════════════════════ */}
      <section
        id="process"
        className="py-24 lg:py-32 px-6 lg:px-8"
        style={{ background: "#0B0F19" }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{ background: "rgba(255,122,0,0.08)", borderColor: "rgba(255,122,0,0.2)", color: "#FF7A00" }}
            >
              ขั้นตอนการทำงาน
            </div>
            <h2
              className="font-['Kanit',sans-serif] font-bold text-white mb-4"
              style={{ fontSize: "clamp(24px,3vw,36px)" }}
            >
              ง่าย ครบ จบใน 5 ขั้นตอน
            </h2>
            <p className="text-base leading-relaxed mx-auto text-center max-w-xl" style={{ color: "#A7B0C0" }}>
              ขั้นตอนที่ออกแบบมาเพื่อความสะดวกของคุณ ไม่ต้องเดินทาง
              ไม่ต้องนัดหมาย
            </p>
          </motion.div>

          {/* Desktop timeline */}
          <div className="hidden lg:block relative">
            <div
              className="absolute top-[52px] left-[10%] right-[10%] h-px"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(255,122,0,0.5) 15%, rgba(255,122,0,0.5) 85%, transparent)",
              }}
            />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="absolute top-[52px] left-[10%] right-[10%] h-px origin-left"
              style={{ background: "rgba(255,122,0,0.3)" }}
            />

            <div className="grid grid-cols-5 gap-6">
              {processSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="group flex flex-col items-center text-center"
                  >
                    {/* Circle icon */}
                    <div
                      className="relative z-10 w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center mb-6 cursor-default transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #1A2233, #141A24)",
                        border: "2px solid rgba(255,122,0,0.45)",
                        boxShadow: "0 0 0 6px rgba(255,122,0,0.06), 0 8px 24px rgba(0,0,0,0.3)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #FF7A00, #E66A00)";
                        (e.currentTarget as HTMLElement).style.borderColor = "#FF7A00";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 8px rgba(255,122,0,0.12), 0 12px 32px rgba(255,122,0,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1A2233, #141A24)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,122,0,0.45)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 6px rgba(255,122,0,0.06), 0 8px 24px rgba(0,0,0,0.3)";
                      }}
                    >
                      <span
                        className="font-['Kanit',sans-serif] font-bold text-xs mb-1 tracking-widest"
                        style={{ color: "rgba(255,122,0,0.7)" }}
                      >
                        {String(step.num).padStart(2, "0")}
                      </span>
                      <Icon size={28} strokeWidth={1.5} style={{ color: "#FF7A00" }} />
                    </div>

                    {/* Time badge */}
                    <div
                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                      style={{
                        background: "rgba(255,122,0,0.08)",
                        color: "#FF7A00",
                        border: "1px solid rgba(255,122,0,0.15)",
                      }}
                    >
                      {step.time}
                    </div>

                    <h3 className="font-['Kanit',sans-serif] font-bold text-white text-sm mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#A7B0C0" }}>
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile vertical timeline */}
          <div className="lg:hidden flex flex-col gap-0">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex gap-5 items-start"
                >
                  {/* Left: icon + connector */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                      style={{
                        background: "linear-gradient(135deg, #1A2233, #141A24)",
                        borderColor: "rgba(255,122,0,0.5)",
                      }}
                    >
                      <Icon size={22} strokeWidth={1.5} style={{ color: "#FF7A00" }} />
                    </div>
                    {i < processSteps.length - 1 && (
                      <div
                        className="w-px mt-2"
                        style={{
                          background: "linear-gradient(to bottom, rgba(255,122,0,0.4), transparent)",
                          minHeight: "48px",
                        }}
                      />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className="pb-8 pt-1 flex-1">
                    <div
                      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2"
                      style={{
                        background: "rgba(255,122,0,0.08)",
                        color: "#FF7A00",
                        border: "1px solid rgba(255,122,0,0.15)",
                      }}
                    >
                      {step.time}
                    </div>
                    <h3 className="font-['Kanit',sans-serif] font-bold text-white text-base mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#A7B0C0" }}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-16"
          >
            <a
              href="#quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#FF7A00",
                boxShadow: "0 4px 24px rgba(255,122,0,0.25)",
              }}
            >
              เริ่มต้นสั่งงานเลย
            </a>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          7. FAQ
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 lg:px-8" style={{ background: "#0E1310" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{ background: "rgba(255,122,0,0.08)", borderColor: "rgba(255,122,0,0.2)", color: "#FF7A00" }}
            >
              FAQ
            </div>
            <h2
              className="font-['Kanit',sans-serif] font-bold text-white"
              style={{ fontSize: "clamp(24px,3vw,36px)" }}
            >
              คำถามที่พบบ่อย
            </h2>
          </motion.div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="overflow-hidden rounded-2xl border transition-all duration-200"
                style={{
                  background: openFaq === i ? "#151e30" : "#050806",
                  borderColor: openFaq === i ? "rgba(255,122,0,0.35)" : "rgba(255,255,255,0.07)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span
                    className="font-semibold text-sm"
                    style={{ color: openFaq === i ? "#fff" : "#C8D0DC" }}
                  >
                    {faq.q}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: openFaq === i ? "#FF7A00" : "rgba(255,255,255,0.07)" }}
                  >
                    {openFaq === i
                      ? <Minus size={13} className="text-white" />
                      : <Plus size={13} style={{ color: "#A7B0C0" }} />
                    }
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className="px-6 pb-5 text-sm leading-relaxed border-t"
                        style={{ color: "#A7B0C0", borderColor: "rgba(255,122,0,0.1)", paddingTop: "14px" }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          8. CTA BOTTOM
      ════════════════════════════════════════════════════════ */}
      <section
        id="quote"
        className="py-16 px-6 lg:px-8 relative overflow-hidden"
        style={{ background: "#050806" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(255,122,0,0.07) 0%, transparent 60%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-6 border"
            style={{
              background: "rgba(255,122,0,0.08)",
              borderColor: "rgba(255,122,0,0.25)",
              color: "#FF7A00",
            }}
          >
            สนใจสั่งสติ๊กเกอร์ ขอใบเสนอราคาฟรี!
          </div>

          <h2
            className="font-['Kanit',sans-serif] font-extrabold text-white mb-6"
            style={{ fontSize: "clamp(28px,4vw,48px)" }}
          >
            พร้อมสั่งสติ๊กเกอร์คุณภาพสูง
            <br />
            <span style={{ color: "#FF7A00" }}>แล้วหรือยัง?</span>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: "#A7B0C0" }}>
            ส่งรายละเอียดงานมาได้เลย ทีมงานพร้อมประเมินราคา
            และให้คำแนะนำฟรีโดยไม่มีค่าใช้จ่าย
          </p>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              { icon: Check, label: "ประเมินราคาฟรี", sub: "ไม่มีค่าใช้จ่าย" },
              { icon: Zap, label: "ผลิตไว", sub: "1–3 วันทำการ" },
              { icon: Truck, label: "จัดส่งทั่วประเทศ", sub: "ปลอดภัย มั่นใจ" },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,122,0,0.1)" }}
                  >
                    <Icon size={18} style={{ color: "#FF7A00" }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.label}</div>
                    <div className="text-xs" style={{ color: "#A7B0C0" }}>{t.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5"
              style={{ background: "#FF7A00", boxShadow: "0 6px 28px rgba(255,122,0,0.3)" }}
            >
              ขอใบเสนอราคา
              <ArrowRight size={16} />
            </a>
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5"
              style={{ background: "#06C755", boxShadow: "0 6px 28px rgba(6,199,85,0.25)" }}
            >
              <MessageCircle size={16} />
              แอดไลน์
            </a>
            <a
              href="tel:0659161539"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <Phone size={16} style={{ color: "#FF7A00" }} />
              โทรหาเรา
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
