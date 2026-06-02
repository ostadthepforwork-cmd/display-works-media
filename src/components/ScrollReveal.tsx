"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollReveal — re-observe ทุกครั้งที่ Next.js navigate
 *
 * ปัญหาเดิม: script ธรรมดาใน layout.tsx run ครั้งเดียวตอน page load
 * เมื่อ navigate กลับมาด้วย client-side routing, script ไม่ run ซ้ำ
 * ทำให้ .reveal-section/.reveal-item ค้างที่ opacity:0 ตลอด
 *
 * วิธีแก้: usePathname() trigger useEffect ทุกครั้งที่ path เปลี่ยน
 * และ reset class is-visible ก่อน observe ใหม่
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // disconnect observer เก่าถ้ามี
    let io: IntersectionObserver | null = null;

    function observe() {
      const elements = document.querySelectorAll<HTMLElement>(
        ".reveal-section, .reveal-item"
      );

      // reset ก่อน — ลบ is-visible ออกเพื่อให้ animate ใหม่
      elements.forEach((el) => el.classList.remove("is-visible"));

      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      elements.forEach((el) => io!.observe(el));
    }

    // รอ DOM render เสร็จก่อน (สำคัญสำหรับ dynamic components)
    const timer = setTimeout(observe, 50);

    return () => {
      clearTimeout(timer);
      io?.disconnect();
    };
  }, [pathname]); // re-run ทุกครั้งที่ path เปลี่ยน

  return null; // ไม่ render อะไร
}
