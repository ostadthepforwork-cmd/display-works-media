"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Plus, Minus, Check, Phone, MessageCircle, ArrowRight, ChevronRight,
  Sun, Printer, Award, ShoppingCart, UserCheck, PackageCheck,
  Menu, X, Facebook, FileText, Calculator, CheckCircle2, Cog,
  Scissors, Layers, CircleDot, Box, Home, Droplets, Zap, Truck, Info,
  Lock, MapPin, Mail, Instagram, Send, CheckCircle, Upload, Sparkles, AlertCircle
} from "lucide-react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "ประเภทสติ๊กเกอร์", href: "#knowledge" },
  { label: "รูปแบบการตัด", href: "#cut-options" },
  { label: "ผลงานของเรา", href: "#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "#process" },
  { label: "ติดต่อเรา", href: "#quote" },
];

const indoorMaterials = [
  {
    name: "PP Sticker",
    desc: "ผิวหน้าคล้ายกระดาษ เหมาะกับงานกึ่งชั่วคราวหรืองานอีเวนต์",
    image: "/images/materials/pp-indoor.jpg",
    highlights: [
      "งานพิมพ์ละเอียดสูง สีสันสดใสมาก",
      "ต้องเคลือบงานเสมอ (เนื่องจากหมึกเป็นสูตรน้ำ)",
      "ไม่ทนความชื้นและการสัมผัสโดยตรง"
    ],
    uses: [
      "ฉลากสินค้ากึ่งชั่วคราว",
      "ป้ายโปรโมชั่นระยะสั้น",
      "งานตกแต่งอีเวนต์"
    ]
  },
  {
    name: "PVC Sticker (Indoor)",
    desc: "มีความยืดหยุ่นกว่า PP ใช้ติดบนวัสดุเรียบ เช่น แผ่น Plaswood",
    image: "/images/materials/pvc-indoor.jpg",
    highlights: [
      "เนื้อพลาสติกยืดหยุ่น ฉีกไม่ขาด",
      "ทนทานต่อรอยขีดข่วนได้ดีกว่าเนื้อ PP",
      "พิมพ์สีคมชัด เก็บรายละเอียดได้ดีเยี่ยม"
    ],
    uses: [
      "ป้ายเมนูอาหาร บอร์ดนิทรรศการ",
      "สติ๊กเกอร์ติดกระจกภายในอาคาร",
      "ป้ายตกแต่งภายในร้านค้า"
    ]
  },
  {
    name: "Clear Sticker (ใส)",
    desc: "สติ๊กเกอร์ใสสำหรับงานที่ต้องการโชว์พื้นหลัง หรือฉลากสินค้าที่ต้องการความพรีเมียม",
    image: "/images/materials/clear-indoor.jpg",
    highlights: [
      "เนื้อใส กลมกลืนไปกับพื้นผิวที่นำไปติด",
      "ดูทันสมัย พรีเมียม สวยงาม",
      "สามารถพิมพ์หมึกขาวรองพื้นเพื่อเน้นข้อความได้"
    ],
    uses: [
      "ฉลากแพ็กเกจจิ้ง (ขวดแก้ว, พลาสติกใส)",
      "สติ๊กเกอร์ตกแต่งกระจกร้าน",
      "ป้ายที่ต้องการโชว์พื้นผิววัสดุ"
    ]
  }
];

const outdoorMaterials = [
  {
    name: "PVC Sticker (Outdoor)",
    desc: "ทนแดด ทนฝน ใช้ได้ครอบคลุมตั้งแต่งานป้าย ตกแต่งร้าน ไปจนถึงงาน Wrap รถ",
    image: "/images/materials/pvc-outdoor.jpg",
    highlights: [
      "ทนทานต่อสภาพอากาศสูง อายุการใช้งาน 3-5 ปีขึ้นไป",
      "ไม่ต้องเคลือบก็ทนทาน (แต่เคลือบจะช่วยกันรอยขีดข่วน)",
      "ยืดหยุ่นสูง เข้าโค้งเว้าได้ดี (เกรด 3M/Avery)"
    ],
    uses: [
      "ป้ายโฆษณากลางแจ้ง",
      "งาน Wrap รถยนต์ / ยานพาหนะ",
      "ตกแต่งกระจกหน้าร้านภายนอก"
    ]
  },
  {
    name: "PVC Removable",
    desc: "ลอกออกง่าย ไม่ทิ้งคราบกาว เหมาะกับงานโปรโมชั่นบนกระจกห้างที่ต้องเปลี่ยนบ่อยๆ",
    image: "/images/materials/pvc-removable.jpg",
    highlights: [
      "ใช้กาวชนิดพิเศษ ลอกออกไม่ทิ้งคราบเหนียว",
      "ประหยัดเวลาและค่าใช้จ่ายในการทำความสะอาดกระจก",
      "สีสันคมชัด ทนแดดทนฝนได้ดี"
    ],
    uses: [
      "ป้ายโฆษณาบนกระจก (แคมเปญเปลี่ยนบ่อย)",
      "ตกแต่งร้านค้าในห้างสรรพสินค้า",
      "สติ๊กเกอร์ติดกระจกรถยนต์ชั่วคราว"
    ]
  },
  {
    name: "See Through (ซีทรู)",
    desc: "สติ๊กเกอร์รูพรุน กรองแสงได้ คนข้างในมองออกไปเห็นข้างนอก แต่คนข้างนอกมองเข้ามาไม่เห็น",
    image: "/images/materials/see-through.jpg",
    highlights: [
      "ให้ความเป็นส่วนตัว พรางสายตาจากภายนอก",
      "ช่วยกรองแสงแดดและความร้อน",
      "มองจากด้านในทะลุออกไปได้ชัดเจน ไม่บังทัศนวิสัย"
    ],
    uses: [
      "กระจกอาคารสำนักงาน ออฟฟิศ",
      "กระจกหน้าร้านค้า คลินิก",
      "กระจกหลังรถยนต์ รถตู้ รถเมล์"
    ]
  }
];

const usageGuidelines = [
  { useCase: "ฉลากสินค้า / แพ็กเกจจิ้ง", type: "Clear Sticker หรือ PP Sticker", reason: "เน้นความสวยงาม รายละเอียดคมชัด มองเห็นสินค้าด้านใน" },
  { useCase: "ตู้ไฟ / ป้ายไฟ (Lightbox)", type: "Sticker Backlit", reason: "เนื้อขาวบางพิเศษ แสงส่องผ่านแล้วภาพไม่ซีดจาง" },
  { useCase: "ป้ายโฆษณาบนกระจก (เปลี่ยนบ่อย)", type: "PVC Removable", reason: "ลอกเปลี่ยนง่าย กระจกไม่เลอะคราบกาว" },
  { useCase: "กระจกออฟฟิศ / รถ (บังสายตา)", type: "Sticker See Through", reason: "ให้ความเป็นส่วนตัวแต่ยังมองเห็นข้างนอกได้ และช่วยกรองแสงแดด" },
  { useCase: "ป้ายเมนู / บอร์ดนิทรรศการ", type: "PVC Sticker (ติดบนแผ่นเรียบ)", reason: "งานเรียบตึง ทนทานต่อการติดตั้งและเคลื่อนย้าย" },
  { useCase: "งาน Wrap รถยนต์ / ยานพาหนะ", type: "PVC เกรดพรีเมียม (3M/Avery)", reason: "สติ๊กเกอร์มีความเหนียวและยืดหยุ่นสูง เข้าโค้งเว้าของรถได้ดี" },
];

const cutOptions = [
  { name: "ตัดสี่เหลี่ยม / ตัดตรง", sub: "ตัดตามขนาดมาตรฐาน ประหยัดเวลา", image: "/images/edges/cut-square.jpg" },
  { name: "ตัดวงกลม / วงรี", sub: "รูปทรงมาตรฐานสำหรับฉลากสินค้า", image: "/images/edges/cut-circle.jpg" },
  { name: "Die-Cut (ไดคัท 100%)", sub: "ตัดขาดเป็นชิ้นๆ ตามรูปทรงโลโก้", image: "/images/edges/diecut.jpg" },
  { name: "Kiss-Cut (ไดคัท 50%)", sub: "ตัดเฉพาะสติ๊กเกอร์ ลอกเป็นดวงได้ง่าย", image: "/images/edges/kisscut.jpg" },
];

const sizes = [
  { size: "5 × 5 ซม.", use: "สติ๊กเกอร์โลโก้ ฉลากสินค้าขนาดเล็ก", note: "ขนาดยอดนิยม" },
  { size: "10 × 10 ซม.", use: "สติ๊กเกอร์ทั่วไป ติดผลิตภัณฑ์ กระปุกกระดาษ", note: "แนะนำสำหรับร้านค้า" },
  { size: "10 × 15 ซม.", use: "ฉลากสินค้าขนาดกลาง บรรจุภัณฑ์กล่อง", note: "-" },
  { size: "A5 (14.8 × 21 ซม.)", use: "สติ๊กเกอร์หน้าร้าน ป้ายโปรโมชั่นขนาดเล็ก", note: "-" },
  { size: "A4 (21 × 29.7 ซม.)", use: "สติ๊กเกอร์ขนาดใหญ่ ติดกระจกร้าน ตู้สินค้า", note: "-" },
];

const portfolioImages = [
  "/images/portfolio/sticker-1.jpg",
  "/images/portfolio/sticker-2.jpg",
  "/images/portfolio/sticker-3.jpg",
  "/images/portfolio/sticker-4.jpg",
];

const processSteps = [
  { num: 1, icon: FileText, title: "ส่งรายละเอียดงาน", desc: "แจ้งขนาด ประเภท และรายละเอียดงานผ่าน LINE หรือฟอร์ม", time: "ภายใน 5 นาที" },
  { num: 2, icon: Calculator, title: "ประเมินราคา", desc: "ทีมงานส่งใบเสนอราคาให้พร้อมรายละเอียดครบถ้วน", time: "ภายใน 24 ชั่วโมง" },
  { num: 3, icon: CheckCircle2, title: "ยืนยันแบบและชำระเงิน", desc: "ตรวจสอบและยืนยันแบบร่วมกัน ชำระผ่านโอน/พร้อมเพย์", time: "ขั้นตอนง่าย" },
  { num: 4, icon: Cog, title: "ผลิตงาน", desc: "พิมพ์ด้วยเครื่องพิมพ์คุณภาพสูง ตรวจสอบความคมชัด", time: "1–3 วันทำการ" },
  { num: 5, icon: PackageCheck, title: "จัดส่งทั่วประเทศ", desc: "จัดส่งถึงมือคุณทุกจังหวัด พร้อมแจ้งเลขพัสดุ", time: "ทั่วประเทศ" },
];

const faqs = [
  { q: "ใช้เวลาผลิตนานแค่ไหน?", a: "โดยปกติ 1–3 วันทำการ ขึ้นอยู่กับจำนวนและประเภทงาน สำหรับงานด่วนแจ้งล่วงหน้าได้เลยครับ" },
  { q: "ต้องส่งไฟล์แบบไหน?", a: "รองรับไฟล์ AI, PDF, PSD ความละเอียดขั้นต่ำ 150 dpi ขึ้นไป สำหรับงานที่ต้องการคมชัดสูงแนะนำ 300 dpi" },
  { q: "สั่งขั้นต่ำเท่าไหร่?", a: "ไม่มีขั้นต่ำครับ สั่งได้ตั้งแต่ 1 ชิ้น บางประเภทอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งให้ทราบ" },
  { q: "Die-Cut ตัดรูปทรงอะไรได้บ้าง?", a: "ตัดได้ทุกรูปทรงตามไฟล์ที่ส่งมา ทั้งวงกลม สี่เหลี่ยม รูปดาว หรือรูปทรงอิสระตามแบบของคุณ" },
];

const serviceLinks = [
  "สติ๊กเกอร์โลโก้ / ฉลากสินค้า",
  "Sticker Indoor / Outdoor",
  "สติ๊กเกอร์ติดกระจก",
  "สติ๊กเกอร์ใส",
  "สติ๊กเกอร์โฮโลแกรม",
  "สติ๊กเกอร์ Die-Cut",
];

const socials = [
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", hoverBg: "#1877F2" },
  { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", hoverBg: "#06C755" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram", hoverBg: "#E1306C" },
];

const stickerFeatures = [
  { icon: Droplets, title: "กันน้ำ 100%", desc: "ทนแดด ทนฝน" },
  { icon: Sun, title: "สีไม่ซีดจาง", desc: "UV Resistant" },
  { icon: Scissors, title: "ไดคัทได้ทุกรูปทรง", desc: "ตามแบบที่ต้องการ" },
  { icon: Award, title: "วัสดุเกรดดี", desc: "ติดแน่น ทนนาน" },
];

type QuoteFormData = {
  name: string; phone: string; lineId: string; serviceType: string;
  width: string; height: string; quantity: number; details: string; needDate: string;
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050816]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[70px]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image src="/images/logo.png" alt="Display Works Media" fill priority className="object-contain" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider leading-none text-white uppercase">DISPLAY WORKS</div>
            <div className="font-bold text-sm tracking-wider text-[#FF7A00] leading-none uppercase">Media</div>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-sm transition-colors">{link.label}</a>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <a href="#quote" className="bg-[#FF7A00] hover:bg-[#e56a00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#FF7A00]/20">ขอใบเสนอราคา</a>
        </div>
        <button className="lg:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-[#0B1220] border-t border-white/10 px-6 py-6 flex flex-col gap-4 overflow-hidden">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-base border-b border-white/5 pb-2" onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <a href="#quote" className="mt-4 bg-[#FF7A00] text-white py-3 rounded-lg text-center font-bold" onClick={() => setMobileOpen(false)}>ขอใบเสนอราคา</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

export default function StickerLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<QuoteFormData>();

  const onSubmit = async (data: QuoteFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
      else alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-['Prompt',sans-serif] text-white bg-[#050816]">
      <Navbar />

      {/* ── BREADCRUMB ── */}
      <div className="pt-[70px] bg-[#050816] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-[#A7B0C0]">
          <Home size={14} />
          <ChevronRight size={14} />
          <span>บริการของเรา</span>
          <ChevronRight size={14} />
          <span className="text-[#FF7A00]">สติ๊กเกอร์</span>
        </div>
      </div>

      {/* ── 1. HERO SECTION ── */}
      <section id="hero" className="relative overflow-hidden flex items-center min-h-[560px] bg-[#050816]">
        <Image src="/images/services/sticker.jpg" alt="Sticker Printing" fill priority className="object-cover object-[center_right] z-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#050816] via-[#050816]/85 to-transparent/30" />
        <div className="absolute -bottom-2 left-0 right-0 h-[300px] lg:h-[400px] z-0 pointer-events-none bg-gradient-to-t from-[#050816] to-transparent" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full pt-16 pb-24"> 
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00] bg-transparent">
              บริการออกแบบและผลิต
            </div>
            <h1 className="font-['Kanit'] font-extrabold text-5xl lg:text-7xl mb-2 leading-tight text-white">สั่งสติ๊กเกอร์</h1>
            <h1 className="font-['Kanit'] font-extrabold text-5xl lg:text-7xl mb-6 text-[#FF7A00] leading-tight">คุณภาพสูง</h1>
            <p className="text-base text-gray-300 max-w-xl mb-10 leading-relaxed">
              พิมพ์สติ๊กเกอร์สีสด คมชัด ไดคัทได้ตามรูปแบบที่ต้องการ รองรับทั้งงาน Indoor และ Outdoor เหมาะสำหรับฉลากสินค้าและตกแต่งกระจกร้าน
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {stickerFeatures.map((f, i) => (
                <div key={i} className="bg-[#0B1220]/80 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#FF7A00]/10 text-[#FF7A00]"><f.icon size={20} /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight">{f.title}</span>
                    <span className="text-xs text-gray-400">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <a href="#quote" className="bg-[#FF7A00] hover:bg-[#FF8C33] px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-lg shadow-[#FF7A00]/20">
                ขอใบเสนอราคา <ArrowRight size={18} />
              </a>
              <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer" className="bg-[#00B900] hover:bg-[#009900] px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-lg shadow-[#00B900]/20">
                <MessageCircle size={18} /> ปรึกษาฟรีผ่าน LINE
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. STICKER KNOWLEDGE (GRID LAYOUT) ── */}
      <section id="knowledge" className="py-24 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Intro */}
          <div className="mb-16">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-6 text-center">เจาะลึกประเภทสติ๊กเกอร์ Indoor & Outdoor</h2>
            <div className="bg-[#141A24] border border-white/5 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base text-center">
                การเลือก <strong className="text-[#FF7A00]">'มีเดีย (Media)'</strong> หรือประเภทสติ๊กเกอร์ให้ถูกต้อง คือหัวใจสำคัญที่กำหนดทั้งความสวยงามและความคุ้มค่าของงาน โดยทั่วไปเราจะแบ่งสติ๊กเกอร์ออกเป็น 2 ประเภทใหญ่ คือ <strong>Indoor</strong> ที่เน้นความละเอียดประณีต และ <strong>Outdoor</strong> ที่เน้นความทนทานต่อสภาพอากาศ
              </p>
            </div>
          </div>

          {/* INDOOR SECTION */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-[#FF7A00] rounded-full" />
              <div>
                <h3 className="text-2xl font-['Kanit'] font-bold text-white leading-tight">สติ๊กเกอร์สำหรับภายใน (Indoor)</h3>
                <p className="text-[#FF7A00] text-sm mt-1 flex items-center gap-2"><Sparkles size={14} /> เน้นงานพิมพ์ละเอียดสูง สีสันสดใสมาก (แนะนำให้เคลือบงานเสมอ)</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {indoorMaterials.map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -5 }} className="bg-[#050816] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full shadow-xl">
                  {/* Image Header */}
                  <div className="relative aspect-video w-full bg-[#141A24] border-b border-white/5">
                    <Image src={item.image} alt={item.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-3 text-[#FF7A00]">{item.name}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">{item.desc}</p>

                    <div className="border-t border-white/5 pt-6 flex-grow">
                      <div className="font-bold text-white text-sm mb-3">จุดเด่น:</div>
                      <ul className="space-y-2 mb-6">
                        {item.highlights.map((p, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-1.5 flex-shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="font-bold text-white text-sm mb-3">การใช้งาน:</div>
                      <ul className="space-y-2">
                        {item.uses.map((u, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-1.5 flex-shrink-0" />
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* OUTDOOR SECTION */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-[#FF7A00] rounded-full" />
              <div>
                <h3 className="text-2xl font-['Kanit'] font-bold text-white leading-tight">สติ๊กเกอร์สำหรับภายนอก (Outdoor)</h3>
                <p className="text-[#FF7A00] text-sm mt-1 flex items-center gap-2"><Sun size={14} /> ทนแดด ทนฝน ไม่ต้องเคลือบก็ได้ ทนทานสูง 3-5 ปีขึ้นไป</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {outdoorMaterials.map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -5 }} className="bg-[#050816] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full shadow-xl">
                  {/* Image Header */}
                  <div className="relative aspect-video w-full bg-[#141A24] border-b border-white/5">
                    <Image src={item.image} alt={item.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-3 text-[#FF7A00]">{item.name}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">{item.desc}</p>

                    <div className="border-t border-white/5 pt-6 flex-grow">
                      <div className="font-bold text-white text-sm mb-3">จุดเด่น:</div>
                      <ul className="space-y-2 mb-6">
                        {item.highlights.map((p, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-1.5 flex-shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="font-bold text-white text-sm mb-3">การใช้งาน:</div>
                      <ul className="space-y-2">
                        {item.uses.map((u, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-1.5 flex-shrink-0" />
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── 2.5 USAGE GUIDELINES TABLE ── */}
      <section className="py-24 bg-[#050816] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold mb-4 text-white">สรุปแนวทางการใช้งานตาม <span className="text-[#FF7A00]">"วัตถุประสงค์"</span></h2>
            <p className="text-gray-400">เลือกประเภทสติ๊กเกอร์ให้เหมาะกับหน้างาน เพื่อผลลัพธ์ที่ดีที่สุด</p>
          </div>

          <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <table className="w-full text-left bg-[#0B1220]">
              <thead className="bg-[#FF7A00] text-white border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold w-1/3">หน้างาน / วัตถุประสงค์</th>
                  <th className="px-6 py-4 font-bold w-1/3">ประเภทสติ๊กเกอร์ที่ควรใช้</th>
                  <th className="px-6 py-4 font-bold w-1/3">เหตุผล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usageGuidelines.map((item, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 font-bold text-white">{item.useCase}</td>
                    <td className="px-6 py-5 text-[#FF7A00] font-semibold">{item.type}</td>
                    <td className="px-6 py-5 text-gray-400 text-sm leading-relaxed">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-4">
            {usageGuidelines.map((item, i) => (
              <div key={i} className="bg-[#0B1220] p-5 rounded-2xl border border-white/5 shadow-lg">
                <div className="font-bold text-white mb-2 text-lg">{item.useCase}</div>
                <div className="bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-3 py-2 rounded-lg mb-3">
                  <span className="text-xs text-gray-400 block mb-1">แนะนำ:</span>
                  <span className="text-[#FF7A00] font-bold text-sm">{item.type}</span>
                </div>
                <div className="text-sm text-gray-400 leading-relaxed"><span className="text-gray-300 font-semibold">เหตุผล:</span> {item.reason}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 3. CUT FINISHING ── */}
      <section id="cut-options" className="py-24 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-2">รูปแบบการตัดสติ๊กเกอร์</h2>
            <p className="text-gray-400">เลือกรูปแบบการตัดให้ตรงกับการนำไปใช้งาน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cutOptions.map((opt, i) => (
              <div key={i} className="bg-[#050816] rounded-2xl border border-white/5 flex flex-col sm:flex-row items-stretch hover:border-[#FF7A00]/50 transition-colors shadow-xl overflow-hidden group cursor-pointer">
                <div className="relative w-full sm:w-48 aspect-[16/9] sm:aspect-square bg-[#141A24] flex-shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 overflow-hidden">
                  <Image src={opt.image} alt={opt.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div className="p-6 lg:p-8 flex flex-col justify-center">
                  <h3 className="font-bold text-white text-xl mb-1">{opt.name}</h3>
                  <p className="text-gray-400 text-sm">{opt.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. SIZES TABLE ── */}
      <section className="py-24 bg-[#050816]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-['Kanit'] font-bold mb-4">ขนาดสติ๊กเกอร์ยอดฮิต</h2>
            <p className="text-gray-400">ขนาดมาตรฐานที่ลูกค้าส่วนใหญ่เลือกใช้</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <table className="w-full text-left bg-[#0B1220]">
              <thead className="bg-[#FF7A00] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold">ขนาด</th>
                  <th className="px-6 py-4 font-bold">การใช้งานที่แนะนำ</th>
                  <th className="px-6 py-4 font-bold hidden md:table-cell">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sizes.map((s, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 font-bold text-[#FF7A00]">{s.size}</td>
                    <td className="px-6 py-5 text-gray-300 text-sm">{s.use}</td>
                    <td className="px-6 py-5 text-gray-400 text-xs hidden md:table-cell">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500 tracking-widest">* สามารถสั่งไดคัทตามขนาดที่ต้องการ (Custom Size) ได้ทุกรูปแบบ</p>
        </div>
      </section>

      {/* ── 5. PORTFOLIO GALLERY ── */}
      <section id="portfolio" className="py-24 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-2">ตัวอย่างผลงานสติ๊กเกอร์</h2>
            <p className="text-gray-400">งานจริงจากทีมงาน Display Works Media</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolioImages.map((src, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer bg-[#050816]">
                <Image src={src} alt="Portfolio" fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                   <div className="bg-[#FF7A00] p-3 rounded-full"><Check size={24} className="text-white" /></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PROCESS ── */}
      <section id="process" className="py-24 lg:py-32 px-6 lg:px-8" style={{ background: "#050816" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF6B00]/30 text-[#FF6B00] bg-[#FF6B00]/10" style={{ textAlign: "center" }}>ขั้นตอนการทำงาน</div>
            <h2 className="text-3xl lg:text-4xl font-['Kanit'] font-bold text-white mb-6">ง่าย ครบ จบใน 5 ขั้นตอน</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-center text-base">ขั้นตอนที่ออกแบบมาเพื่อความสะดวกของคุณ ไม่ต้องเดินทาง ไม่ต้องนัดหมาย</p>
          </motion.div>

          <div className="hidden lg:block relative">
            <div className="absolute top-[52px] left-[10%] right-[10%] h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,107,0,0.5) 15%, rgba(255,107,0,0.5) 85%, transparent)" }} />
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }} className="absolute top-[52px] left-[10%] right-[10%] h-px origin-left" style={{ background: "rgba(255,107,0,0.3)" }} />
            <div className="grid grid-cols-5 gap-6">
              {processSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }} className="group flex flex-col items-center text-center">
                    <div className="relative z-10 w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center mb-6 cursor-default transition-all duration-300 group-hover:scale-105" style={{ background: "linear-gradient(135deg, #1A2233, #141A24)", border: "2px solid rgba(255,107,0,0.45)", boxShadow: "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #FF6B00, #CC5500)"; (e.currentTarget as HTMLElement).style.borderColor = "#FF6B00"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 8px rgba(255,107,0,0.12), 0 12px 32px rgba(255,107,0,0.3)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1A2233, #141A24)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.45)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)"; }}>
                      <span className="font-['Kanit'] font-bold text-xs mb-1 tracking-widest text-[#FF7A00]/70">{String(step.num).padStart(2, "0")}</span>
                      <Icon size={28} strokeWidth={1.5} className="text-[#FF7A00]" />
                    </div>
                    <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20">{step.time}</div>
                    <h3 className="font-['Kanit'] font-bold text-white text-sm mb-2 leading-snug">{step.title}</h3>
                    <p className="text-xs leading-relaxed text-[#A8B0C0]">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="lg:hidden flex flex-col gap-0">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.num} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="flex gap-5 items-start">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#FF7A00]/50" style={{ background: "linear-gradient(135deg, #1A2233, #141A24)" }}>
                      <Icon size={22} strokeWidth={1.5} className="text-[#FF7A00]" />
                    </div>
                    {i < processSteps.length - 1 && <div className="w-px mt-2" style={{ background: "linear-gradient(to bottom, rgba(255,107,0,0.4), transparent)", minHeight: "48px" }} />}
                  </div>
                  <div className="pb-8 pt-1 flex-1">
                    <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20">{step.time}</div>
                    <h3 className="font-['Kanit'] font-bold text-white text-base mb-1">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[#A8B0C0]">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="text-center mt-16">
            <a href="#quote" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5 bg-[#FF7A00] shadow-[0_4px_24px_rgba(255,107,0,0.25)]">เริ่มต้นสั่งงานเลย</a>
          </motion.div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section className="py-24 bg-[#0B1220]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-['Kanit'] font-bold text-center mb-12">คำถามที่พบบ่อย (FAQ)</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#050816] rounded-2xl overflow-hidden border border-white/5 shadow-lg">
                <button className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-all" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-bold text-sm">{faq.q}</span>
                  {openFaq === i ? <Minus size={18} className="text-[#FF7A00]" /> : <Plus size={18} className="text-gray-500" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-6 pb-6 text-sm text-gray-400 border-t border-white/5 pt-4 leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. QUOTE FORM ── */}
      <section id="quote" className="py-24 bg-[#050816] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00] bg-[#FF7A00]/10">ขอใบเสนอราคา</div>
              <h2 className="text-4xl lg:text-5xl font-['Kanit'] font-extrabold mb-6 leading-tight text-white">มีงานอยู่?<br />เราช่วยดูแลให้</h2>
              <p className="text-gray-400 mb-10 leading-relaxed text-lg">กรอกรายละเอียดงาน ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p>

              <div className="flex flex-col gap-4">
                {["ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา", "ตอบกลับภายใน 24 ชั่วโมง", "ให้คำปรึกษาฟรีก่อนตัดสินใจ", "ไม่ต้องมีไฟล์งาน สามารถบอกแนวคิดได้เลย"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-[#FF7A00] flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 rounded-xl border border-[#FF7A00]/20 bg-[#0B1220]">
                <div className="text-sm font-semibold text-white mb-3">ติดต่อด่วน</div>
                <a href="https://lin.ee/O0nPl03" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">💬 LINE: @displayworks</a>
                <a href="tel:0659161539" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">📞 065-916-1539</a>
                <a href="mailto:info.displayworksmedia@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">✉️ info.displayworksmedia@gmail.com</a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-3">
              <div className="p-8 lg:p-10 rounded-3xl border border-white/10 bg-[#0B1220] shadow-2xl">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
                    <CheckCircle size={56} className="text-[#FF7A00]" />
                    <h3 className="font-['Kanit'] font-bold text-2xl text-white">ส่งข้อมูลสำเร็จ!</h3>
                    <p className="text-gray-400 text-sm max-w-xs">ทีมงานได้รับข้อมูลของคุณแล้ว จะติดต่อกลับภายใน 24 ชั่วโมง</p>
                    <button onClick={() => setSubmitted(false)} className="mt-4 text-sm underline text-[#FF7A00]">ส่งใบเสนอราคาอีกครั้ง</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ชื่อ-นามสกุล *</label>
                        <input {...register("name", { required: true })} placeholder="ชื่อของคุณ" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-colors bg-[#050816]" style={{ border: `1px solid ${errors.name ? "#FF4444" : "rgba(255,255,255,0.08)"}` }} onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,0,0.5)")} onBlur={(e) => (e.target.style.borderColor = errors.name ? "#FF4444" : "rgba(255,255,255,0.08)")} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">เบอร์โทรศัพท์ *</label>
                        <input {...register("phone", { required: true })} placeholder="08X-XXX-XXXX" type="tel" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816]" style={{ border: `1px solid ${errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)"}` }} onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,0,0.5)")} onBlur={(e) => (e.target.style.borderColor = errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)")} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">LINE ID</label>
                        <input {...register("lineId")} placeholder="@lineid" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ประเภทสินค้า *</label>
                        <select {...register("serviceType", { required: true })} className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816]" style={{ border: `1px solid ${errors.serviceType ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}>
                          <option value="">เลือกประเภท</option>
                          {serviceLinks.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ขนาดกว้าง (cm)</label>
                        <input {...register("width")} placeholder="เช่น 100" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ขนาดสูง (cm)</label>
                        <input {...register("height")} placeholder="เช่น 200" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">จำนวน (ชิ้น)</label>
                        <input {...register("quantity")} type="number" min={1} placeholder="1" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">วันที่ต้องการรับงาน</label>
                        <input {...register("needDate")} type="date" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#050816] border border-white/10" style={{ colorScheme: "dark" }} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">รายละเอียดเพิ่มเติม</label>
                      <textarea {...register("details")} rows={4} placeholder="รายละเอียดงาน วัสดุ ความต้องการพิเศษ หรือสิ่งที่อยากให้เราทราบ..." className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-y bg-[#050816] border border-white/10 focus:border-[#FF7A00]/50" />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">แนบไฟล์ (ถ้ามี)</label>
                      <label className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed cursor-pointer transition-colors duration-200 border-[#FF7A00]/30 hover:border-[#FF7A00]/60 bg-[#050816]/50">
                        <Upload size={24} className="text-[#FF7A00]/70 mb-2" />
                        <span className="text-gray-400 text-sm">คลิกเพื่ออัปโหลดไฟล์ หรือลากวางที่นี่</span>
                        <span className="text-xs mt-1 text-gray-500">รองรับ AI, PDF, PSD, JPG, PNG (สูงสุด 50MB)</span>
                        <input type="file" className="hidden" accept=".ai,.pdf,.psd,.jpg,.jpeg,.png" />
                      </label>
                    </div>

                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-white text-base transition-all duration-200 disabled:opacity-70 bg-[#FF7A00] hover:bg-[#FF8C33] shadow-lg shadow-[#FF7A00]/20 mt-4">
                      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังส่งข้อมูล...</> : <><Send size={18} /> ส่งข้อมูลขอใบเสนอราคา</>}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง • ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา</p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer id="contact" className="bg-[#080B13] border-t border-white/5">
        <div className="py-8 px-6 lg:px-8 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-['Kanit'] font-bold text-white text-lg">พร้อมเริ่มโปรเจกต์แล้วหรือยัง?</p>
              <p className="text-sm text-gray-400">ประเมินราคาฟรี ตอบกลับภายใน 24 ชั่วโมง</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="https://lin.ee/O0nPl03" target="_blank" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#06C755] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#06C755]/20"><MessageCircle size={18} /> LINE</a>
              <a href="#quote" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#FF7A00] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#FF7A00]/20">ขอใบเสนอราคา</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-10 h-10 flex-shrink-0"><Image src="/images/logo.png" alt="Display Works Media" fill className="object-contain" /></div>
                <div>
                  <div className="font-bold text-sm tracking-wider text-white leading-none">DISPLAY WORKS</div>
                  <div className="font-bold text-sm tracking-wider leading-none text-[#FF7A00]">MEDIA</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6 text-gray-400">บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ</p>
              <div className="flex gap-2.5">
                {socials.map(({ icon: Icon, href, label, hoverBg }) => (
                  <a key={label} href={href} target="_blank" className="w-10 h-10 rounded-xl bg-[#141A24] border border-white/5 flex items-center justify-center text-gray-400 transition-all duration-200" onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = hoverBg; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#141A24"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9ca3af"; }}>
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">เมนู</h4>
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">บริการของเรา</h4>
              <div className="flex flex-col gap-3">
                {serviceLinks.map((s) => (
                  <a key={s} href="#knowledge" className="text-sm text-gray-400 hover:text-white transition-colors">{s}</a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">ติดต่อเรา</h4>
              <div className="flex flex-col gap-4">
                <a href="https://lin.ee/O0nPl03" target="_blank" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors"><MessageCircle size={16} className="text-[#06C755] flex-shrink-0 mt-0.5" /> LINE @displayworks</a>
                <a href="tel:0659161539" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors"><Phone size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" /> 065-916-1539</a>
                <a href="mailto:info.displayworksmedia@gmail.com" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors"><Mail size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" /> info.displayworksmedia@gmail.com</a>
                <div className="flex items-start gap-3 text-sm text-gray-400"><MapPin size={16} className="text-[#FF7A00] flex-shrink-0 mt-0.5" /> ให้บริการทั่วประเทศไทย</div>
              </div>
              <div className="mt-6 p-4 rounded-xl text-xs bg-[#141A24] border border-white/5 text-gray-400">
                <div className="font-bold text-white mb-1.5">เวลาทำการ</div>
                <div>จันทร์ – เสาร์: 9:00 – 18:00</div>
                <div>ตอบ LINE ทุกวัน ตลอด 24 ชม.</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-8 border-t border-white/5 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Display Works Media. All Rights Reserved.</span>
            <span>ออกแบบและพัฒนาโดยทีมงาน Display Works Media</span>
          </div>
        </div>
      </footer>
    </div>
  );
}