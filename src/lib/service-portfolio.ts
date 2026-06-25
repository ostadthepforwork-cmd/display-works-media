export type ServicePortfolioItem = {
  title: string;
  image: string;
  meta?: string;
  desc?: string;
  category?: string;
  alt?: string;
  href?: string;
  img?: string;
};

export const servicePortfolioMeta: Record<string, { category: string; href: string }> = {
  vinyl: { category: "ป้ายไวนิล", href: "/services/vinyl-banner" },
  sticker: { category: "สติ๊กเกอร์", href: "/services/sticker" },
  ppboard: { category: "PP Board", href: "/services/pp-board" },
  rollup: { category: "Roll Up / X-Stand", href: "/services/roll-up" },
  label: { category: "ฉลากสินค้า", href: "/services/label-sticker" },
  backdrop: { category: "Backdrop", href: "/services/backdrop" },
};

export const serviceFallbackPortfolioItems: Record<string, ServicePortfolioItem[]> = {
  vinyl: [
    { title: "ป้ายไวนิลหน้าร้าน", image: "/images/portfolio/1.png", meta: "ช่วยให้ร้านและโปรโมชันอ่านชัดจากระยะหน้าร้าน" },
    { title: "ป้ายโปรโมชั่น", image: "/images/portfolio/2.png", meta: "ใช้สื่อสารราคา เมนู หรือแคมเปญให้คนเห็นทันที" },
    { title: "ป้ายประชาสัมพันธ์", image: "/images/portfolio/3.png", meta: "ประสานขนาดและวัสดุให้เหมาะกับพื้นที่ติดตั้ง" },
    { title: "ป้ายกิจกรรม", image: "/images/portfolio/4.png", meta: "เหมาะกับงานชั่วคราว งานอีเวนต์ และพื้นที่กลางแจ้ง" },
  ],
  sticker: [
    { title: "สติ๊กเกอร์ติดกระจก", image: "/images/portfolio/sticker-1.jpg", meta: "เหมาะกับหน้าร้าน กระจกออฟฟิศ และพื้นที่ Indoor / Outdoor" },
    { title: "สติ๊กเกอร์ประชาสัมพันธ์", image: "/images/portfolio/sticker-2.jpg", meta: "ช่วยทำให้ข้อความแคมเปญดูชัดและติดตั้งเป็นระเบียบ" },
    { title: "สติ๊กเกอร์สำหรับธุรกิจ", image: "/images/portfolio/sticker-3.jpg", meta: "แนะนำวัสดุตามพื้นผิว การใช้งาน และงบประมาณ" },
    { title: "สติ๊กเกอร์ไดคัท", image: "/images/portfolio/sticker-4.jpg", meta: "ตัดตามรูปทรงโลโก้ ฉลาก หรือชิ้นงานเฉพาะแบรนด์" },
  ],
  ppboard: [
    { title: "PP Board โปรโมชั่น", image: "/images/portfolio/ppboard-1.png", meta: "น้ำหนักเบา เหมาะกับโปรโมชันหน้าร้านที่ต้องย้ายตำแหน่งได้" },
    { title: "Standee หน้าร้าน", image: "/images/portfolio/ppboard-2.png", meta: "ช่วยให้สินค้า เมนู หรือบริการเด่นขึ้นในพื้นที่ขาย" },
    { title: "ป้ายตั้งพื้น", image: "/images/portfolio/ppboard-3.png", meta: "ประเมินขนาดตามตำแหน่งวางและระยะมองเห็น" },
    { title: "สื่อประชาสัมพันธ์", image: "/images/portfolio/ppboard-4.png", meta: "เหมาะกับกิจกรรม งานเปิดตัว และสื่อแนะนำสินค้า" },
  ],
  rollup: [
    { title: "Roll Up สำหรับหน้าร้าน", image: "/images/portfolio/rollup-1.png", meta: "ติดตั้งง่าย เหมาะกับพื้นที่จำกัดและใช้งานซ้ำได้" },
    { title: "Roll Up สำหรับโปรโมชั่น", image: "/images/portfolio/rollup-2.png", meta: "ช่วยให้บูธ งานแสดงสินค้า และกิจกรรมดูพร้อมขึ้น" },
    { title: "Roll Up งานออกบูธ", image: "/images/portfolio/rollup-3.png", meta: "พกพาง่าย ใช้ซ้ำได้ และช่วยให้แบรนด์ดูพร้อมในพื้นที่จัดงาน" },
    { title: "X-Stand สำหรับแคมเปญ", image: "/images/portfolio/rollup-4.png", meta: "ตัวเลือกประหยัดสำหรับงานโปรโมชั่นและสื่อหน้าร้าน" },
  ],
  label: [
    { title: "ฉลากสินค้าสำหรับบรรจุภัณฑ์", image: "/images/portfolio/sticker-1.png", meta: "ช่วยให้แพ็กเกจดูน่าเชื่อถือและสื่อสารแบรนด์ชัดขึ้น" },
    { title: "ฉลากสินค้ากันน้ำ", image: "/images/portfolio/sticker-2.png", meta: "เหมาะกับอาหาร เครื่องดื่ม และสินค้าที่ต้องเจอความชื้น" },
    { title: "ฉลากวงกลม", image: "/images/portfolio/sticker-3.png", meta: "ประเมินขนาดและจำนวนให้เหมาะกับรูปทรงสินค้า" },
    { title: "ฉลากไดคัท", image: "/images/portfolio/sticker-4.png", meta: "ตัดตามโลโก้หรือรูปทรงเฉพาะเพื่อเพิ่มมูลค่าสินค้า" },
  ],
  backdrop: [
    { title: "Backdrop งานอีเวนต์", image: "/images/portfolio/backdrop-1.png", meta: "สร้างฉากหลังที่ช่วยให้พื้นที่จัดงานดูเป็นแบรนด์เดียวกัน" },
    { title: "Backdrop เปิดตัวสินค้า", image: "/images/portfolio/backdrop-2.png", meta: "ช่วยให้จุดถ่ายภาพและเวทีสื่อสารสินค้าเด่นขึ้น" },
    { title: "Backdrop ถ่ายภาพ", image: "/images/portfolio/backdrop-3.png", meta: "แนะนำขนาดตามมุมกล้อง พื้นที่ และรูปแบบงาน" },
  ],
};

export function getServicePortfolioEntries(settings: any = {}) {
  const serviceDetails = settings?.page_content?.servicesDetail || {};
  return Object.keys(servicePortfolioMeta).flatMap((serviceKey) => {
    const cmsItems = Array.isArray(serviceDetails?.[serviceKey]?.portfolioItems)
      ? serviceDetails[serviceKey].portfolioItems
      : [];
    const fallbackItems = serviceFallbackPortfolioItems[serviceKey] || [];
    const meta = servicePortfolioMeta[serviceKey];

    return [...cmsItems, ...fallbackItems]
      .filter((item) => (item?.image || item?.img) && item?.title)
      .map((item) => ({
        ...item,
        category: item.category || meta.category,
        href: item.href || meta.href,
        serviceKey,
      }));
  });
}
