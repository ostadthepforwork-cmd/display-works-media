import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Globe2, Mail, MessageCircle, Phone } from "lucide-react";
import { Facebook } from "@/components/BrandIcons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SharedWorkflow } from "@/components/SharedMarketingSections";
import { CmsText } from "@/components/CmsSettingsProvider";
import SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸² | Display Works Media",
  description:
    "à¸•à¸´à¸”à¸•à¹ˆà¸­ Display Works Media à¹€à¸žà¸·à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢ à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸² à¸›à¸£à¸¶à¸à¸©à¸²à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™à¸Ÿà¸£à¸µ à¸žà¸£à¹‰à¸­à¸¡à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢",
  alternates: { canonical: "https://displayworksmedia.com/contact" },
  openGraph: {
    title: "à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸² | Display Works Media",
    description:
      "à¸ªà¸­à¸šà¸–à¸²à¸¡à¸£à¸²à¸„à¸² à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¸‡à¸²à¸™ à¸«à¸£à¸·à¸­à¸‚à¸­à¸„à¸³à¹à¸™à¸°à¸™à¸³à¸ˆà¸²à¸à¸—à¸µà¸¡à¸‡à¸²à¸™ Display Works Media à¹„à¸”à¹‰à¸Ÿà¸£à¸µ",
    url: "https://displayworksmedia.com/contact",
  },
};

const channels = [
  {
    icon: MessageCircle,
    channel: "LINE Official",
    value: "@displayworksmedia",
    href: "https://lin.ee/O0nPl03",
    desc: "à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸—à¸µà¹ˆà¹à¸™à¸°à¸™à¸³à¸ªà¸³à¸«à¸£à¸±à¸šà¸ªà¸­à¸šà¸–à¸²à¸¡à¸£à¸²à¸„à¸² à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¸‡à¸²à¸™ à¹à¸¥à¸°à¸£à¸±à¸šà¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¸ˆà¸²à¸à¸—à¸µà¸¡à¸‡à¸²à¸™",
    color: "#047857",
    cta: "à¹à¸Šà¸—à¸œà¹ˆà¸²à¸™ LINE",
  },
  {
    icon: Facebook,
    channel: "Facebook",
    value: "Display Works Media",
    href: "https://www.facebook.com/profile.php?id=61581015452518",
    desc: "à¸”à¸¹à¸œà¸¥à¸‡à¸²à¸™à¸¥à¹ˆà¸²à¸ªà¸¸à¸” à¸ªà¸­à¸šà¸–à¸²à¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ à¹à¸¥à¸°à¸žà¸¹à¸”à¸„à¸¸à¸¢à¸à¸±à¸šà¸—à¸µà¸¡à¸‡à¸²à¸™à¸œà¹ˆà¸²à¸™ Messenger",
    color: "#1877F2",
    cta: "à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡",
  },
  {
    icon: Phone,
    channel: "à¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ",
    value: "065-916-1539",
    href: "tel:0659161539",
    desc: "à¸ªà¸­à¸šà¸–à¸²à¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹à¸¥à¸°à¸•à¸´à¸”à¸•à¸²à¸¡à¸ªà¸–à¸²à¸™à¸°à¸‡à¸²à¸™à¹„à¸”à¹‰à¹ƒà¸™à¹€à¸§à¸¥à¸²à¸—à¸³à¸à¸²à¸£",
    color: "#FF7A00",
    cta: "à¹‚à¸—à¸£à¸«à¸²à¹€à¸£à¸²",
  },
];

const info = [
  { icon: Globe2, label: "à¸Šà¸·à¹ˆà¸­à¸˜à¸¸à¸£à¸à¸´à¸ˆ", value: "Display Works Media" },
  { icon: CheckCircle2, label: "à¸›à¸£à¸°à¹€à¸ à¸—à¸˜à¸¸à¸£à¸à¸´à¸ˆ", value: "à¸šà¸£à¸´à¸à¸²à¸£à¸žà¸´à¸¡à¸žà¹Œà¸›à¹‰à¸²à¸¢à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œà¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£" },
  { icon: Globe2, label: "à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸šà¸£à¸´à¸à¸²à¸£", value: "à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢ à¸žà¸£à¹‰à¸­à¸¡à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸¸à¸à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸”" },
  { icon: Globe2, label: "à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¹ƒà¸«à¹‰à¸šà¸£à¸´à¸à¸²à¸£", value: "à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œ 100% à¸žà¸£à¹‰à¸­à¸¡à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸‡à¸²à¸™à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢" },
  { icon: Clock, label: "à¹€à¸§à¸¥à¸²à¸—à¸³à¸à¸²à¸£", value: "à¸ˆà¸±à¸™à¸—à¸£à¹Œ-à¹€à¸ªà¸²à¸£à¹Œ 9:00-18:00 à¸™." },
  { icon: Mail, label: "à¸­à¸µà¹€à¸¡à¸¥", value: "info.displayworksmedia@gmail.com" },
];

const faqs = [
  {
    q: "à¸•à¸´à¸”à¸•à¹ˆà¸­à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¹„à¸«à¸™à¹„à¸”à¹‰à¹€à¸£à¹‡à¸§à¸—à¸µà¹ˆà¸ªà¸¸à¸”?",
    a: "LINE Official à¸•à¸­à¸šà¸à¸¥à¸±à¸šà¸£à¸§à¸”à¹€à¸£à¹‡à¸§à¸—à¸µà¹ˆà¸ªà¸¸à¸” à¹‚à¸”à¸¢à¸›à¸à¸•à¸´à¸ à¸²à¸¢à¹ƒà¸™à¹€à¸§à¸¥à¸²à¸—à¸³à¸à¸²à¸£",
  },
  {
    q: "à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¸‡à¸²à¸™à¸œà¹ˆà¸²à¸™à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¹„à¸«à¸™à¹„à¸”à¹‰à¸šà¹‰à¸²à¸‡?",
    a: "à¸ªà¸²à¸¡à¸²à¸£à¸–à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¸œà¹ˆà¸²à¸™ LINE Official à¸«à¸£à¸·à¸­ Facebook Messenger à¹„à¸”à¹‰ à¸£à¸­à¸‡à¸£à¸±à¸šà¹„à¸Ÿà¸¥à¹Œ AI, PDF, PSD à¹à¸¥à¸°à¹„à¸Ÿà¸¥à¹Œà¸ à¸²à¸žà¸—à¸±à¹ˆà¸§à¹„à¸›",
  },
  {
    q: "à¸¡à¸µà¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¹ƒà¸«à¹‰à¹€à¸‚à¹‰à¸²à¸Šà¸¡à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?",
    a: "à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™à¹€à¸£à¸²à¹ƒà¸«à¹‰à¸šà¸£à¸´à¸à¸²à¸£à¸œà¹ˆà¸²à¸™à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œà¹€à¸›à¹‡à¸™à¸«à¸¥à¸±à¸ à¸¥à¸¹à¸à¸„à¹‰à¸²à¸ªà¸²à¸¡à¸²à¸£à¸–à¸ªà¸­à¸šà¸–à¸²à¸¡ à¸‚à¸­à¸£à¸²à¸„à¸² à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œ à¹à¸¥à¸°à¸ªà¸±à¹ˆà¸‡à¸œà¸¥à¸´à¸•à¹„à¸”à¹‰à¸ªà¸°à¸”à¸§à¸ à¸žà¸£à¹‰à¸­à¸¡à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸‡à¸²à¸™à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨",
  },
  {
    q: "à¹ƒà¸Šà¹‰à¹€à¸§à¸¥à¸²à¸œà¸¥à¸´à¸•à¸à¸µà¹ˆà¸§à¸±à¸™?",
    a: "à¸£à¸°à¸¢à¸°à¹€à¸§à¸¥à¸²à¸œà¸¥à¸´à¸•à¸‚à¸¶à¹‰à¸™à¸­à¸¢à¸¹à¹ˆà¸à¸±à¸šà¸›à¸£à¸°à¹€à¸ à¸—à¸‡à¸²à¸™à¹à¸¥à¸°à¸ˆà¸³à¸™à¸§à¸™ à¹‚à¸”à¸¢à¸ªà¹ˆà¸§à¸™à¹ƒà¸«à¸à¹ˆà¹ƒà¸Šà¹‰à¹€à¸§à¸¥à¸²à¸›à¸£à¸°à¸¡à¸²à¸“ 1-3 à¸§à¸±à¸™à¸—à¸³à¸à¸²à¸£ à¸«à¸¥à¸±à¸‡à¸¢à¸·à¸™à¸¢à¸±à¸™à¹à¸šà¸šà¹à¸¥à¸°à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢",
  },
  {
    q: "à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹à¸šà¸š à¸ªà¸²à¸¡à¸²à¸£à¸–à¸ªà¸±à¹ˆà¸‡à¸œà¸¥à¸´à¸•à¹„à¸”à¹‰à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?",
    a: "à¹„à¸”à¹‰ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸ªà¸²à¸¡à¸²à¸£à¸–à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¸‚à¸™à¸²à¸” à¸§à¸±à¸ªà¸”à¸¸ à¹à¸¥à¸°à¸£à¸¹à¸›à¹à¸šà¸šà¸‡à¸²à¸™à¸—à¸µà¹ˆà¹€à¸«à¸¡à¸²à¸°à¸ªà¸¡ à¸žà¸£à¹‰à¸­à¸¡à¸Šà¹ˆà¸§à¸¢à¹€à¸•à¸£à¸µà¸¢à¸¡à¹„à¸Ÿà¸¥à¹Œà¸ªà¸³à¸«à¸£à¸±à¸šà¸à¸²à¸£à¸œà¸¥à¸´à¸•",
  },
  {
    q: "à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸•à¹ˆà¸²à¸‡à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸”à¹„à¸”à¹‰à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?",
    a: "à¹„à¸”à¹‰ à¹€à¸£à¸²à¹ƒà¸«à¹‰à¸šà¸£à¸´à¸à¸²à¸£à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢ à¸žà¸£à¹‰à¸­à¸¡à¹à¸ˆà¹‰à¸‡à¹€à¸¥à¸‚à¸žà¸±à¸ªà¸”à¸¸à¸ªà¸³à¸«à¸£à¸±à¸šà¸•à¸´à¸”à¸•à¸²à¸¡à¸ªà¸–à¸²à¸™à¸°à¸à¸²à¸£à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡",
  },
];

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": "https://displayworksmedia.com/contact#webpage",
    url: "https://displayworksmedia.com/contact",
    name: "à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸² | Display Works Media",
    description:
      "à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡à¹à¸¥à¸°à¸›à¸£à¸¶à¸à¸©à¸²à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢ à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸à¸±à¸š Display Works Media à¹„à¸”à¹‰à¸Ÿà¸£à¸µ",
    isPartOf: { "@id": "https://displayworksmedia.com/#website" },
    about: { "@id": "https://displayworksmedia.com/#business" },
  };

  return (
    <>
      <SchemaOrg extra={contactSchema} />
      <main className="brand-interior min-h-screen bg-[#050806] text-white font-['Prompt',sans-serif]">
        <Navbar />

        <section className="relative overflow-hidden px-5 pt-28 pb-16 lg:pt-32 lg:pb-20">
          <div
            className="absolute inset-x-0 top-0 h-[380px] pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,122,0,0.08), transparent)" }}
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <CmsText path="contact.eyebrow" fallback="à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸²" as="div" className="section-label" />
            <CmsText
              path="contact.title"
              fallback="à¸à¸³à¸¥à¸±à¸‡à¸¡à¸­à¸‡à¸«à¸²à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢à¸«à¸£à¸·à¸­à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²?"
              as="h1"
              className="contact-hero-title font-['Kanit'] text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
            />
            <CmsText
              path="contact.subtitle"
              fallback="à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡à¹à¸¥à¸°à¸›à¸£à¸¶à¸à¸©à¸²à¹„à¸”à¹‰à¸Ÿà¸£à¸µ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢"
              as="p"
              className="contact-hero-copy mx-auto mt-6 max-w-2xl text-base leading-8 text-[#A7B0C0] sm:text-lg"
            />
            <p className="contact-hero-copy mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#A7B0C0]">
              à¹„à¸¡à¹ˆà¸§à¹ˆà¸²à¸ˆà¸°à¸¡à¸µà¹à¸šà¸šà¸žà¸£à¹‰à¸­à¸¡à¸œà¸¥à¸´à¸• à¸«à¸£à¸·à¸­à¸¡à¸µà¹€à¸žà¸µà¸¢à¸‡à¹„à¸­à¹€à¸”à¸µà¸¢ à¹€à¸£à¸²à¸¢à¸´à¸™à¸”à¸µà¸Šà¹ˆà¸§à¸¢à¹à¸™à¸°à¸™à¸³à¹à¸™à¸§à¸—à¸²à¸‡à¸—à¸µà¹ˆà¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸„à¸¸à¸“
            </p>
          </div>
        </section>

        <section id="channels" className="px-5 pb-16">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {channels.map(({ icon: Icon, channel, value, href, desc, color, cta }) => (
              <Link
                key={channel}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="contact-channel-card min-w-0 rounded-2xl border border-white/10 bg-[#0E1310] p-6 transition hover:-translate-y-1 hover:border-[#FF7A00]/40"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}>
                  <Icon size={24} />
                </div>
                <div className="text-xs text-[#A7B0C0]">{channel}</div>
                <h2 className="mt-1 font-['Kanit'] text-xl font-bold text-white">{value}</h2>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#A7B0C0]">{desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold" style={{ color }}>
                  {cta} <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16">
          <div className="mx-auto max-w-5xl">
            <div className="section-label">à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸˜à¸¸à¸£à¸à¸´à¸ˆ</div>
            <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0E1310] md:grid-cols-2">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4 border-b border-white/5 p-5 last:border-b-0 md:border-r md:last:border-r-0">
                  <Icon size={18} className="mt-1 flex-shrink-0 text-[#FF7A00]" />
                  <div>
                    <div className="text-xs text-[#A7B0C0]">{label}</div>
                    <div className="mt-1 text-sm font-semibold leading-6 text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SharedWorkflow />

        <section className="px-5 pb-16">
          <div className="mx-auto max-w-5xl">
            <div className="section-label">à¸„à¸³à¸–à¸²à¸¡à¸—à¸µà¹ˆà¸žà¸šà¸šà¹ˆà¸­à¸¢</div>
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-white/10 bg-[#0E1310] p-6">
                  <h2 className="font-['Kanit'] text-lg font-bold text-white">{q}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#A7B0C0]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div
            className="mx-auto max-w-5xl rounded-2xl border border-[#FF7A00]/25 p-8 text-center sm:p-10"
            style={{ background: "linear-gradient(135deg, #0E1310 0%, #1a0f05 100%)" }}
          >
            <h2 className="font-['Kanit'] text-3xl font-extrabold text-white sm:text-4xl">à¸›à¸£à¸¶à¸à¸©à¸²à¸‡à¸²à¸™à¸à¸±à¸šà¹€à¸£à¸²à¹„à¸”à¹‰à¸Ÿà¸£à¸µ</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#A7B0C0]">
              à¸ªà¸­à¸šà¸–à¸²à¸¡à¸£à¸²à¸„à¸² à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¸‡à¸²à¸™ à¸«à¸£à¸·à¸­à¸‚à¸­à¸„à¸³à¹à¸™à¸°à¸™à¸³à¸ˆà¸²à¸à¸—à¸µà¸¡à¸‡à¸²à¸™à¹„à¸”à¹‰à¹€à¸¥à¸¢
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#047857] px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
              >
                <MessageCircle size={18} /> LINE Official
              </Link>
              <Link
                href="#channels"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
              >
                à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸² <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
