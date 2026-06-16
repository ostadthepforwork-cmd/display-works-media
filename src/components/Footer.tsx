"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Mail, MessageCircle, Phone } from "lucide-react";
import { cmsValue, useCmsSettings } from "@/components/CmsSettingsProvider";

const serviceLinks = [
  { label: "ป้ายไวนิล", href: "/services/vinyl-banner" },
  { label: "สติ๊กเกอร์", href: "/services/sticker" },
  { label: "PP Board / Standee", href: "/services/pp-board" },
  { label: "Roll Up / X-Stand", href: "/services/roll-up" },
  { label: "Backdrop", href: "/services/backdrop" },
];

const companyLinks = [
  { label: "เกี่ยวกับเรา", href: "/about" },
  { label: "ผลงานของเรา", href: "/#portfolio" },
  { label: "บทความ", href: "/blog" },
  { label: "คำถามที่พบบ่อย", href: "/faq" },
  { label: "ติดต่อเรา", href: "/contact" },
  { label: "นโยบายความเป็นส่วนตัว", href: "/privacy-policy" },
  { label: "ข้อกำหนดการใช้งาน", href: "/terms" },
];

export default function Footer() {
  const cms = useCmsSettings();
  const contact = cms.contact || {};
  const phone = contact.phone || "065-916-1539";
  const email = contact.email || "info.displayworksmedia@gmail.com";
  const line = contact.line || contact.lineUrl || "https://lin.ee/O0nPl03";
  const facebook = contact.facebook || "https://www.facebook.com/profile.php?id=61581015452518";

  return (
    <footer className="site-footer">
      <div className="site-footer-cta">
        <div>
          <span>{cmsValue(cms, "footer.eyebrow", "FREE CONSULTATION")}</span>
          <h2>{cmsValue(cms, "footer.title", "พร้อมให้คำปรึกษาและผลิตสื่อโฆษณาสำหรับธุรกิจของคุณ")}</h2>
          <p>{cmsValue(cms, "footer.subtitle", "สอบถามงานและประเมินราคาเบื้องต้นฟรี")}</p>
        </div>
        <div className="site-footer-cta-actions">
          <a href={line} target="_blank" rel="noopener noreferrer" className="brand-button brand-button-line">
            <MessageCircle size={16} /> LINE
          </a>
          <Link href="/#quote" className="brand-button brand-button-primary">ขอใบเสนอราคา</Link>
        </div>
      </div>

      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link href="/" className="site-brand-lockup">
            <Image src="/images/logo.png" alt="Display Works Media" width={48} height={40} />
            <span><b>DISPLAY WORKS</b><em>MEDIA</em></span>
          </Link>
          <p>ผู้ให้บริการงานป้าย งานพิมพ์ และสื่อโฆษณาครบวงจร สำหรับธุรกิจ ร้านค้า SME และองค์กร</p>
          <div className="site-footer-socials">
            <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook /></a>
            <a href={line} target="_blank" rel="noopener noreferrer" aria-label="LINE"><MessageCircle /></a>
          </div>
        </div>

        <div className="site-footer-column">
          <b>บริการของเรา</b>
          {serviceLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </div>

        <div className="site-footer-column">
          <b>ข้อมูลบริษัท</b>
          {companyLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </div>

        <div className="site-footer-column site-footer-contact">
          <b>ติดต่อเรา</b>
          <a href={`tel:${phone.replace(/\D/g, "")}`}><Phone /> {phone}</a>
          <a href={line} target="_blank" rel="noopener noreferrer"><MessageCircle /> LINE @displayworks</a>
          <a href={`mailto:${email}`}><Mail /> {email}</a>
          <p>{contact.address || "ให้บริการออนไลน์และจัดส่งทั่วประเทศไทย"}</p>
        </div>
      </div>

      <div className="site-footer-bottom">© 2026 Display Works Media. All Rights Reserved.</div>
    </footer>
  );
}
