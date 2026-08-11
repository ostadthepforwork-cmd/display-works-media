import { ArrowRight, CheckCircle2, MessageCircle, Phone, Sparkles } from "lucide-react";
import Image from "next/image";

const defaultTrustPoints = [
  "à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¹à¸¥à¸°à¸•à¸£à¸§à¸ˆà¹„à¸Ÿà¸¥à¹Œà¸à¹ˆà¸­à¸™à¸œà¸¥à¸´à¸•",
  "à¸”à¸¹à¹à¸¥à¸•à¸±à¹‰à¸‡à¹à¸•à¹ˆà¹„à¸­à¹€à¸”à¸µà¸¢à¸ˆà¸™à¸–à¸¶à¸‡à¸‡à¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™",
  "à¸œà¸¥à¸´à¸•à¹à¸¥à¸°à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸‡à¸²à¸™à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢",
];

type HeroSettings = {
  headline1?: string;
  headlineHighlight?: string;
  headline2?: string;
  subtitle?: string;
  trustPoints?: string[];
  bgImage?: string;
  phone?: string;
  lineUrl?: string;
};

export default function Hero({ settings }: { settings?: HeroSettings }) {
  const hero = settings || {};
  const trustPoints = Array.isArray(hero.trustPoints) && hero.trustPoints.length > 0
    ? hero.trustPoints.filter(Boolean)
    : defaultTrustPoints;
  const bgImage = hero.bgImage || "/images/hero-bg-home.jpg";
  const phone = hero.phone || "065-916-1539";
  const tel = phone.replace(/[^\d+]/g, "");
  const lineUrl = hero.lineUrl || "https://lin.ee/O0nPl03";

  return (
    <section
      id="hero"
      className="relative flex min-h-[700px] items-center overflow-hidden sm:min-h-[720px] lg:min-h-[820px]"
      style={{ background: "#070A0F" }}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt="Display Works Media"
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover object-[62%_center] sm:object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(7,10,15,0.98) 0%, rgba(7,10,15,0.94) 40%, rgba(7,10,15,0.62) 74%, rgba(7,10,15,0.42) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-[#070A0F]/35" />
      </div>

      <div className="absolute inset-y-0 right-[9%] z-[1] hidden w-px bg-gradient-to-b from-transparent via-[#FF6500]/70 to-transparent lg:block" />
      <div className="absolute right-[6%] top-[25%] z-[1] hidden h-[360px] w-[360px] rotate-45 border-b border-r border-[#FF6500]/35 lg:block" />

      <div
        className="relative z-10 w-full max-w-[1380px] mx-auto px-5 sm:px-6 lg:px-8"
        style={{ paddingTop: "118px", paddingBottom: "72px" }}
      >
        <div className="max-w-[760px]">
          <div className="hero-badge inline-flex items-center gap-2 mb-6 sm:mb-8">
            <div className="section-label mb-0 gap-2">
              <Sparkles size={13} /> YOUR IDEA. MADE VISIBLE.
            </div>
          </div>

          <h1
            className="hero-h1 font-kanit font-extrabold leading-[1.05] mb-5 sm:mb-6 text-white"
            style={{ fontSize: "clamp(40px, 6.4vw, 82px)" }}
          >
            {hero.headline1 || "à¸£à¸±à¸šà¸—à¸³à¸›à¹‰à¸²à¸¢à¹à¸¥à¸°"}
            <br />
            <span style={{ color: "#FF6500" }}>{hero.headlineHighlight || "à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²"}</span>
            {hero.headline2 ? (
              <>
                <br />
                {hero.headline2}
              </>
            ) : null}
          </h1>

          <p
            className="hero-sub leading-relaxed mb-6 sm:mb-8"
            style={{
              fontSize: "clamp(13px, 2.5vw, 17px)",
              maxWidth: "480px",
              color: "#A8B0C0",
            }}
          >
            {hero.subtitle ||
              "à¹ƒà¸«à¹‰à¸˜à¸¸à¸£à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸„à¸¸à¸“à¸¡à¸­à¸‡à¹€à¸«à¹‡à¸™à¸Šà¸±à¸”à¸‚à¸¶à¹‰à¸™ à¸”à¹‰à¸§à¸¢à¸šà¸£à¸´à¸à¸²à¸£à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸² à¸­à¸­à¸à¹à¸šà¸š à¸œà¸¥à¸´à¸• à¹à¸¥à¸°à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆ"}
          </p>

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

          <div className="hero-cta flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5">
            <a
              href="#quote"
              className="btn-primary group w-full sm:w-auto"
              style={{
                fontSize: "15px",
              }}
            >
              à¸›à¸£à¸¶à¸à¸©à¸²à¸‡à¸²à¸™à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¸Ÿà¸£à¸µ
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#portfolio"
              className="btn-secondary w-full sm:w-auto"
              style={{
                borderColor: "rgba(255,255,255,0.2)",
                fontSize: "15px",
              }}
            >
              à¸”à¸¹à¸œà¸¥à¸‡à¸²à¸™à¸‚à¸­à¸‡à¹€à¸£à¸²
            </a>
          </div>

          <div
            className="hero-contact inline-flex flex-wrap items-center gap-2 border-l-2 border-[#FF6500] px-3 py-2.5"
            style={{
              color: "#A8B0C0",
              fontSize: "13px",
              background: "rgba(7,10,15,0.76)",
            }}
          >
            <a
              href={`tel:${tel}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:text-white transition-colors"
            >
              <Phone size={14} style={{ color: "#FF6500" }} /> {phone}
            </a>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:text-white transition-colors"
            >
              <MessageCircle size={14} style={{ color: "#06C755" }} /> à¸›à¸£à¸¶à¸à¸©à¸²à¸Ÿà¸£à¸µà¸œà¹ˆà¸²à¸™ LINE
            </a>
          </div>
        </div>
      </div>

      <div className="hero-scroll absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 opacity-40 xl:flex">
        <div className="text-xs tracking-widest uppercase" style={{ color: "#A8B0C0" }}>
          scroll
        </div>
        <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1">
          <div className="hero-scroll-dot w-1 h-2 rounded-full" style={{ background: "#C2410C" }} />
        </div>
      </div>
    </section>
  );
}
