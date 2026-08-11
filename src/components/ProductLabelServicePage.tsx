"use client";

import { useState, useEffect } from "react";
import GlobalNavbar from "@/components/Navbar";
import GlobalFooter from "@/components/Footer";
import SharedServiceSections from "@/components/SharedMarketingSections";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Plus, Minus, Check, Phone, MessageCircle, ArrowRight, ChevronRight, Sun, Printer, Award, ShoppingCart, UserCheck, PackageCheck, Menu, X, FileText, Calculator, CheckCircle2, Cog, Scissors, Layers, Home, Droplets, Zap, Truck, MapPin, Mail, Send, CheckCircle, Upload, Sparkles } from "lucide-react";
import { Facebook, Instagram } from "@/components/BrandIcons";

// ─── DATA ───────────────────────────────────────────────────────────────────

const navLinks = [
  { label: "หน้าแรก", href: "#hero" },
  { label: "บริการของเรา", href: "#services" },
  { label: "ผลงานของเรา", href: "#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "#process" },
  { label: "ติดต่อเรา", href: "#quote" },
];

// เปลี่ยนข้อมูลให้เป็นของ Sticker / Label
const materials = [
  {
    name: "สติกเกอร์ PP (เงา / ด้าน)",
    desc: "วัสดุเนื้อพลาสติกยอดนิยม ให้ผิวสัมผัสเรียบเนียน ไม่ฉีกขาด กันน้ำได้ 100% เหมาะสำหรับสินค้าพรีเมียมที่ต้องแช่เย็นหรือโดนน้ำ",
    image: "/images/sticker/sticker-pp.jpg",
    highlights: [
      "กันน้ำ 100% สามารถแช่น้ำหรือแช่แข็งได้โดยที่สีไม่ลอก",
      "เนื้อพลาสติกเหนียว ทนทาน ฉีกไม่ขาด",
      "เลือกเคลือบผิวได้ทั้งแบบ 'เงา' (โดดเด่น) หรือ 'ด้าน' (เรียบหรู)"
    ],
    uses: [
      "ฉลากขวดเครื่องดื่ม / แก้วกาแฟ / ชานม",
      "บรรจุภัณฑ์เครื่องสำอาง / สกินแคร์",
      "กล่องอาหารแช่เย็น / อาหารแช่แข็ง"
    ]
  },
  {
    name: "สติกเกอร์ใส (Clear PP)",
    desc: "เนื้อพลาสติกใสโปร่งแสง ทะลุเห็นพื้นผิวของบรรจุภัณฑ์หรือเนื้อสินค้าด้านใน ให้ลุคที่ดูทันสมัยและเป็นหนึ่งเดียวกับตัวขวด",
    image: "/images/sticker/sticker-clear.jpg",
    highlights: [
      "ใสเคลียร์ กลมกลืนไปกับผิวบรรจุภัณฑ์ ดูเหมือนพิมพ์ลงบนขวดโดยตรง",
      "กันน้ำได้ 100% กาวเหนียวไม่ทิ้งคราบ",
      "สามารถเพิ่มเทคนิค 'พิมพ์รองขาว' เพื่อให้โลโก้เด่นชัดขึ้นบนพื้นใสได้"
    ],
    uses: [
      "ขวดน้ำแร่ / น้ำผลไม้สกัดเย็น / เครื่องดื่มพรีเมียม",
      "กระปุกกระจก / ขวดแก้ว / บรรจุภัณฑ์ใส",
      "สติกเกอร์ปิดปากถุงขนม หรือ Seal ป้องกันการแกะ"
    ]
  },
  {
    name: "สติกเกอร์กระดาษ",
    desc: "เนื้อวัสดุเป็นกระดาษ สีสันสดใส คมชัด ราคาประหยัดและคุ้มค่าที่สุด เหมาะสำหรับสินค้าที่ไม่มีความจำเป็นต้องโดนน้ำ",
    image: "/images/sticker/sticker-paper.jpg",
    highlights: [
      "ราคาประหยัดที่สุด ช่วยลดต้นทุนบรรจุภัณฑ์ได้อย่างดีเยี่ยม",
      "งานพิมพ์สีสด คมชัด เนื้อกระดาษเนียนสวยงาม",
      "กาวเหนียว ติดแน่น ทนทานต่อการขีดข่วนทั่วไป"
    ],
    uses: [
      "กล่องเบเกอรี่ / ถุงคุกกี้ / ขนมแห้ง",
      "กล่องพัสดุ / ซองจดหมาย / ป้ายสินค้าทั่วไป",
      "ฉลากสินค้า OTOP / ของชำร่วยงานแต่ง"
    ]
  },
];

// เอาเคลือบเงา/เคลือบด้านออก เหลือแค่รูปแบบไดคัท
const edgeOptions = [
  { name: "ไดคัท Half-Cut", sub: "ลอกง่าย เป็นดวงๆ บนแผ่น A3+", image: "/images/sticker/cut-half.jpg" },
  { name: "ไดคัท 100%", sub: "ตัดขาดเป็นชิ้นต่อชิ้น แจกง่าย", image: "/images/sticker/cut-full.jpg" },
];

const sizes = [
  { size: "วงกลม 3 × 3 ซม.", use: "ฝากระปุกเล็ก, ซีลปิดปากถุง", note: "ยอดนิยม" },
  { size: "วงกลม 4 × 4 ซม.", use: "แก้วกาแฟ, กล่องขนม, เบเกอรี่", note: "ยอดฮิตร้านน้ำ" },
  { size: "วงกลม 5 × 5 ซม.", use: "ติดถุงขนม, โลโก้แบรนด์ชัดเจน", note: "-" },
  { size: "สี่เหลี่ยม 3 × 5 ซม.", use: "ขวดน้ำสกัด, ตลับครีม, แยม", note: "-" },
  { size: "สี่เหลี่ยม 4 × 6 ซม.", use: "กล่องอาหาร, แพคเกจจิ้งต่างๆ", note: "-" },
];

const portfolioImages = [
  "/images/portfolio/sticker-1.png",
  "/images/portfolio/sticker-2.png",
  "/images/portfolio/sticker-3.png",
  "/images/portfolio/sticker-4.png",
];

const processSteps = [
  {
    num: 1,
    icon: FileText,
    title: "ส่งรายละเอียดงาน",
    desc: "แจ้งขนาด จำนวน รูปทรง และส่งไฟล์โลโก้ผ่าน LINE หรือแบบฟอร์มออนไลน์ ง่าย ไม่ต้องเดินทาง",
    time: "ภายใน 5 นาที",
  },
  {
    num: 2,
    icon: Calculator,
    title: "ประเมินราคา",
    desc: "ทีมงานคำนวณจำนวนดวงให้คุ้มค่าที่สุด พร้อมส่งใบเสนอราคา ภายใน 24 ชั่วโมง",
    time: "ภายใน 24 ชั่วโมง",
  },
  {
    num: 3,
    icon: CheckCircle2,
    title: "ตรวจแบบและยืนยัน",
    desc: "ทีมงานจัดทำแบบการวางไดคัทให้ตรวจสอบความถูกต้องก่อนสั่งพิมพ์จริงทุกครั้ง",
    time: "ขั้นตอนง่าย",
  },
  {
    num: 4,
    icon: Cog,
    title: "ผลิตและไดคัท",
    desc: "พิมพ์ด้วยระบบดิจิตอลความละเอียดสูง พร้อมไดคัทตามทรงด้วยเครื่องทันสมัย",
    time: "1–2 วันทำการ",
  },
  {
    num: 5,
    icon: PackageCheck,
    title: "จัดส่งทั่วประเทศ",
    desc: "แพ็กห่อกันกระแทกอย่างดี จัดส่งถึงมือคุณทุกจังหวัด พร้อมแจ้งเลขพัสดุ",
    time: "ทั่วประเทศ",
  },
];

const faqs = [
  { q: "ฉลากสินค้าขั้นต่ำในการสั่งผลิตกี่แผ่น?", a: "ทางเราไม่มีขั้นต่ำในการสั่งผลิตครับ สามารถสั่งเริ่มต้นเพียง 1 ตารางเมตร (หรือตามข้อตกลง) เพื่อทดลองติดสินค้าก่อนได้ครับ" },
  { q: "สติกเกอร์ PP กับ สติกเกอร์กระดาษ ต่างกันอย่างไร?", a: "สติกเกอร์ PP เป็นเนื้อพลาสติก กันน้ำได้ 100% ฉีกไม่ขาด เหมาะกับของแช่เย็น แช่น้ำ ส่วนสติกเกอร์กระดาษ ไม่กันน้ำแต่ราคาประหยัดที่สุด เหมาะกับสินค้าแห้งทั่วไปครับ" },
  { q: "ส่งไฟล์งานรูปแบบไหนดีที่สุด?", a: "แนะนำไฟล์ที่มีความคมชัดสูง เช่น AI, PDF, PSD หรือหากเป็นรูปภาพควรเป็นไฟล์ PNG, JPG ที่มีความละเอียดสูง เพื่อให้งานพิมพ์ออกมาคมชัดที่สุดครับ" },
  { q: "มีบริการออกแบบโลโก้ฉลากสินค้าให้ไหม?", a: "มีบริการออกแบบโดยทีมกราฟิกมืออาชีพครับ คุณสามารถแจ้งแนวคิด โทนสี หรือรูปแบบที่ต้องการให้ทีมงานช่วยประเมินราคาค่าออกแบบเพิ่มเติมได้ครับ" },
];

const serviceLinks = [
  "ป้ายไวนิล",
  "Sticker Indoor / Outdoor",
  "PP Board / Standee",
  "Roll Up / X-Stand",
  "ฉลากสินค้า",
  "Backdrop",
];

const socials = [
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61581015452518", label: "Facebook", hoverBg: "#1877F2" },
  { icon: MessageCircle, href: "https://lin.ee/O0nPl03", label: "LINE", hoverBg: "#047857" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram", hoverBg: "#E1306C" },
];

const stickerFeatures = [
  { icon: Droplets, title: "กันน้ำ 100%", desc: "แช่เย็น แช่น้ำแข็งได้" },
  { icon: Sparkles, title: "สีสด คมชัด", desc: "ความละเอียดสูง" },
  { icon: Scissors, title: "ไดคัทฟรีฟอร์ม", desc: "ตามรูปทรงโลโก้" },
  { icon: Layers, title: "กาวเหนียว", desc: "ไม่หลุดลอกง่าย" },
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050806]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
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
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-sm transition-colors">{link.label}</a>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <a href="#quote" className="bg-[#C2410C] hover:bg-[#9A3412] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">ขอใบเสนอราคา</a>
        </div>
        <button type="button" className="lg:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-[#0E1310] border-t border-white/10 px-6 py-6 flex flex-col gap-4 overflow-hidden">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-[#A7B0C0] hover:text-white text-base" onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <a href="#quote" className="mt-2 bg-[#C2410C] text-white py-3 rounded-lg text-center font-bold" onClick={() => setMobileOpen(false)}>ขอใบเสนอราคา</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

export default function LabelServicePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form State
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<QuoteFormData>();

  const onSubmit = async (data: QuoteFormData) => {
    setLoading(true);
    try {
      // Mock API
      await new Promise(r => setTimeout(r, 1200));
      setSubmitted(true);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brand-interior brand-service-detail min-h-screen font-['Prompt',sans-serif] text-white bg-[#050806]">
      <GlobalNavbar />

      {/* ── BREADCRUMB ── */}
      <div className="pt-[70px] bg-[#050806] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-[#A7B0C0]">
          <Home size={14} />
          <ChevronRight size={14} />
          <span>บริการของเรา</span>
          <ChevronRight size={14} />
          <span className="text-[#FF7A00]">ฉลากสินค้า / สติกเกอร์</span>
        </div>
      </div>

      {/* ── 1. HERO SECTION ── */}
      <section id="hero" className="relative overflow-hidden flex items-center min-h-[560px] bg-[#050806]">
        <Image src="/images/services/product-label-hero.jpg" alt="Product Label Printing" fill priority className="object-cover object-[center_right] z-0" />

        {/* Overlays */}
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to right, #050806 10%, rgba(5, 8, 6, 0.85) 45%, rgba(5, 8, 6, 0.3) 75%, transparent 100%)" }} />
        <div className="absolute -bottom-2 left-0 right-0 h-[300px] lg:h-[400px] z-0 pointer-events-none" style={{ background: "linear-gradient(to top, #050806 0%, rgba(5,8,6,0.8) 50%, transparent 100%)" }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full pt-16 pb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00] bg-transparent">
              บริการพิมพ์และไดคัทสติกเกอร์
            </div>

            <h1 className="font-['Kanit'] font-extrabold text-5xl lg:text-7xl mb-2 leading-tight text-white">พิมพ์ฉลากสินค้า</h1>
            <div className="font-['Kanit'] font-extrabold text-5xl lg:text-7xl mb-6 text-[#FF7A00] leading-tight">ระบบดิจิตอล</div>

            <p className="text-base text-gray-300 max-w-xl mb-10 leading-relaxed">
              ยกระดับแบรนด์ของคุณด้วยฉลากสินค้าสีสด คมชัด ไดคัทฟรีฟอร์ม ลอกแปะง่าย ติดแน่นทนนาน รองรับงานกันน้ำ แช่เย็นได้ 100%
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {stickerFeatures.map((f, i) => (
                <div key={i} className="bg-[#0E1310]/80 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex items-center gap-4">
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
              <a href="#quote" className="bg-[#C2410C] hover:bg-[#9A3412] px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-lg shadow-[#FF7A00]/20">
                ขอใบเสนอราคา <ArrowRight size={18} />
              </a>
              <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer" className="bg-[#00B900] hover:bg-[#009900] px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-lg shadow-[#00B900]/20">
                <MessageCircle size={18} /> ปรึกษาฟรีผ่าน LINE
              </a>
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── 2. STICKER KNOWLEDGE ── */}
      <section id="knowledge" className="py-24 bg-[#0E1310]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-6">เลือกเนื้อวัสดุสติกเกอร์ที่เหมาะกับสินค้า</h2>

            <div className="bg-[#141A24] border border-white/5 p-6 rounded-2xl mb-10 shadow-lg">
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                <strong className="text-[#FF7A00]">ฉลากสินค้าที่ดี</strong> ต้องไม่เพียงแต่สวยงาม แต่ต้องเลือกใช้วัสดุที่ตอบโจทย์การใช้งานจริง เช่น สินค้าแช่เย็นต้องใช้เนื้อพลาสติก PP กันน้ำ หรือแพคเกจจิ้งขนมแห้ง สามารถใช้กระดาษเพื่อลดต้นทุนได้
              </p>
            </div>

            <p className="text-gray-400 mb-8">วัสดุที่เราให้บริการ</p>

            <div className="grid lg:grid-cols-3 gap-8">
              {materials.map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -5 }} className="bg-[#050806] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full shadow-2xl">
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
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C2410C] mt-1.5 flex-shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="font-bold text-white text-sm mb-3">เหมาะสำหรับ:</div>
                      <ul className="space-y-2">
                        {item.uses.map((u, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C2410C] mt-1.5 flex-shrink-0" />
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

      {/* ── 3. EDGE FINISHING (รูปแบบไดคัท) ── */}
      <section className="py-24 bg-[#050806]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-2">รูปแบบการไดคัท</h2>
            <p className="text-gray-400">เลือกรูปแบบการตัดที่เหมาะกับการใช้งานของคุณ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {edgeOptions.map((opt, i) => (
              <div key={i} className="bg-[#0E1310] rounded-2xl border border-white/5 flex flex-col sm:flex-row items-stretch hover:border-[#FF7A00]/50 transition-colors shadow-xl overflow-hidden group cursor-pointer">
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
      <section id="services" className="py-24 bg-[#0E1310]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-['Kanit'] font-bold mb-4">ขนาดยอดนิยมที่แนะนำ</h2>
            <p className="text-gray-400">ตัวอย่างสัดส่วนที่เหมาะกับบรรจุภัณฑ์ประเภทต่างๆ</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <table className="w-full text-left bg-[#050806]">
              <thead className="bg-[#C2410C] text-white">
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
          <p className="mt-6 text-center text-xs text-gray-500 tracking-widest">* รับทำไดคัทฟรีฟอร์ม (Die-cut Freeform) ตามรูปทรงโลโก้ ฟรีค่าบล็อกไดคัท!</p>
        </div>
      </section>

      {/* ── 5. PORTFOLIO GALLERY ── */}
      <section id="legacy-portfolio" className="py-24 bg-[#050806]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-['Kanit'] font-bold text-white mb-2">ตัวอย่างผลงานฉลากสินค้า</h2>
            <p className="text-gray-400">งานพิมพ์คมชัด ไดคัทสวยงาม โดยทีมงาน Display Works Media</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {portfolioImages.map((src, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer bg-[#0E1310]">
                <Image src={src} alt="Portfolio" fill className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                   <div className="bg-[#C2410C] p-3 rounded-full"><Check size={24} className="text-white" /></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PROCESS ── */}
      <section id="legacy-process" className="py-24 lg:py-32 px-6 lg:px-8" style={{ background: "#0B0F19" }}>
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
              สั่งพิมพ์ออนไลน์เต็มรูปแบบ เราจัดวางไดคัทให้ดูก่อนพิมพ์จริง จัดส่งรวดเร็วทั่วประเทศ
            </p>
          </motion.div>

          {/* ── Desktop timeline ── */}
          <div className="hidden lg:block relative">
            <div
              className="absolute top-[52px] left-[10%] right-[10%] h-px"
              style={{ background: "linear-gradient(to right, transparent, rgba(255,107,0,0.5) 15%, rgba(255,107,0,0.5) 85%, transparent)" }}
            />
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
                  <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }} className="group flex flex-col items-center text-center">
                    <div className="relative z-10 w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center mb-6 cursor-default transition-all duration-300 group-hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #1A2233, #141A24)", border: "2px solid rgba(255,107,0,0.45)", boxShadow: "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #FF6B00, #CC5500)"; (e.currentTarget as HTMLElement).style.borderColor = "#FF6B00"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 8px rgba(255,107,0,0.12), 0 12px 32px rgba(255,107,0,0.3)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1A2233, #141A24)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.45)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)"; }}>
                      <span className="font-['Kanit'] font-bold text-xs mb-1 tracking-widest" style={{ color: "rgba(255,107,0,0.7)" }}>{String(step.num).padStart(2, "0")}</span>
                      <Icon size={28} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
                    </div>
                    <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: "rgba(255,107,0,0.08)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.15)" }}>
                      {step.time}
                    </div>
                    <h3 className="font-['Kanit'] font-bold text-white text-sm mb-2 leading-snug">{step.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#A8B0C0" }}>{step.desc}</p>
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
                <motion.div key={step.num} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="flex gap-5 items-start">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ background: "linear-gradient(135deg, #1A2233, #141A24)", borderColor: "rgba(255,107,0,0.5)" }}>
                      <Icon size={22} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
                    </div>
                    {i < processSteps.length - 1 && (
                      <div className="w-px mt-2" style={{ background: "linear-gradient(to bottom, rgba(255,107,0,0.4), transparent)", minHeight: "48px" }} />
                    )}
                  </div>
                  <div className="pb-8 pt-1 flex-1">
                    <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2" style={{ background: "rgba(255,107,0,0.08)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.15)" }}>
                      {step.time}
                    </div>
                    <h3 className="font-['Kanit'] font-bold text-white text-base mb-1">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#A8B0C0" }}>{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="text-center mt-16">
            <a href="#quote" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5" style={{ background: "#C2410C", boxShadow: "0 4px 24px rgba(255,107,0,0.25)" }}>
              เริ่มต้นสั่งงานเลย
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section className="py-24 bg-[#050806]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-['Kanit'] font-bold text-center mb-12">คำถามที่พบบ่อย (FAQ)</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#0E1310] rounded-2xl overflow-hidden border border-white/5 shadow-lg">
                <button type="button" className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-all" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
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
      <section id="legacy-quote" className="py-24 bg-[#0B0F19] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

            {/* Left Info */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00] bg-[#C2410C]/10">
                ขอใบเสนอราคา
              </div>
              <h2 className="text-4xl lg:text-5xl font-['Kanit'] font-extrabold mb-6 leading-tight text-white">
                ต้องการฉลากสินค้า?<br />เราคำนวณราคาให้ฟรี
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed text-lg">
                กรอกรายละเอียดขนาดและจำนวนดวงที่ต้องการ ทีมงานจะสรุปราคาและติดต่อกลับภายใน 24 ชั่วโมง
              </p>

              <div className="flex flex-col gap-4">
                {[
                  "คำนวณจำนวนดวงคุ้มที่สุดต่อแผ่น",
                  "ประเมินราคาฟรี ไม่มีข้อผูกมัดใดๆ",
                  "ให้คำปรึกษาเรื่องเนื้อสติกเกอร์ฟรี",
                  "จัดส่งแบบวางไดคัทให้ตรวจสอบก่อนพิมพ์จริง",
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
                    <p className="text-gray-400 text-sm max-w-xs">ทีมงานได้รับข้อมูลของคุณแล้ว จะติดต่อกลับพร้อมใบเสนอราคาโดยเร็วที่สุดครับ</p>
                    <button type="button" onClick={() => setSubmitted(false)} className="mt-4 text-sm underline text-[#FF7A00]">ส่งข้อมูลขอราคาอีกครั้ง</button>
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
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ประเภทสติกเกอร์ที่สนใจ *</label>
                        <select {...register("serviceType", { required: true })} defaultValue="ฉลากสินค้า (สติกเกอร์ PP)" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220]" style={{ border: `1px solid ${errors.serviceType ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}>
                          <option value="ฉลากสินค้า (สติกเกอร์ PP)">ฉลากสินค้า (สติกเกอร์ PP กันน้ำ)</option>
                          <option value="ฉลากสินค้า (สติกเกอร์กระดาษ)">ฉลากสินค้า (สติกเกอร์กระดาษ)</option>
                          <option value="ฉลากสินค้า (สติกเกอร์ใส)">ฉลากสินค้า (สติกเกอร์แบบใส)</option>
                          <option value="สติกเกอร์ไดคัทรูปแบบอื่น">สติกเกอร์ไดคัทรูปแบบอื่นๆ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ความกว้างต่อดวง (cm)</label>
                        <input {...register("width")} placeholder="เช่น 4" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">ความสูงต่อดวง (cm)</label>
                        <input {...register("height")} placeholder="เช่น 4" className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">รายละเอียดเพิ่มเติม / จำนวนที่ต้องการ</label>
                      <textarea {...register("details")} rows={4} placeholder="ระบุจำนวนดวง จำนวนแผ่น หรือรูปทรงที่ต้องการ (เช่น ไดคัทตามทรงโลโก้)..." className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-y bg-[#0d1220] border border-white/10 focus:border-[#FF7A00]/50" />
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium tracking-wide">แนบไฟล์โลโก้ (ถ้ามี)</label>
                      <label className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed cursor-pointer transition-colors duration-200 border-[#FF7A00]/30 hover:border-[#FF7A00]/60">
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-gray-400 text-sm">คลิกเพื่ออัปโหลดไฟล์ หรือลากวางที่นี่</span>
                        <span className="text-xs mt-1 text-gray-500">รองรับ AI, PDF, PSD, JPG, PNG (สูงสุด 50MB)</span>
                        <input type="file" className="hidden" accept=".ai,.pdf,.psd,.jpg,.jpeg,.png" />
                      </label>
                    </div>

                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold text-white text-base transition-all duration-200 disabled:opacity-70 bg-[#C2410C] hover:bg-[#9A3412] shadow-lg shadow-[#FF7A00]/20 mt-4">
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังประมวลผล...</>
                      ) : (
                        <><Send size={18} /> ส่งข้อมูลประเมินราคา</>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">🔒 ข้อมูลและไฟล์งานของคุณจะถูกเก็บรักษาเป็นความลับอย่างปลอดภัย</p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <SharedServiceSections serviceKey="label" />
      <GlobalFooter />
    </div>
  );
}
