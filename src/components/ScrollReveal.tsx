"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSectionSelectors = [
  ".home-section-title",
  ".home-quote-copy",
  ".home-compact-form",
  ".home-hero-copy > h1",
  ".home-hero-copy > p",
  ".home-hero-actions",
  ".brand-interior .section-label",
  ".brand-interior .section-title",
  ".brand-interior section > div > h1",
  ".brand-interior section > div > h2",
];

const revealItemSelectors = [
  ".home-trust-grid > div",
  ".home-workflow-item",
  ".home-portfolio-grid article",
  ".home-service-card",
  ".brand-card",
  ".brand-interior article",
  ".brand-interior .card",
];

const cardSelectors = [
  ".home-service-card",
  ".home-portfolio-grid article",
  ".brand-card",
  ".brand-interior article",
  ".brand-interior .card",
];

const buttonSelectors = [
  ".home-btn",
  ".btn-primary",
  ".btn-secondary",
  ".brand-button",
  ".home-form-submit",
];

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    let observer: IntersectionObserver | null = null;
    let frame = 0;

    function addClass(selectors: string[], className: string) {
      document.querySelectorAll<HTMLElement>(selectors.join(",")).forEach((element) => {
        element.classList.add(className);
      });
    }

    function decorate() {
      if (!document.querySelector(".home-premium, .brand-interior, .brand-service-detail")) return;
      addClass(revealSectionSelectors, "reveal-section");
      addClass(revealItemSelectors, "reveal-item");
      addClass(cardSelectors, "fx-card");
      addClass(buttonSelectors, "fx-button");

      document.querySelectorAll<HTMLElement>("a, button").forEach((element) => {
        if (element.className.includes("bg-[#FF") || element.className.includes("bg-[#ff")) {
          element.classList.add("fx-button");
        }
      });
    }

    function reveal() {
      const elements = document.querySelectorAll<HTMLElement>(".reveal-section, .reveal-item");

      if (reduceMotion || !("IntersectionObserver" in window)) {
        elements.forEach((element) => {
          element.classList.remove("fx-entering");
          element.classList.add("is-visible");
        });
        return;
      }

      elements.forEach((element) => {
        element.classList.remove("fx-entering", "is-visible");
      });
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            element.classList.add("fx-entering");
            window.requestAnimationFrame(() => {
              element.classList.add("is-visible");
            });
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
      );
      elements.forEach((element) => observer?.observe(element));
    }

    function updateParallax() {
      frame = 0;
      if (reduceMotion) return;

      document.querySelectorAll<HTMLElement>(".home-hero, .brand-service-detail #hero").forEach((hero) => {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const offset = Math.max(-18, Math.min(18, (progress - 0.5) * 36));
        hero.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      });
    }

    function requestParallax() {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    }

    function attachHeroPointer() {
      if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return () => {};
      const cleanups: Array<() => void> = [];

      document.querySelectorAll<HTMLElement>(".home-hero, .brand-service-detail #hero").forEach((hero) => {
        const move = (event: PointerEvent) => {
          const rect = hero.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
          const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
          hero.style.setProperty("--pointer-x", `${x.toFixed(2)}px`);
          hero.style.setProperty("--pointer-y", `${y.toFixed(2)}px`);
        };
        const leave = () => {
          hero.style.setProperty("--pointer-x", "0px");
          hero.style.setProperty("--pointer-y", "0px");
        };
        hero.addEventListener("pointermove", move, { passive: true });
        hero.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
        });
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    }

    root.classList.toggle("motion-reduced", reduceMotion);
    const timer = window.setTimeout(() => {
      decorate();
      reveal();
      updateParallax();
    }, 60);
    const detachPointer = attachHeroPointer();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax, { passive: true });

    return () => {
      window.clearTimeout(timer);
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      detachPointer();
      window.removeEventListener("scroll", requestParallax);
      window.removeEventListener("resize", requestParallax);
    };
  }, [pathname]);

  return null;
}
