"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Facebook, Phone, FileText } from "lucide-react";

const floatButtons = [
  {
    icon: MessageCircle,
    href: "https://lin.ee/O0nPl03",
    label: "LINE",
    bg: "#06C755",
    shadow: "rgba(6,199,85,0.35)",
  },
  {
    icon: Facebook,
    href: "https://m.me/791228040740465",
    label: "Facebook",
    bg: "#1877F2",
    shadow: "rgba(24,119,242,0.35)",
  },
  {
    icon: Phone,
    href: "tel:0659161539",
    label: "โทร",
    bg: "#FF6B00",
    shadow: "rgba(255,107,0,0.4)",
  },
];

export default function FloatingButtons() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const hiddenOnThisPage = pathname?.startsWith("/admin") || pathname?.startsWith("/login") || pathname?.startsWith("/doc");

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hiddenOnThisPage) return null;

  return (
    <>
      {/* ── Desktop: floating buttons (right side) ── */}
      <div
        className="fixed right-5 bottom-8 z-50 hidden lg:flex flex-col gap-3 transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {floatButtons.map(({ icon: Icon, href, label, bg, shadow }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("tel") ? "_self" : "_blank"}
            rel="noopener noreferrer"
            aria-label={label}
            className="group relative w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            style={{
              background: bg,
              boxShadow: `0 4px 20px ${shadow}`,
            }}
          >
            <Icon size={20} />
            {/* Tooltip */}
            <span
              className="absolute right-14 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ background: "rgba(0,0,0,0.85)" }}
            >
              {label}
            </span>
          </a>
        ))}
      </div>

      {/* ── Mobile: sticky bar at bottom ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-500"
        style={{
          opacity: 1,
          transform: "translateY(0)",
          pointerEvents: "auto",
        }}
      >
        <div
          className="grid grid-cols-3"
          style={{
            background: "rgba(11,15,25,0.97)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Quote */}
          <a
            href="/#quote"
            className="order-3 flex flex-col items-center justify-center gap-1 py-4 text-white transition-colors hover:bg-white/5"
          >
            <FileText size={20} style={{ color: "#FF6500" }} />
            <span className="text-xs font-medium">ขอราคา</span>
          </a>

          {/* LINE — primary mobile action */}
          <a
            href="https://lin.ee/O0nPl03"
            target="_blank"
            rel="noopener noreferrer"
            className="order-1 flex flex-col items-center justify-center gap-1 py-4 text-white font-bold text-sm transition-all duration-200 active:scale-95"
            style={{
            background: "#06C755",
            boxShadow: "0 0 30px rgba(6,199,85,0.28)",
            }}
          >
            <MessageCircle size={20} />
            <span className="text-xs font-semibold">LINE</span>
          </a>

          {/* โทร */}
          <a
            href="tel:0659161539"
            className="order-2 flex flex-col items-center justify-center gap-1 py-4 transition-colors hover:bg-white/5"
          >
            <Phone size={20} style={{ color: "#FF6500" }} />
            <span className="text-xs text-white font-medium">โทรเลย</span>
          </a>
        </div>

        {/* Safe area spacer for iPhone home indicator */}
        <div
          style={{
            height: "env(safe-area-inset-bottom)",
            background: "rgba(11,15,25,0.97)",
          }}
        />
      </div>

      {/* Push content up on mobile so sticky bar doesn't overlap footer */}
      <div className="h-[72px] lg:hidden" aria-hidden="true" />
    </>
  );
}
