"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Facebook, Phone } from "lucide-react";

export default function FloatingButtons() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const buttons = [
    {
      icon: MessageCircle,
      href: "https://lin.ee/O0nPl03",
      label: "LINE",
      bg: "#06C755",
    },
    {
      icon: Facebook,
      href: "https://m.me/791228040740465",
      label: "Facebook",
      bg: "#1877F2",
    },
    {
      icon: Phone,
      href: "tel:0659161539",
      label: "โทร",
      bg: "#FF6B00",
    },
  ];

  return (
    <div
      className="fixed right-5 bottom-6 z-50 flex flex-col gap-3 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {buttons.map(({ icon: Icon, href, label, bg }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith("tel") ? "_self" : "_blank"}
          rel="noopener noreferrer"
          aria-label={label}
          className="group relative w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-110"
          style={{
            background: bg,
            boxShadow: `0 4px 20px ${bg}40`,
          }}
        >
          <Icon size={22} />
          {/* Tooltip */}
          <span
            className="absolute right-14 whitespace-nowrap px-2 py-1 rounded text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            style={{ background: "rgba(0,0,0,0.8)" }}
          >
            {label}
          </span>
        </a>
      ))}
    </div>
  );
}
