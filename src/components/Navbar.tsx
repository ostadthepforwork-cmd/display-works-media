"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MessageCircle, Facebook } from "lucide-react";

const navLinks = [
  { label: "หน้าแรก", href: "/" },
  { label: "บริการของเรา", href: "/#services" },
  { label: "ผลงานของเรา", href: "/#portfolio" },
  { label: "ขั้นตอนการทำงาน", href: "/#process" },
  { label: "บทความ", href: "/blog" },
  { label: "เกี่ยวกับเรา", href: "/#about" },
  { label: "ติดต่อเรา", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/95 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
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
            <div className="font-kanit font-bold text-sm tracking-wider leading-none text-white">
              DISPLAY WORKS
            </div>
            <div className="font-kanit font-bold text-sm tracking-wider leading-none" style={{ color: "#FF6B00" }}>
              MEDIA
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted hover:text-white text-sm font-normal transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-white/10 pr-4">
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-green-400 transition-colors"
              aria-label="LINE"
            >
              <MessageCircle size={18} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61581015452518"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-blue-400 transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          </div>
          <Link
            href="/#quote"
            className="text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: "#FF6B00", boxShadow: "0 4px 20px rgba(255,107,0,0.2)" }}
          >
            ขอใบเสนอราคา
          </Link>
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
      {mobileOpen && (
        <div className="lg:hidden bg-bg-card border-t border-white/[0.08] px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted hover:text-white text-base py-2 border-b border-white/[0.05] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#quote"
            className="mt-2 text-white text-center py-3 rounded-lg font-semibold text-sm"
            style={{ backgroundColor: "#FF6B00" }}
            onClick={() => setMobileOpen(false)}
          >
            ขอใบเสนอราคา
          </Link>
        </div>
      )}
    </nav>
  );
}
