"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const defaultServices = [
  {
    image: "/images/services/vinyl.jpg",
    name: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥",
    desc: "à¸žà¸´à¸¡à¸žà¹Œà¹„à¸§à¸™à¸´à¸¥à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡ à¸ªà¸µà¸ªà¸”à¹ƒà¸ª à¸—à¸™à¹à¸”à¸” à¸—à¸™à¸à¸™ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸›à¹‰à¸²à¸¢à¸£à¹‰à¸²à¸™ à¸›à¹‰à¸²à¸¢à¹‚à¸†à¸©à¸“à¸² à¸£à¸­à¸‡à¸£à¸±à¸šà¸—à¸¸à¸à¸‚à¸™à¸²à¸”à¸•à¸²à¸¡à¸•à¹‰à¸­à¸‡à¸à¸²à¸£",
    href: "/services/vinyl-banner",
  },
  {
    image: "/images/services/sticker.jpg",
    name: "Sticker Indoor / Outdoor",
    desc: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸„à¸¸à¸“à¸ à¸²à¸žà¸”à¸µ à¸•à¸´à¸”à¹„à¸”à¹‰à¸—à¸¸à¸à¸žà¸·à¹‰à¸™à¸œà¸´à¸§ à¸£à¸­à¸‡à¸£à¸±à¸šà¸—à¸±à¹‰à¸‡ Indoor à¹à¸¥à¸° Outdoor à¹„à¸”à¸„à¸±à¸—à¹„à¸”à¹‰à¸•à¸²à¸¡à¸£à¸¹à¸›à¹à¸šà¸šà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£",
    href: "/services/sticker",
  },
  {
    image: "/images/services/ppboard.jpg",
    name: "PP Board/ Standee",
    desc: "à¸›à¹‰à¸²à¸¢ PP Board à¸™à¹‰à¸³à¸«à¸™à¸±à¸à¹€à¸šà¸² à¸›à¸£à¸°à¸à¸­à¸šà¸‡à¹ˆà¸²à¸¢ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™ Event à¸›à¹‰à¸²à¸¢à¸Šà¸±à¹ˆà¸§à¸„à¸£à¸²à¸§ à¹à¸¥à¸°à¸«à¹‰à¸­à¸‡à¸™à¸´à¸—à¸£à¸£à¸¨à¸à¸²à¸£",
    href: "/services/pp-board",
  },
  {
    image: "/images/services/rollup-xstand.jpg",
    name: "Roll Up / X-stand",
    desc: "à¸žà¸à¸žà¸²à¸ªà¸°à¸”à¸§à¸ à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¸‡à¹ˆà¸²à¸¢ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™ Booth à¸ªà¸±à¸¡à¸¡à¸™à¸² à¹à¸¥à¸° Presentation à¸£à¸°à¸”à¸±à¸šà¸¡à¸·à¸­à¸­à¸²à¸Šà¸µà¸ž",
    href: "/services/roll-up",
  },
  {
    image: "/images/services/product-label-hero.jpg",
    name: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²",
    desc: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸² à¸ªà¸µà¸ªà¸§à¸¢à¸ªà¸”à¸Šà¸±à¸” à¸•à¸´à¸”à¸—à¸™à¸—à¸²à¸™ à¸à¸±à¸™à¸™à¹‰à¸³ 100% à¹€à¸™à¸·à¹‰à¸­à¸§à¸±à¸ªà¸”à¸¸à¹€à¸«à¸™à¸µà¸¢à¸§à¸žà¸´à¹€à¸¨à¸© à¹„à¸¡à¹ˆà¸‰à¸µà¸à¸‚à¸²à¸”à¸‡à¹ˆà¸²à¸¢",
    href: "/services/label-sticker",
  },
  {
    image: "/images/services/backdrop.jpg",
    name: "Backdrop",
    desc: "Backdrop à¸‚à¸™à¸²à¸”à¹ƒà¸«à¸à¹ˆà¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¹à¸–à¸¥à¸‡à¸‚à¹ˆà¸²à¸§à¹à¸¥à¸° Event à¸ªà¸³à¸„à¸±à¸ à¸žà¸£à¹‰à¸­à¸¡ Standee à¸œà¸¥à¸´à¸•à¹€à¸ªà¸£à¹‡à¸ˆà¸ªà¹ˆà¸‡à¸•à¸£à¸‡à¸–à¸¶à¸‡à¸¡à¸·à¸­",
    href: "/services/backdrop",
  },
];

const imageByHref: Record<string, string> = {
  "/services/vinyl-banner": "/images/services/vinyl.jpg",
  "/services/sticker": "/images/services/sticker.jpg",
  "/services/label-sticker": "/images/services/product-label-hero.jpg",
  "/services/pp-board": "/images/services/ppboard.jpg",
  "/services/standee": "/images/services/ppboard.jpg",
  "/services/roll-up": "/images/services/rollup-xstand.jpg",
  "/services/x-stand": "/images/services/rollup-xstand.jpg",
  "/services/backdrop": "/images/services/backdrop.jpg",
};

type ServiceItem = {
  id?: string;
  image?: string;
  img?: string;
  name?: string;
  desc?: string;
  url?: string;
  href?: string;
};

function normalizeServices(items?: ServiceItem[]) {
  if (!Array.isArray(items) || items.length === 0) return defaultServices;

  return items
    .filter((item) => item?.name)
    .map((item) => {
      const href = item.href || item.url || "";
      return {
        image: item.image || item.img || imageByHref[href] || "/images/services/vinyl.jpg",
        name: item.name || "",
        desc: item.desc || "",
        href,
      };
    });
}

export default function Services({ items }: { items?: ServiceItem[] }) {
  const services = normalizeServices(items);

  return (
    <section id="services" className="brand-section py-20 sm:py-28 px-5 sm:px-6 lg:px-8 bg-[#070A0F]">
      <div className="max-w-[1380px] mx-auto">
        <div className="reveal-section">
          <div className="section-label">OUR SERVICES</div>
          <h2 className="section-title">à¸šà¸£à¸´à¸à¸²à¸£à¸‚à¸­à¸‡à¹€à¸£à¸²</h2>
          <p className="section-sub">
            à¸•à¸­à¸šà¹‚à¸ˆà¸—à¸¢à¹Œà¸—à¸¸à¸à¸„à¸§à¸²à¸¡à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸”à¹‰à¸²à¸™à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¸›à¹‰à¸²à¸¢à¹‚à¸†à¸©à¸“à¸² à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¹ˆà¸‡à¹€à¸ªà¸£à¸´à¸¡à¸à¸²à¸£à¸‚à¸²à¸¢à¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆ
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const cardContent = (
              <>
                <div className="relative w-full aspect-[8/5] overflow-hidden bg-bg-card2">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, transparent 40%, #141A24 100%)" }}
                  />
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-sm text-white text-xs font-semibold backdrop-blur-sm"
                    style={{ background: "rgba(255,101,0,0.9)" }}
                  >
                    {service.name}
                  </div>
                </div>
                <div className="p-6 lg:p-7 relative">
                  <div
                    className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "#C2410C" }}
                  />
                  <h3 className="font-kanit font-bold text-lg text-white mb-2">{service.name}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#A8B0C0" }}>
                    {service.desc}
                  </p>
                  {service.href && (
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
                      style={{ color: "#FF6500" }}
                    >
                      à¸”à¸¹à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              </>
            );

            const sharedClass =
              "group relative rounded-lg overflow-hidden cursor-pointer border transition-all duration-300 hover:-translate-y-1";
            const sharedStyle = { background: "#10151D", borderColor: "rgba(255,255,255,0.09)" as string };
            const hoverHandlers = {
              onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,101,0,0.42)";
              },
              onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              },
            };

            return service.href ? (
              <Link key={`${service.name}-${service.href}`} href={service.href} className={sharedClass} style={sharedStyle} {...hoverHandlers}>
                {cardContent}
              </Link>
            ) : (
              <div key={service.name} className={sharedClass} style={sharedStyle} {...hoverHandlers}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
