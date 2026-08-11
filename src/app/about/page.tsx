import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Images, PackageCheck, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CmsText } from "@/components/CmsSettingsProvider";
import SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¹€à¸£à¸² | Display Works Media",
  description:
    "Display Works Media à¸œà¸¹à¹‰à¸Šà¹ˆà¸§à¸¢à¸”à¹‰à¸²à¸™à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¸›à¹‰à¸²à¸¢à¹‚à¸†à¸©à¸“à¸² à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¹ˆà¸‡à¹€à¸ªà¸£à¸´à¸¡à¸à¸²à¸£à¸‚à¸²à¸¢à¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£ à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸² à¸•à¸£à¸§à¸ˆà¹„à¸Ÿà¸¥à¹Œ à¹à¸™à¸°à¸™à¸³à¸§à¸±à¸ªà¸”à¸¸ à¸›à¸£à¸°à¸ªà¸²à¸™à¸à¸²à¸£à¸œà¸¥à¸´à¸• à¹à¸¥à¸°à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢",
  alternates: { canonical: "https://displayworksmedia.com/about" },
  openGraph: {
    title: "à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¹€à¸£à¸² | Display Works Media",
    description:
      "Marketing Production Partner à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢ à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸‚à¸­à¸‡à¸˜à¸¸à¸£à¸à¸´à¸ˆ",
    url: "https://displayworksmedia.com/about",
  },
};

const trustHighlights = [
  "à¸›à¸£à¸¶à¸à¸©à¸²à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¸Ÿà¸£à¸µ",
  "à¸›à¸£à¸°à¸ªà¸²à¸™à¸‡à¸²à¸™à¸£à¸§à¸”à¹€à¸£à¹‡à¸§ à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨",
  "à¸”à¸¹à¹à¸¥à¸•à¸±à¹‰à¸‡à¹à¸•à¹ˆà¹„à¸­à¹€à¸”à¸µà¸¢à¸ˆà¸™à¸–à¸¶à¸‡à¸‡à¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™",
];

const proofCards = [
  {
    icon: Images,
    title: "à¸‡à¸²à¸™à¸«à¸¥à¸²à¸à¸«à¸¥à¸²à¸¢à¸›à¸£à¸°à¹€à¸ à¸—",
    desc: "à¸Šà¹ˆà¸§à¸¢à¸”à¸¹à¹à¸¥à¸—à¸±à¹‰à¸‡à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥ à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸² PP Board Roll Up Backdrop à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ",
  },
  {
    icon: PackageCheck,
    title: "à¸•à¸£à¸§à¸ˆà¸„à¸§à¸²à¸¡à¸žà¸£à¹‰à¸­à¸¡à¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡à¸œà¸¥à¸´à¸•",
    desc: "à¸Šà¹ˆà¸§à¸¢à¹€à¸Šà¹‡à¸à¹„à¸Ÿà¸¥à¹Œ à¸‚à¸™à¸²à¸” à¸§à¸±à¸ªà¸”à¸¸ à¹à¸¥à¸°à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸ªà¸³à¸„à¸±à¸ à¹€à¸žà¸·à¹ˆà¸­à¸¥à¸”à¸„à¸§à¸²à¸¡à¹€à¸ªà¸µà¹ˆà¸¢à¸‡à¸‡à¸²à¸™à¸œà¸´à¸”à¸‚à¸™à¸²à¸” à¸œà¸´à¸”à¸§à¸±à¸ªà¸”à¸¸ à¸«à¸£à¸·à¸­à¹„à¸Ÿà¸¥à¹Œà¹„à¸¡à¹ˆà¸žà¸£à¹‰à¸­à¸¡",
  },
  {
    icon: Truck,
    title: "à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œ 100%",
    desc: "à¸ªà¸­à¸šà¸–à¸²à¸¡ à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œ à¸¢à¸·à¸™à¸¢à¸±à¸™à¹à¸šà¸š à¹à¸¥à¸°à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸‡à¸²à¸™à¸–à¸¶à¸‡à¸¥à¸¹à¸à¸„à¹‰à¸²à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢à¹„à¸”à¹‰à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸”à¸´à¸™à¸—à¸²à¸‡",
  },
];

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": "https://displayworksmedia.com/about#webpage",
    url: "https://displayworksmedia.com/about",
    name: "à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¹€à¸£à¸² | Display Works Media",
    description:
      "Display Works Media à¸„à¸·à¸­ Marketing Production Partner à¸”à¹‰à¸²à¸™à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¸›à¹‰à¸²à¸¢à¹‚à¸†à¸©à¸“à¸² à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¹ˆà¸‡à¹€à¸ªà¸£à¸´à¸¡à¸à¸²à¸£à¸‚à¸²à¸¢ à¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆ à¸£à¹‰à¸²à¸™à¸„à¹‰à¸² SME à¹à¸¥à¸°à¸­à¸‡à¸„à¹Œà¸à¸£",
    isPartOf: { "@id": "https://displayworksmedia.com/#website" },
    about: { "@id": "https://displayworksmedia.com/#business" },
  };

  return (
    <>
      <SchemaOrg extra={aboutSchema} />
      <main className="brand-interior min-h-screen bg-[#050806] text-white font-['Prompt',sans-serif]">
        <Navbar />

        <section className="relative overflow-hidden px-5 pt-28 pb-20 lg:pt-32 lg:pb-24">
          <div
            className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,122,0,0.08), transparent)" }}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <CmsText path="about.eyebrow" fallback="à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¹€à¸£à¸²" as="div" className="section-label" />
              <CmsText
                path="about.title"
                fallback="à¸œà¸¹à¹‰à¸Šà¹ˆà¸§à¸¢à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¹„à¸­à¹€à¸”à¸µà¸¢à¸˜à¸¸à¸£à¸à¸´à¸ˆà¹ƒà¸«à¹‰à¹€à¸›à¹‡à¸™à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸—à¸µà¹ˆà¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸ˆà¸£à¸´à¸‡"
                as="h1"
                className="font-['Kanit'] text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
              />
              <CmsText
                path="about.subtitle"
                fallback="à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸² à¸•à¸£à¸§à¸ˆà¹„à¸Ÿà¸¥à¹Œ à¹à¸™à¸°à¸™à¸³à¸§à¸±à¸ªà¸”à¸¸ à¸›à¸£à¸°à¸ªà¸²à¸™à¸à¸²à¸£à¸œà¸¥à¸´à¸• à¹à¸¥à¸°à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸² à¹€à¸žà¸·à¹ˆà¸­à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸˜à¸¸à¸£à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸„à¸¸à¸“à¹‚à¸”à¸”à¹€à¸”à¹ˆà¸™à¹à¸¥à¸°à¸™à¹ˆà¸²à¸ˆà¸”à¸ˆà¸³à¸¡à¸²à¸à¸¢à¸´à¹ˆà¸‡à¸‚à¸¶à¹‰à¸™"
                as="p"
                className="mt-6 max-w-2xl text-base leading-8 text-[#A7B0C0] sm:text-lg"
              />

              <div className="mt-8 space-y-4 text-sm leading-7 text-[#A7B0C0] sm:text-base">
                <p>
                  Display Works Media à¸„à¸·à¸­à¸œà¸¹à¹‰à¸Šà¹ˆà¸§à¸¢à¸”à¹‰à¸²à¸™à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¸›à¹‰à¸²à¸¢à¹‚à¸†à¸©à¸“à¸² à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¹ˆà¸‡à¹€à¸ªà¸£à¸´à¸¡à¸à¸²à¸£à¸‚à¸²à¸¢à¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£ à¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆ à¸£à¹‰à¸²à¸™à¸„à¹‰à¸² SME à¹à¸¥à¸°à¸­à¸‡à¸„à¹Œà¸à¸£à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸ªà¸·à¹ˆà¸­à¸„à¸¸à¸“à¸ à¸²à¸ž à¸žà¸£à¹‰à¸­à¸¡à¸šà¸£à¸´à¸à¸²à¸£à¸—à¸µà¹ˆà¸ªà¸°à¸”à¸§à¸ à¸£à¸§à¸”à¹€à¸£à¹‡à¸§ à¹à¸¥à¸°à¸”à¸¹à¹à¸¥à¹‚à¸”à¸¢à¸—à¸µà¸¡à¸‡à¸²à¸™à¸¡à¸·à¸­à¸­à¸²à¸Šà¸µà¸ž
                </p>
                <p>
                  à¹€à¸£à¸²à¹€à¸Šà¸·à¹ˆà¸­à¸§à¹ˆà¸²à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸—à¸µà¹ˆà¸”à¸µà¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¹€à¸žà¸µà¸¢à¸‡à¹à¸„à¹ˆà¸ªà¸§à¸¢à¸‡à¸²à¸¡ à¹à¸•à¹ˆà¸•à¹‰à¸­à¸‡à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸˜à¸¸à¸£à¸à¸´à¸ˆà¸ªà¸·à¹ˆà¸­à¸ªà¸²à¸£à¹„à¸”à¹‰à¸Šà¸±à¸”à¹€à¸ˆà¸™ à¸ªà¸£à¹‰à¸²à¸‡à¸„à¸§à¸²à¸¡à¸™à¹ˆà¸²à¹€à¸Šà¸·à¹ˆà¸­à¸–à¸·à¸­ à¹à¸¥à¸°à¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡à¸¥à¸¹à¸à¸„à¹‰à¸²à¹„à¸”à¹‰à¸­à¸¢à¹ˆà¸²à¸‡à¸¡à¸µà¸›à¸£à¸°à¸ªà¸´à¸—à¸˜à¸´à¸ à¸²à¸ž
                </p>
                <p>
                  à¸•à¸±à¹‰à¸‡à¹à¸•à¹ˆà¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥ à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸² PP Board Roll Up à¹„à¸›à¸ˆà¸™à¸–à¸¶à¸‡ Backdrop à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ à¹€à¸£à¸²à¸žà¸£à¹‰à¸­à¸¡à¸Šà¹ˆà¸§à¸¢à¸”à¸¹à¹à¸¥à¸•à¸±à¹‰à¸‡à¹à¸•à¹ˆà¸à¸²à¸£à¸£à¸±à¸šà¸šà¸£à¸µà¸Ÿ à¸à¸²à¸£à¹€à¸•à¸£à¸µà¸¢à¸¡à¹„à¸Ÿà¸¥à¹Œ à¸à¸²à¸£à¹à¸™à¸°à¸™à¸³à¸§à¸±à¸ªà¸”à¸¸ à¸à¸²à¸£à¸›à¸£à¸°à¸ªà¸²à¸™à¸à¸²à¸£à¸œà¸¥à¸´à¸• à¹„à¸›à¸ˆà¸™à¸–à¸¶à¸‡à¸à¸²à¸£à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {trustHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white">
                    <CheckCircle2 size={17} className="mt-0.5 flex-shrink-0 text-[#FF7A00]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸² <ArrowRight size={18} />
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/5"
                >
                  à¸”à¸¹à¸œà¸¥à¸‡à¸²à¸™
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  "/images/portfolio/work-01.webp",
                  "/images/portfolio/sticker-1.jpg",
                  "/images/portfolio/ppboard-1.png",
                  "/images/portfolio/backdrop-1.png",
                ].map((src, index) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1310] ${index === 1 ? "mt-8" : ""} ${index === 2 ? "-mt-8" : ""}`}
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <Image src={src} alt="à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡à¸œà¸¥à¸‡à¸²à¸™ Display Works Media" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              {proofCards.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-[#0E1310] p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C2410C]/10 text-[#FF7A00]">
                    <Icon size={24} />
                  </div>
                  <h2 className="font-['Kanit'] text-xl font-bold text-white">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#A7B0C0]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
