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
  Lock, MapPin, Mail, Instagram, Send, CheckCircle, Upload
} from "lucide-react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "#services" },
  { label: "ผลงานของเรา", href: "#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "#process" },
  { label: "ติดต่อเรา", href: "#quote" },
];

const materials = [
  { 
    name: "ไวนิลทึบแสง (Frontlit)", 
    desc: "เป็นไวนิลมาตรฐานที่พบเห็นได้ทั่วไปมากที่สุด ผิวด้านหน้าสีขาวนวล ด้านหลังเป็นสีเทาหรือสีขาว", 
    image: "/images/materials/frontlit.jpg", 
    highlights: [
      "เน้นการรับแสงจาก ด้านหน้า (ส่องไฟจากข้างนอกเข้าหาป้าย)",
      "ทนทานต่อแดดและฝนได้ดี ราคาประหยัดที่สุด",
      "มีให้เลือกทั้งแบบผิวเรียบและผิวหยาบ (Glossy / Matt)"
    ],
    uses: [
      "ป้ายคัทเอาท์ขนาดใหญ่ริมถนน (Billboard)",
      "ป้ายแบนเนอร์โปรโมชั่นหน้าร้าน",
      "ธงญี่ปุ่น (J-Flag) หรือป้าย X-Frame"
    ]
  },
  { 
    name: "ไวนิลหลังดำ (Blockout)", 
    desc: "เป็นไวนิลประเภททึบแสงพิเศษ โดยมีชั้นสีดำแทรกอยู่ตรงกลางหรือเคลือบไว้ที่ด้านหลัง", 
    image: "/images/materials/blockout.jpg", 
    highlights: [
      "ป้องกันแสงลอดผ่านได้ 100% แม้จะติดตั้งในที่ที่มีแสงแดดส่องจากด้านหลัง ป้ายก็จะไม่ดูฟุ้งหรือเห็นโครงเหล็กทะลุออกมา",
      "เนื้อวัสดุมีความหนาและเหนียวเป็นพิเศษ",
      "รักษาสีสันของงานพิมพ์ให้สดใส ไม่เพี้ยนเมื่อโดนแสงย้อน"
    ],
    uses: [
      "ป้ายที่ต้องติดตั้งกลางแจ้งในตำแหน่งที่แสงแดดส่องย้อนเข้าหาคนดู",
      "ป้ายโฆษณาที่ต้องการพิมพ์ทั้ง 2 ด้าน (Double-sided) เพื่อไม่ให้ภาพอีกฝั่งซ้อนทับกัน",
      "ฉากหลัง (Backdrop) งานอีเวนต์ที่มีแสงไฟส่องจากด้านหลังเวที"
    ]
  },
  { 
    name: "ไวนิลโปร่งแสง (Backlit)", 
    desc: "วัสดุมีลักษณะขาวกึ่งโปร่งใส ยอมให้แสงลอดผ่านได้ดีและสม่ำเสมอ", 
    image: "/images/materials/backlit.jpg", 
    highlights: [
      "เน้นการรับแสงจาก ด้านหลัง (แหล่งกำเนิดไฟอยู่ข้างในป้าย)",
      "เมื่อเปิดไฟจะทำให้ภาพดูสว่าง สดใส และโดดเด่นมากในตอนกลางคืน",
      "เนื้อผิวละเอียดเพื่อให้กระจายแสงได้เนียน ไม่เห็นเป็นดวงไฟ"
    ],
    uses: [
      "ตู้ไฟ (Light Box) ตามหน้าร้านค้าหรือร้านสะดวกซื้อ",
      "ป้ายเมนูอาหารในห้างสรรพสินค้า",
      "ป้ายโฆษณาในป้ายรถเมล์ (Bus Shelter) หรือรถไฟฟ้า"
    ]
  },
];

const edgeOptions = [
  { name: "ตัดปล่อยขอบงาน", sub: "ตัดตามขนาด ไม่เก็บขอบ", image: "/images/edges/cut.jpg" },
  { name: "พับเก็บขอบงาน", sub: "พับขอบเรียบร้อย ทนทาน", image: "/images/edges/fold.jpg" },
  { name: "เจาะตาไก่", sub: "รูสำหรับแขวน", image: "/images/edges/eyelet.jpg" },
  { name: "พับขอบร้อยท่อ", sub: "เหมาะสำหรับโครงร้อยท่อ", image: "/images/edges/tube.jpg" },
];

const sizes = [
  { size: "1 × 2 เมตร", use: "ป้ายหน้าร้าน ป้ายโปรโมชั่นขนาดเล็ก", note: "ขนาดยอดนิยม" },
  { size: "1.5 × 3 เมตร", use: "เหมาะสำหรับหน้าร้านอาหาร อาคารพาณิชย์", note: "แนะนำสำหรับร้านค้า" },
  { size: "2 × 4 เมตร", use: "เหมาะสำหรับป้ายโฆษณาขนาดกลางริมถนน", note: "-" },
  { size: "3 × 6 เมตร", use: "เหมาะสำหรับป้ายโฆษณาขนาดใหญ่ บิลบอร์ด", note: "-" },
  { size: "4 × 8 เมตร", use: "เหมาะสำหรับป้ายโฆษณาขนาดใหญ่พิเศษ", note: "-" },
];

const portfolioImages = [
  "/images/portfolio/1.png",
  "/images/portfolio/2.png",
  "/images/portfolio/3.png",
  "/images/portfolio/4.png",
];

// ข้อมูลขั้นตอนการทำงานจาก Process.tsx
const processSteps = [
  {
    num: 1,
    icon: FileText,
    title: "ส่งรายละเอียดงาน",
    desc: "แจ้งขนาด จำนวน และรายละเอียดงานผ่าน LINE หรือแบบฟอร์มออนไลน์ ง่าย ไม่ต้องเดินทาง",
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
    desc: "ดำเนินการผลิตโดยพาร์ทเนอร์คุณภาพสูง มั่นใจในมาตรฐาน ตรวจสอบคุณภาพก่อนส่งทุกครั้ง",
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

const faqs = [
  { q: "ใช้เวลาผลิตกี่วัน?", a: "โดยปกติ 1-3 วันทำการ สำหรับงานด่วนสามารถแจ้งล่วงหน้าได้" },
  { q: "มีบริการติดตั้งไหม?", a: "มีบริการติดตั้งสำหรับพื้นที่ใกล้เคียง หรือส่งพร้อมอุปกรณ์ให้ติดตั้งเองได้ง่ายๆ" },
  { q: "รับออกแบบหรือไม่?", a: "รับออกแบบครับ มีทีมกราฟิกช่วยออกแบบตามความต้องการ" },
  { q: "มีขั้นต่ำไหม?", a: "ไม่มีขั้นต่ำครับ สั่งเพียง 1 ชิ้นเราก็ยินดีให้บริการ" },
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
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", hoverBg: "#1877F2" },
  { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", hoverBg: "#06C755" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram", hoverBg: "#E1306C" },
];

const vinylFeatures = [
  { icon: Droplets, title: "กันน้ำ ทนฝน", desc: "100%" },
  { icon: Sun, title: "ไม่ซีดจาง", desc: "ทนแดดจัด" },
  { icon: Printer, title: "พิมพ์คมชัด", desc: "High Resolution" },
  { icon: Award, title: "วัสดุเกรด A", desc: "ใช้ได้นาน" },
];

type QuoteFormData = {
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
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image src="/images/logo.png" alt="Display Works Media logo" width={40} height={40} priority className="object-contain" />
          </div>
          <div>
            <div className="font-kanit font-bold text-sm tracking-wider leading-none text-white">DISPLAY WORKS</div>
            <div className="font-kanit font-bold text-sm tracking-wider leading-none text-[#FF6B00]">MEDIA</div>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-sm transition-colors">{link.label}</a>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <a href="#quote" className="bg-[#FF7A00] hover:bg-[#e56a00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">ขอใบเสนอราคา</a>
        </div>
        <button className="lg:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-[#0B1220] border-t border-white/10 px-6 py-6 flex flex-col gap-4 overflow-hidden">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-base" onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <a href="#quote" className="mt-2 bg-[#FF7A00] text-white py-3 rounded-lg text-center font-bold" onClick={() => setMobileOpen(false)}>ขอใบเสนอราคา</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

export default function VinylLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Form State
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
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
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
          <span className="text-[#FF7A00]">ป้ายไวนิล</span>
        </div>
      </div>

      {/* ── 1. HERO SECTION ── */}
      <section id="hero" className="relative overflow-hidden flex items-center min-h-[560px] bg-[#050816]">
        <Image src="/images/hero-bg-vinyl.jpg" alt="Vinyl Printing" fill priority className="object-cover object-[center_right] z-0" />
        
        {/* Overlays */}
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to right, #050816 10%, rgba(5, 8, 22, 0.85) 45%, rgba(5, 8, 22, 0.3) 75%, transparent 100%)" }} />
        <div className="absolute -bottom-2 left-0 right-0 h-[300px] lg:h-[400px] z-0 pointer-events-none" style={{ background: "linear-gradient(to top, #050816 0%, rgba(5,8,22,0.8) 50%, transparent 100%)" }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full pt-16 pb-24"> 
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00] bg-transparent">
              บริการออกแบบและผลิต
            </div>
            
            <h1 className="font-['Kanit'] font-extrabold text-5xl lg:text-7xl mb-6 leading-tight text-white">
              ป้ายไวนิล
              <span className="block text-[#FF7A00]">คุณภาพสูง</span>
            </h1>
            
            <p className="text-base text-gray-300 max-w-xl mb-10 leading-relaxed">
              พิมพ์ไวนิลสีสด คมชัด ทนแดด ทนฝน เหมาะสำหรับป้ายร้านค้า โฆษณา โปรโมชั่น และตกแต่งอาคารทุกประเภท
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {vinylFeatures.map((f, i) => (
                <div key={i} className="bg-[#0B1220]/80 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,122,0,0.1)", color: "#FF7A00" }}>
                    <f.icon size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight">{f.title}</span>
                    <span className="text-xs text-gray-400">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Buttons */}
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

      {/* ── 2. VINYL KNOWLEDGE ── */}
      <section id="knowledge" className="py-24 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-6">ทำความรู้จักป้ายไวนิลแต่ละประเภท</h2>
            
            {/* ความหมายของไวนิล */}
            <div className="bg-[#141A24] border border-white/5 p-6 rounded-2xl mb-10 shadow-lg">
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                <strong className="text-[#FF7A00]">ไวนิล (Vinyl)</strong> คือ วัสดุพลาสติกประเภทหนึ่งที่ผลิตมาจาก PVC (Polyvinyl Chloride) ซึ่งถูกนำมาพัฒนาให้มีคุณสมบัติยืดหยุ่น ทนทานต่อสภาพอากาศ และสามารถรับน้ำหมึกพิมพ์ได้ดี จึงเป็นวัสดุยอดนิยมอันดับ 1 ในอุตสาหกรรมป้ายโฆษณาและการพิมพ์
              </p>
            </div>

            <p className="text-gray-400 mb-8">เลือกใช้งานให้เหมาะกับธุรกิจคุณ</p>

            <div className="grid lg:grid-cols-3 gap-8">
              {materials.map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -5 }} className="bg-[#050816] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full shadow-2xl">
                  {/* Image Header */}
                  <div className="relative aspect-video w-full bg-[#141A24] border-b border-white/5">
                    <Image src={item.image} alt={item.name} fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-3 text-[#FF7A00]">{item.name}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">
                      {item.desc}
                    </p>

                    {/* Details Section */}
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

      {/* ── 3. EDGE FINISHING ── */}
      <section className="py-24 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-2">การเก็บชายป้ายไวนิล</h2>
            <p className="text-gray-400">เลือกรูปแบบการเก็บงานให้ตรงกับการติดตั้งของคุณ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {edgeOptions.map((opt, i) => (
              <div key={i} className="bg-[#0B1220] rounded-2xl border border-white/5 flex flex-col sm:flex-row items-stretch hover:border-[#FF7A00]/50 transition-colors shadow-xl overflow-hidden group cursor-pointer">
                {/* Left Side Image */}
                <div className="relative w-full sm:w-48 aspect-[16/9] sm:aspect-square bg-[#141A24] flex-shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 overflow-hidden">
                  <Image src={opt.image} alt={opt.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                {/* Right Side Content */}
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
      <section id="services" className="py-24 bg-[#0B1220]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-['Kanit'] font-bold mb-4">ขนาดป้ายไวนิลยอดฮิต</h2>
            <p className="text-gray-400">ขนาดมาตรฐานที่ร้านค้าส่วนใหญ่เลือกใช้</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <table className="w-full text-left bg-[#050816]">
              <thead className="bg-[#FF7A00] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold">ขนาด (กว้าง x สูง)</th>
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
          <p className="mt-6 text-center text-xs text-gray-500 tracking-widest">* สามารถสั่งผลิตตามขนาดที่ต้องการ (Custom Size) ได้ทุกรูปแบบ</p>
        </div>
      </section>

      {/* ── 5. PORTFOLIO GALLERY ── */}
      <section id="portfolio" className="py-24 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-2">ตัวอย่างผลงานป้ายไวนิล</h2>
            <p className="text-gray-400">งานจริงจากทีมงาน Display Works Media</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolioImages.map((src, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer bg-[#0B1220]">
                <Image src={src} alt="Portfolio" fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                   <div className="bg-[#FF7A00] p-3 rounded-full"><Check size={24} className="text-white" /></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PROCESS (จาก Process.tsx) ── */}
      <section id="process" className="py-24 lg:py-32 px-6 lg:px-8" style={{ background: "#0B0F19" }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF6B00]/30 text-[#FF6B00] bg-[#FF6B00]/10" style={{ textAlign: "center" }}>
              ขั้นตอนการทำงาน
            </div>
            <h2 className="text-3xl lg:text-4xl font-['Kanit'] font-bold text-white mb-6">ง่าย ครบ จบใน 5 ขั้นตอน</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-center text-base">
              ขั้นตอนที่ออกแบบมาเพื่อความสะดวกของคุณ ไม่ต้องเดินทาง ไม่ต้องนัดหมาย
            </p>
          </motion.div>

          {/* ── Desktop timeline ── */}
          <div className="hidden lg:block relative">
            {/* Progress line */}
            <div
              className="absolute top-[52px] left-[10%] right-[10%] h-px"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(255,107,0,0.5) 15%, rgba(255,107,0,0.5) 85%, transparent)",
              }}
            />
            {/* Animated fill line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="absolute top-[52px] left-[10%] right-[10%] h-px origin-left"
              style={{ background: "rgba(255,107,0,0.3)" }}
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
                        border: "2px solid rgba(255,107,0,0.45)",
                        boxShadow: "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #FF6B00, #CC5500)";
                        (e.currentTarget as HTMLElement).style.borderColor = "#FF6B00";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 8px rgba(255,107,0,0.12), 0 12px 32px rgba(255,107,0,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1A2233, #141A24)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.45)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)";
                      }}
                    >
                      <span
                        className="font-['Kanit'] font-bold text-xs mb-1 tracking-widest"
                        style={{ color: "rgba(255,107,0,0.7)" }}
                      >
                        {String(step.num).padStart(2, "0")}
                      </span>
                      <Icon size={28} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
                    </div>

                    {/* Time badge */}
                    <div
                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                      style={{
                        background: "rgba(255,107,0,0.08)",
                        color: "#FF6B00",
                        border: "1px solid rgba(255,107,0,0.15)",
                      }}
                    >
                      {step.time}
                    </div>

                    <h3 className="font-['Kanit'] font-bold text-white text-sm mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#A8B0C0" }}>
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Mobile vertical timeline ── */}
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
                        borderColor: "rgba(255,107,0,0.5)",
                      }}
                    >
                      <Icon size={22} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
                    </div>
                    {i < processSteps.length - 1 && (
                      <div
                        className="w-px mt-2"
                        style={{
                          background: "linear-gradient(to bottom, rgba(255,107,0,0.4), transparent)",
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
                        background: "rgba(255,107,0,0.08)",
                        color: "#FF6B00",
                        border: "1px solid rgba(255,107,0,0.15)",
                      }}
                    >
                      {step.time}
                    </div>
                    <h3 className="font-['Kanit'] font-bold text-white text-base mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#A8B0C0" }}>
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
                background: "#FF6B00",
                boxShadow: "0 4px 24px rgba(255,107,0,0.25)",
              }}
            >
              เริ่มต้นสั่งงานเลย
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section className="py-24 bg-[#050816]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-['Kanit'] font-bold text-center mb-12">คำถามที่พบบ่อย (FAQ)</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#0B1220] rounded-2xl overflow-hidden border border-white/5 shadow-lg">
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
      <section id="quote" className="py-24 bg-[#0B0F19] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
            
            {/* Left Info */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00] bg-[#FF7A00]/10">
                ขอใบเสนอราคา
              </div>
              <h2 className="text-4xl lg:text-5xl font-['Kanit'] font-extrabold mb-6 leading-tight text-white">
                มีงานอยู่?<br />เราช่วยดูแลให้
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed text-lg">
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
                    <CheckCircle size={18} className="text-[#FF7A00] flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 rounded-xl border border-[#FF7A00]/20 bg-[#141A24]">
                <div className="text-sm font-semibold text-white mb-3">ติดต่อด่วน</div>
                <a href="https://lin.ee/O0nPl03" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">💬 LINE: @displayworks</a>
                <a href="tel:0659161539" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2">📞 065-916-1539</a>
                <a href="mailto:info.displayworksmedia@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">✉️ info.displayworksmedia@gmail.com</a>
              </div>
            </motion.div>

            {/* Right Form */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-3">
              <div className="p-8 lg:p-10 rounded-3xl border border-white/10 bg-[#141A24] shadow-2xl">
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
                        <input {...register("name", { required: true })} placeholder="ชื่อของคุณ" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-colors bg-[#0d1220]" style={{ border: `1px solid ${errors.name ? "#FF4444" : "rgba(255,255,255,0.08)"}` }} onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,0,0.5)")} onBlur={(e) => (e.target.style.borderColor = errors.name ? "#FF4444" : "rgba(255,255,255,0.08)")} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">เบอร์โทรศัพท์ *</label>
                        <input {...register("phone", { required: true })} placeholder="08X-XXX-XXXX" type="tel" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220]" style={{ border: `1px solid ${errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)"}` }} onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,0,0.5)")} onBlur={(e) => (e.target.style.borderColor = errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)")} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">LINE ID</label>
                        <input {...register("lineId")} placeholder="@lineid" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ประเภทสินค้า *</label>
                        <select {...register("serviceType", { required: true })} className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220]" style={{ border: `1px solid ${errors.serviceType ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}>
                          <option value="">เลือกประเภท</option>
                          {serviceLinks.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ขนาดกว้าง (cm)</label>
                        <input {...register("width")} placeholder="เช่น 100" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ขนาดสูง (cm)</label>
                        <input {...register("height")} placeholder="เช่น 200" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">จำนวน (ชิ้น)</label>
                        <input {...register("quantity")} type="number" min={1} placeholder="1" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">วันที่ต้องการรับงาน</label>
                        <input {...register("needDate")} type="date" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10" style={{ colorScheme: "dark" }} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">รายละเอียดเพิ่มเติม</label>
                      <textarea {...register("details")} rows={4} placeholder="รายละเอียดงาน วัสดุ ความต้องการพิเศษ หรือสิ่งที่อยากให้เราทราบ..." className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-y bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">แนบไฟล์ (ถ้ามี)</label>
                      <label className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed cursor-pointer transition-colors duration-200 border-[#FF7A00]/30 hover:border-[#FF7A00]/60">
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-gray-400 text-sm">คลิกเพื่ออัปโหลดไฟล์ หรือลากวางที่นี่</span>
                        <span className="text-xs mt-1 text-gray-500">รองรับ AI, PDF, PSD, JPG, PNG (สูงสุด 50MB)</span>
                        <input type="file" className="hidden" accept=".ai,.pdf,.psd,.jpg,.jpeg,.png" />
                      </label>
                    </div>

                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-white text-base transition-all duration-200 disabled:opacity-70 bg-[#FF7A00] hover:bg-[#FF8C33] shadow-lg shadow-[#FF7A00]/20 mt-4">
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังส่งข้อมูล...</>
                      ) : (
                        <><Send size={18} /> ส่งข้อมูลขอใบเสนอราคา</>
                      )}
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
              <a href="https://lin.ee/O0nPl03" target="_blank" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#06C755] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#06C755]/20">
                <MessageCircle size={18} /> LINE
              </a>
              <a href="#quote" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#FF7A00] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#FF7A00]/20">
                ขอใบเสนอราคา
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            {/* Brand */}
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

            {/* Nav Links */}
            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">เมนู</h4>
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-xs font-bold tracking-widest mb-5 text-white">บริการของเรา</h4>
              <div className="flex flex-col gap-3">
                {serviceLinks.map((s) => (
                  <a key={s} href="#services" className="text-sm text-gray-400 hover:text-white transition-colors">{s}</a>
                ))}
              </div>
            </div>

            {/* Contact */}
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
