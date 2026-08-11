"use client";



import {
  BadgeCheck,
  Zap,
  Truck,
  MessageSquare,
  Layers,
  Gift,
} from "lucide-react";

const reasons = [
  {
    icon: BadgeCheck,
    num: "01",
    title: "à¸›à¸£à¸°à¸ªà¸šà¸à¸²à¸£à¸“à¹Œà¸ˆà¸£à¸´à¸‡ à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¹à¸„à¹ˆà¸„à¸³à¸žà¸¹à¸”",
    desc: "à¸—à¸µà¸¡à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸œà¹ˆà¸²à¸™à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œà¸«à¸¥à¸²à¸¢à¸£à¹‰à¸­à¸¢à¹‚à¸›à¸£à¹€à¸ˆà¸à¸•à¹Œ à¸£à¸¹à¹‰à¸ˆà¸±à¸à¸›à¸±à¸à¸«à¸² à¸£à¸¹à¹‰à¸§à¸´à¸˜à¸µà¹à¸à¹‰à¹„à¸‚ à¹à¸¥à¸°à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¸à¹ˆà¸­à¸™à¸œà¸¥à¸´à¸•à¸ˆà¸£à¸´à¸‡à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡",
    highlight: "500+ à¹‚à¸›à¸£à¹€à¸ˆà¸à¸•à¹Œà¸—à¸µà¹ˆà¸œà¹ˆà¸²à¸™à¸¡à¸²",
  },
  {
    icon: Zap,
    num: "02",
    title: "à¸•à¸­à¸šà¹„à¸§à¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
    desc: "à¹€à¸£à¸²à¹€à¸‚à¹‰à¸²à¹ƒà¸ˆà¸§à¹ˆà¸²à¸˜à¸¸à¸£à¸à¸´à¸ˆà¹„à¸¡à¹ˆà¸£à¸­ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¸•à¸­à¸šà¸„à¸³à¸–à¸²à¸¡ à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸² à¹à¸¥à¸°à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
    highlight: "à¸•à¸­à¸šà¸—à¸¸à¸à¸§à¸±à¸™ à¹„à¸¡à¹ˆà¸¡à¸µà¸§à¸±à¸™à¸«à¸¢à¸¸à¸”",
  },
  {
    icon: Truck,
    num: "03",
    title: "à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨ à¸¡à¸µà¸£à¸°à¸šà¸šà¸•à¸´à¸”à¸•à¸²à¸¡",
    desc: "à¸ªà¹ˆà¸‡à¸–à¸¶à¸‡à¸¡à¸·à¸­à¸„à¸¸à¸“à¸—à¸¸à¸à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸”à¹ƒà¸™à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢ à¸¡à¸µà¸šà¸£à¸´à¸à¸²à¸£à¹à¸ˆà¹‰à¸‡à¹€à¸¥à¸‚à¸žà¸±à¸ªà¸”à¸¸ à¸•à¸´à¸”à¸•à¸²à¸¡à¸ªà¸´à¸™à¸„à¹‰à¸²à¹„à¸”à¹‰à¸•à¸¥à¸­à¸”à¹€à¸§à¸¥à¸²",
    highlight: "77 à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸” à¸ªà¹ˆà¸‡à¹„à¸”à¹‰à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”",
  },
  {
    icon: Layers,
    num: "04",
    title: "à¸„à¸¸à¸“à¸ à¸²à¸žà¸£à¸°à¸”à¸±à¸šà¸¡à¸·à¸­à¸­à¸²à¸Šà¸µà¸ž",
    desc: "à¸žà¸²à¸£à¹Œà¸—à¹€à¸™à¸­à¸£à¹Œà¸à¸²à¸£à¸œà¸¥à¸´à¸•à¸—à¸µà¹ˆà¹€à¸£à¸²à¸„à¸±à¸”à¸ªà¸£à¸£à¸¡à¸²à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡ à¸¡à¸²à¸•à¸£à¸à¸²à¸™à¸ªà¸¡à¹ˆà¸³à¹€à¸ªà¸¡à¸­à¸—à¸¸à¸à¸Šà¸´à¹‰à¸™à¸‡à¸²à¸™ à¸—à¸¸à¸à¸­à¸­à¹€à¸”à¸­à¸£à¹Œ",
    highlight: "à¸§à¸±à¸ªà¸”à¸¸à¹€à¸à¸£à¸” A à¸—à¸¸à¸à¸Šà¸´à¹‰à¸™",
  },
  {
    icon: MessageSquare,
    num: "05",
    title: "à¸ªà¸±à¹ˆà¸‡à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œ à¸‡à¹ˆà¸²à¸¢à¸—à¸¸à¸à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™",
    desc: "à¸£à¸°à¸šà¸šà¸à¸²à¸£à¸ªà¸±à¹ˆà¸‡à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸­à¸­à¸à¹à¸šà¸šà¸¡à¸²à¹ƒà¸«à¹‰à¸‡à¹ˆà¸²à¸¢à¸—à¸µà¹ˆà¸ªà¸¸à¸” à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸™à¸±à¸”à¸«à¸¡à¸²à¸¢ à¸—à¸³à¹„à¸”à¹‰à¸—à¸¸à¸à¸—à¸µà¹ˆà¸—à¸¸à¸à¹€à¸§à¸¥à¸²",
    highlight: "à¸œà¹ˆà¸²à¸™ LINE à¹„à¸”à¹‰à¹€à¸¥à¸¢",
  },
  {
    icon: Gift,
    num: "06",
    title: "à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¸Ÿà¸£à¸µà¸à¹ˆà¸­à¸™à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆ",
    desc: "à¹„à¸¡à¹ˆà¹à¸™à¹ˆà¹ƒà¸ˆà¸§à¹ˆà¸²à¹€à¸¥à¸·à¸­à¸à¸§à¸±à¸ªà¸”à¸¸à¹à¸šà¸šà¹„à¸«à¸™ à¸‚à¸™à¸²à¸”à¹€à¸—à¹ˆà¸²à¹„à¸«à¸£à¹ˆà¸”à¸µ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸¢à¸´à¸™à¸”à¸µà¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¸Ÿà¸£à¸µà¸à¹ˆà¸­à¸™à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡",
    highlight: "à¸Ÿà¸£à¸µ à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢",
  },
];

export default function WhyUs() {
  return (
    <section id="about" className="brand-section py-20 lg:py-28 px-5 sm:px-6 lg:px-8" style={{ background: "#10151D" }}>
      <div className="max-w-[1380px] mx-auto">

        <div className="reveal-section flex flex-col lg:flex-row lg:items-end gap-6 mb-16">
          <div className="flex-1">
            <div className="section-label">WHY DISPLAY WORKS</div>
            <h2 className="section-title">à¸—à¸³à¹„à¸¡à¸•à¹‰à¸­à¸‡à¹€à¸£à¸²</h2>
          </div>
          <p className="section-sub lg:max-w-xs lg:text-right">
            à¸¡à¸²à¸à¸à¸§à¹ˆà¸² 120 à¸˜à¸¸à¸£à¸à¸´à¸ˆà¹„à¸§à¹‰à¸§à¸²à¸‡à¹ƒà¸ˆà¹ƒà¸«à¹‰à¹€à¸£à¸²à¸”à¸¹à¹à¸¥à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¸”à¹‰à¸§à¸¢à¹€à¸«à¸•à¸¸à¸œà¸¥à¹€à¸«à¸¥à¹ˆà¸²à¸™à¸µà¹‰
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.num}
                className="reveal-item group relative p-7 lg:p-8 rounded-lg border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{ background: "#070A0F", borderColor: "rgba(255,255,255,0.08)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "#0f1520";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.background = "#070A0F";
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at top left, rgba(255,107,0,0.06) 0%, transparent 60%)" }}
                />
                <div
                  className="absolute top-4 right-6 font-kanit font-extrabold leading-none select-none pointer-events-none"
                  style={{ fontSize: "64px", color: "rgba(255,107,0,0.06)" }}
                >
                  {r.num}
                </div>
                <div
                  className="relative w-14 h-14 rounded-md flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105"
                  style={{ background: "rgba(255,107,0,0.1)" }}
                >
                  <Icon size={26} style={{ color: "#FF6B00" }} strokeWidth={1.5} />
                </div>
                <div className="relative">
                  <h3 className="font-kanit font-bold text-white text-lg mb-3 leading-snug">{r.title}</h3>
                  <p className="text-sm leading-7 mb-5" style={{ color: "#A8B0C0" }}>{r.desc}</p>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(255,107,0,0.08)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.15)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C2410C" }} />
                    {r.highlight}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
