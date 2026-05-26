"use client";
import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// HELPERS
// ============================================================
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "-";

function loadLocal(key, def) {
  try { const v = localStorage.getItem("cms_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveLocal(key, val) {
  try { localStorage.setItem("cms_" + key, JSON.stringify(val)); } catch {}
}

// ============================================================
// MAIN CMS
// ============================================================
export default function CMSPage() {
  const [tab, setTab] = useState("blog");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: "blog", icon: "📝", label: "บทความ" },
    { id: "hero", icon: "🖼️", label: "Hero Section" },
    { id: "services", icon: "🛠️", label: "บริการ" },
    { id: "reviews", icon: "⭐", label: "รีวิว" },
    { id: "portfolio", icon: "🖼", label: "ผลงาน" },
    { id: "contact", icon: "📞", label: "ข้อมูลติดต่อ" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", fontFamily: "'Prompt','Sarabun',sans-serif", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0d1120", borderRight: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6B00" }}>CMS</div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>จัดการเนื้อหาเว็บไซต์</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: tab === t.id ? "rgba(255,107,0,0.15)" : "transparent",
              color: tab === t.id ? "#FF6B00" : "#A8B0C0", fontFamily: "inherit",
              borderLeft: tab === t.id ? "2px solid #FF6B00" : "2px solid transparent",
              width: "100%", textAlign: "left",
            }}>
              <span style={{ width: 20, textAlign: "center" }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <a href="/admin/erp" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, fontSize: 13, color: "#555", textDecoration: "none" }}>
            ← กลับ ERP
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#141A24", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "#A8B0C0" }}>{tabs.find(t => t.id === tab)?.label}</span>
          <a href="https://displayworksmedia.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#FF6B00", textDecoration: "none" }}>
            เปิดเว็บไซต์ ↗
          </a>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {tab === "blog" && <BlogManager showToast={showToast} />}
          {tab === "hero" && <HeroManager showToast={showToast} />}
          {tab === "services" && <ServicesManager showToast={showToast} />}
          {tab === "reviews" && <ReviewsManager showToast={showToast} />}
          {tab === "portfolio" && <PortfolioManager showToast={showToast} />}
          {tab === "contact" && <ContactManager showToast={showToast} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "error" ? "#7f1d1d" : "#064e3b",
          border: `1px solid ${toast.type === "error" ? "#ef4444" : "#10b981"}`,
          color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10,
        }}>
          {toast.type === "error" ? "✗" : "✓"} {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #0B0F19; } ::-webkit-scrollbar-thumb { background: #FF6B00; border-radius: 3px; }
        input, select, textarea { background: #1A2233 !important; border: 1px solid rgba(255,255,255,0.12) !important; color: #fff !important; border-radius: 8px !important; padding: 8px 12px !important; font-family: 'Prompt', sans-serif !important; font-size: 13px !important; outline: none !important; width: 100%; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #FF6B00 !important; }
        input::placeholder, textarea::placeholder { color: #444 !important; }
        label { font-size: 12px; color: #A8B0C0; display: block; margin-bottom: 4px; }
      `}</style>
    </div>
  );
}

// ============================================================
// BLOG MANAGER (Supabase)
// ============================================================
function BlogManager({ showToast }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // โหลดบทความจาก Supabase
  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPosts(data || []);
    setLoading(false);
  };

  useState(() => { fetchPosts(); }, []);

  const save = async (p) => {
    if (p.id) {
      // อัปเดต
      const { error } = await supabase.from("posts").update({
        title: p.title, excerpt: p.excerpt, category: p.category,
        date: p.date, slug: p.slug, cover: p.cover,
        published: p.published, body: p.body,
      }).eq("id", p.id);
      if (error) { showToast("เกิดข้อผิดพลาด: " + error.message, "error"); return; }
      showToast("บันทึกบทความแล้ว");
    } else {
      // เพิ่มใหม่
      const { error } = await supabase.from("posts").insert({
        title: p.title, excerpt: p.excerpt, category: p.category,
        date: p.date, slug: p.slug, cover: p.cover,
        published: p.published, body: p.body,
      });
      if (error) { showToast("เกิดข้อผิดพลาด: " + error.message, "error"); return; }
      showToast("เพิ่มบทความใหม่แล้ว");
    }
    setEditing(null);
    fetchPosts();
  };

  const del = async (id) => {
    if (!confirm("ลบบทความนี้?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { showToast("ลบไม่สำเร็จ", "error"); return; }
    showToast("ลบบทความแล้ว");
    fetchPosts();
  };

  const filtered = posts.filter(p => p.title.includes(search) || p.category.includes(search));

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการบทความ</h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{posts.length} บทความ</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 200 }} />
          <CBtn onClick={() => setEditing({ id: "", title: "", excerpt: "", category: "", date: new Date().toISOString().slice(0,10), slug: "", cover: "", published: true, body: "" })} color="#FF6B00">+ เพิ่มบทความ</CBtn>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Cover */}
            <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#1A2233", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.cover ? <img src={p.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>📄</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: p.published ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.2)", color: p.published ? "#10b981" : "#6b7280" }}>
                  {p.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>{p.category} · {fmtDate(p.date)}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.excerpt}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <CIconBtn onClick={() => setEditing({ ...p })}>✏️</CIconBtn>
              <CIconBtn onClick={() => del(p.id)} danger>🗑️</CIconBtn>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="📝" text="ยังไม่มีบทความ" />}
      </div>

      {editing && (
        <CModal title={editing.id ? "แก้ไขบทความ" : "เพิ่มบทความใหม่"} onClose={() => setEditing(null)} width={700}>
          <BlogForm data={editing} onSave={save} onCancel={() => setEditing(null)} showToast={showToast} />
        </CModal>
      )}
    </div>
  );
}

function BlogForm({ data, onSave, onCancel, showToast }) {
  const [f, setF] = useState({ ...data });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const uploadCover = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `blog/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      setF(p => ({ ...p, cover: urlData.publicUrl }));
      showToast("อัปโหลดรูปสำเร็จ");
    } catch (err) {
      // Fallback: use object URL for local preview
      setF(p => ({ ...p, cover: URL.createObjectURL(file) }));
      showToast("ใช้รูป preview (ยังไม่ได้อัปโหลดจริง - ตรวจสอบ Supabase Storage)", "error");
    }
    setUploading(false);
  };

  const genSlug = () => {
    const slug = f.title.toLowerCase().replace(/[^a-z0-9ก-๙\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
    setF(p => ({ ...p, slug }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Cover Upload */}
      <div>
        <label>รูป Cover บทความ</label>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 160, height: 100, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {f.cover ? <img src={f.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32, opacity: 0.4 }}>🖼️</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadCover(e.target.files[0])} />
            <CBtn onClick={() => fileRef.current.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เลือกรูปภาพ"}
            </CBtn>
            <input value={f.cover} onChange={set("cover")} placeholder="หรือวาง URL รูปภาพ" style={{ fontSize: 12 }} />
          </div>
        </div>
      </div>

      <CField label="หัวข้อบทความ *"><input value={f.title} onChange={set("title")} onBlur={genSlug} placeholder="หัวข้อบทความ" /></CField>
      <CField label="Slug (URL)">
        <div style={{ display: "flex", gap: 8 }}>
          <input value={f.slug} onChange={set("slug")} placeholder="url-slug" style={{ flex: 1 }} />
          <CBtn onClick={genSlug} small color="#6B7280">สร้างอัตโนมัติ</CBtn>
        </div>
      </CField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <CField label="หมวดหมู่">
          <input value={f.category} onChange={set("category")} list="cat-list" placeholder="เช่น ป้ายไวนิล" />
          <datalist id="cat-list">{["ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า","ทั่วไป"].map(c => <option key={c} value={c} />)}</datalist>
        </CField>
        <CField label="วันที่เผยแพร่"><input type="date" value={f.date} onChange={set("date")} /></CField>
      </div>
      <CField label="บทสรุป (แสดงในหน้าแรก)"><textarea value={f.excerpt} onChange={set("excerpt")} rows={2} placeholder="อธิบายสั้นๆ ว่าบทความนี้เกี่ยวกับอะไร..." /></CField>
      <CField label="เนื้อหาบทความ"><textarea value={f.body} onChange={set("body")} rows={8} placeholder="เขียนเนื้อหาบทความที่นี่... (รองรับ Markdown)" style={{ fontFamily: "monospace" }} /></CField>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#ccc", marginBottom: 0 }}>
          <input type="checkbox" checked={f.published} onChange={e => setF(p => ({ ...p, published: e.target.checked }))} style={{ width: "auto" }} />
          เผยแพร่บทความนี้
        </label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <CBtn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>💾 บันทึก</CBtn>
        <CBtn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
      </div>
    </div>
  );
}

// ============================================================
// HERO MANAGER
// ============================================================
function HeroManager({ showToast }) {
  const [hero, setHero] = useState(() => loadLocal("hero", {
    headline1: "ผลิตสื่อโฆษณา",
    headlineHighlight: "ครบวงจร",
    headline2: "",
    subtitle: "ออกแบบ ผลิต ติดตั้ง งานป้าย ร้านค้า และสื่อโฆษณาทุกประเภท พร้อมทีมงานมืออาชีพดูแลตลอดกระบวนการ",
    trustPoints: ["ออกแบบ ผลิต ติดตั้ง ครบจบในที่เดียว", "บริการหลังการขายครบวงจร", "จัดส่งทั่วประเทศ พร้อมแจ้งเลขพัสดุ"],
    phone: "065-916-1539",
    lineUrl: "https://lin.ee/O0nPl03",
    bgImage: "/images/hero-bg.jpg",
  }));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const set = k => e => setHero(p => ({ ...p, [k]: e.target.value }));

  const uploadBg = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `hero/bg.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      setHero(p => ({ ...p, bgImage: urlData.publicUrl }));
      showToast("อัปโหลดรูปพื้นหลังสำเร็จ");
    } catch {
      showToast("ตรวจสอบ Supabase Storage bucket ชื่อ cms-media", "error");
    }
    setUploading(false);
  };

  const setTrust = (i, val) => {
    const arr = [...hero.trustPoints];
    arr[i] = val;
    setHero(p => ({ ...p, trustPoints: arr }));
  };
  const addTrust = () => setHero(p => ({ ...p, trustPoints: [...p.trustPoints, ""] }));
  const delTrust = (i) => setHero(p => ({ ...p, trustPoints: p.trustPoints.filter((_, idx) => idx !== i) }));

  const save = () => { saveLocal("hero", hero); showToast("บันทึก Hero Section แล้ว"); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>แก้ไข Hero Section</h2>
      <Card>
        <SectionTitle>รูปพื้นหลัง</SectionTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 200, height: 110, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, position: "relative" }}>
            {hero.bgImage && <img src={hero.bgImage.startsWith("/") ? hero.bgImage : hero.bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>🖼️</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadBg(e.target.files[0])} />
            <CBtn onClick={() => fileRef.current.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เปลี่ยนรูปพื้นหลัง"}
            </CBtn>
            <input value={hero.bgImage} onChange={set("bgImage")} placeholder="หรือวาง URL รูปภาพ" />
          </div>
        </div>

        <SectionTitle>ข้อความหลัก</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <CField label="บรรทัดที่ 1"><input value={hero.headline1} onChange={set("headline1")} /></CField>
          <CField label="ข้อความสีส้ม (highlight)"><input value={hero.headlineHighlight} onChange={set("headlineHighlight")} /></CField>
          <CField label="บรรทัดที่ 3 (ไม่บังคับ)"><input value={hero.headline2} onChange={set("headline2")} /></CField>
          <CField label="คำอธิบาย (subtitle)"><textarea value={hero.subtitle} onChange={set("subtitle")} rows={3} /></CField>
        </div>

        <SectionTitle>จุดเด่น (Trust Points)</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {hero.trustPoints.map((tp, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={tp} onChange={e => setTrust(i, e.target.value)} style={{ flex: 1 }} />
              <CIconBtn onClick={() => delTrust(i)} danger small>✕</CIconBtn>
            </div>
          ))}
          <CBtn onClick={addTrust} small outline>+ เพิ่มจุดเด่น</CBtn>
        </div>

        <SectionTitle>ข้อมูลติดต่อ (Hero)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <CField label="เบอร์โทร"><input value={hero.phone} onChange={set("phone")} /></CField>
          <CField label="LINE URL"><input value={hero.lineUrl} onChange={set("lineUrl")} /></CField>
        </div>

        <CBtn onClick={save} color="#FF6B00">💾 บันทึก Hero Section</CBtn>
      </Card>
    </div>
  );
}

// ============================================================
// SERVICES MANAGER
// ============================================================
function ServicesManager({ showToast }) {
  const [services, setServices] = useState(() => loadLocal("services", [
    { id: "1", name: "ป้ายไวนิล", icon: "🪟", desc: "พิมพ์งานคุณภาพสูง ทนต่อแสงและฝน เหมาะสำหรับป้ายหน้าร้าน ป้ายโฆษณา ขนาดใหญ่", price: "ตร.ม.ละ 200฿", url: "/services/vinyl" },
    { id: "2", name: "สติ๊กเกอร์", icon: "🏷️", desc: "สติ๊กเกอร์กันน้ำ indoor/outdoor พิมพ์สี 4 สี คมชัด ติดทนนาน", price: "ตร.ม.ละ 350฿", url: "/services/sticker" },
    { id: "3", name: "PP Board", icon: "📋", desc: "ป้ายพีพีบอร์ดน้ำหนักเบา พกพาง่าย เหมาะสำหรับงาน Event และป้ายชั่วคราว", price: "แผ่นละ 400฿", url: "/services/ppboard" },
    { id: "4", name: "Roll Up", icon: "🎪", desc: "ป้าย Roll Up สำหรับงานนิทรรศการ ประชุม และงานกิจกรรมต่างๆ", price: "ชิ้นละ 2,200฿", url: "/services/rollup" },
    { id: "5", name: "Backdrop", icon: "🖼", desc: "ป้าย Backdrop ขนาดใหญ่สำหรับงานอีเวนต์ ถ่ายรูป และงานแถลงข่าว", price: "ชุดละ 3,500฿", url: "/services/backdrop" },
    { id: "6", name: "ฉลากสินค้า", icon: "🏷", desc: "พิมพ์ฉลากสินค้าคุณภาพสูง ทั้งแบบม้วนและแผ่น รองรับทุกขนาด", price: "100 ชิ้นละ 400฿", url: "/services/label" },
  ]));
  const [editing, setEditing] = useState(null);

  const save = (s) => {
    const newSvc = s.id ? services.map(x => x.id === s.id ? s : x) : [...services, { ...s, id: Date.now().toString() }];
    setServices(newSvc);
    saveLocal("services", newSvc);
    showToast("บันทึกบริการแล้ว");
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบบริการนี้?")) return; const ns = services.filter(s => s.id !== id); setServices(ns); saveLocal("services", ns); showToast("ลบบริการแล้ว"); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการบริการ</h2>
        <CBtn onClick={() => setEditing({ id: "", name: "", icon: "🛠️", desc: "", price: "", url: "" })} color="#FF6B00">+ เพิ่มบริการ</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing({ ...s })}>✏️</CIconBtn>
                <CIconBtn onClick={() => del(s.id)} danger>🗑️</CIconBtn>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 8 }}>{s.desc}</div>
            <div style={{ fontSize: 12, color: "#FF6B00", fontWeight: 600 }}>เริ่มต้น {s.price}</div>
          </div>
        ))}
      </div>
      {editing && (
        <CModal title={editing.id ? "แก้ไขบริการ" : "เพิ่มบริการ"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
              <CField label="ไอคอน"><input value={editing.icon} onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))} style={{ textAlign: "center", fontSize: 24 }} /></CField>
              <CField label="ชื่อบริการ *"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
            </div>
            <CField label="คำอธิบาย"><textarea value={editing.desc} onChange={e => setEditing(p => ({ ...p, desc: e.target.value }))} rows={3} /></CField>
            <CField label="ราคาเริ่มต้น"><input value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))} placeholder="เช่น ตร.ม.ละ 200฿" /></CField>
            <CField label="URL หน้าบริการ"><input value={editing.url} onChange={e => setEditing(p => ({ ...p, url: e.target.value }))} placeholder="/services/vinyl" /></CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
            </div>
          </div>
        </CModal>
      )}
    </div>
  );
}

// ============================================================
// REVIEWS MANAGER
// ============================================================
function ReviewsManager({ showToast }) {
  const [reviews, setReviews] = useState(() => loadLocal("reviews", [
    { id: "1", name: "คุณสมชาย", company: "ร้านอาหารครัวบ้าน", stars: 5, text: "บริการดีมาก งานออกมาสวยงาม ส่งตรงเวลา ราคาเป็นธรรม" },
    { id: "2", name: "คุณนงนุช", company: "ร้านเสื้อผ้า Fashion Plus", stars: 5, text: "ทำป้ายหน้าร้านสวยมากค่ะ ลูกค้าเห็นแล้วชอบกันเยอะเลย" },
    { id: "3", name: "คุณวิชัย", company: "บริษัทออแกนิก", stars: 4, text: "งานคุณภาพดี ทีมงานให้คำปรึกษาเรื่องขนาดและวัสดุได้ดีมาก" },
  ]));
  const [editing, setEditing] = useState(null);

  const save = (r) => {
    const nr = r.id ? reviews.map(x => x.id === r.id ? r : x) : [...reviews, { ...r, id: Date.now().toString() }];
    setReviews(nr); saveLocal("reviews", nr);
    showToast(r.id ? "บันทึกรีวิวแล้ว" : "เพิ่มรีวิวแล้ว");
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบรีวิวนี้?")) return; const nr = reviews.filter(r => r.id !== id); setReviews(nr); saveLocal("reviews", nr); showToast("ลบรีวิวแล้ว"); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการรีวิว</h2>
        <CBtn onClick={() => setEditing({ id: "", name: "", company: "", stars: 5, text: "" })} color="#FF6B00">+ เพิ่มรีวิว</CBtn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reviews.map(r => (
          <div key={r.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: "#555" }}>{r.company}</span>
                <span style={{ color: "#F59E0B" }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#888" }}>{r.text}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <CIconBtn onClick={() => setEditing({ ...r })}>✏️</CIconBtn>
              <CIconBtn onClick={() => del(r.id)} danger>🗑️</CIconBtn>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <CModal title={editing.id ? "แก้ไขรีวิว" : "เพิ่มรีวิว"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <CField label="ชื่อผู้รีวิว"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
              <CField label="บริษัท/ร้านค้า"><input value={editing.company} onChange={e => setEditing(p => ({ ...p, company: e.target.value }))} /></CField>
            </div>
            <CField label="ดาว (1-5)">
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setEditing(p => ({ ...p, stars: s }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: s <= editing.stars ? "#F59E0B" : "#333" }}>★</button>
                ))}
              </div>
            </CField>
            <CField label="ข้อความรีวิว"><textarea value={editing.text} onChange={e => setEditing(p => ({ ...p, text: e.target.value }))} rows={4} /></CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
            </div>
          </div>
        </CModal>
      )}
    </div>
  );
}

// ============================================================
// PORTFOLIO MANAGER
// ============================================================
function PortfolioManager({ showToast }) {
  const [items, setItems] = useState(() => loadLocal("portfolio", []));
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const uploadImg = async (file, callback) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `portfolio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      callback(urlData.publicUrl);
      showToast("อัปโหลดรูปสำเร็จ");
    } catch {
      callback(URL.createObjectURL(file));
      showToast("ใช้ preview (ตรวจสอบ Supabase Storage)", "error");
    }
    setUploading(false);
  };

  const save = (item) => {
    const ni = item.id ? items.map(x => x.id === item.id ? item : x) : [...items, { ...item, id: Date.now().toString() }];
    setItems(ni); saveLocal("portfolio", ni);
    showToast("บันทึกผลงานแล้ว");
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบผลงานนี้?")) return; const ni = items.filter(i => i.id !== id); setItems(ni); saveLocal("portfolio", ni); showToast("ลบผลงานแล้ว"); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการผลงาน</h2>
        <CBtn onClick={() => setEditing({ id: "", title: "", category: "", img: "" })} color="#FF6B00">+ เพิ่มผลงาน</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 140, background: "#1A2233", position: "relative" }}>
              {item.img ? <img src={item.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>🖼</div>}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title || "ไม่มีชื่อ"}</div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{item.category}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing({ ...item })} small>✏️</CIconBtn>
                <CIconBtn onClick={() => del(item.id)} danger small>🗑️</CIconBtn>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState icon="🖼" text="ยังไม่มีผลงาน" />}
      </div>

      {editing && (
        <CModal title={editing.id ? "แก้ไขผลงาน" : "เพิ่มผลงาน"} onClose={() => setEditing(null)} width={460}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CField label="รูปภาพผลงาน">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", background: "#1A2233", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {editing.img ? <img src={editing.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.4 }}>🖼</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadImg(e.target.files[0], url => setEditing(p => ({ ...p, img: url })))} />
                  <CBtn onClick={() => fileRef.current.click()} color="#3B82F6" small disabled={uploading}>{uploading ? "⏳..." : "📁 เลือกรูป"}</CBtn>
                  <input value={editing.img} onChange={e => setEditing(p => ({ ...p, img: e.target.value }))} placeholder="หรือวาง URL" />
                </div>
              </div>
            </CField>
            <CField label="ชื่อผลงาน"><input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} /></CField>
            <CField label="หมวดหมู่">
              <input value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} list="cat-port" placeholder="เช่น ป้ายไวนิล" />
              <datalist id="cat-port">{["ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า"].map(c => <option key={c} value={c} />)}</datalist>
            </CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
            </div>
          </div>
        </CModal>
      )}
    </div>
  );
}

// ============================================================
// CONTACT MANAGER
// ============================================================
function ContactManager({ showToast }) {
  const [c, setC] = useState(() => loadLocal("contact", {
    phone: "065-916-1539", line: "https://lin.ee/O0nPl03", email: "info@displayworksmedia.com",
    address: "123 ถ.ตัวอย่าง กรุงเทพฯ 10110", facebook: "", instagram: "", hours: "จ-ศ 9:00-18:00 น.",
  }));
  const set = k => e => setC(p => ({ ...p, [k]: e.target.value }));
  const save = () => { saveLocal("contact", c); showToast("บันทึกข้อมูลติดต่อแล้ว"); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>ข้อมูลติดต่อ</h2>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label="📞 เบอร์โทร"><input value={c.phone} onChange={set("phone")} /></CField>
            <CField label="📧 อีเมล"><input value={c.email} onChange={set("email")} /></CField>
          </div>
          <CField label="💬 LINE URL"><input value={c.line} onChange={set("line")} /></CField>
          <CField label="📍 ที่อยู่"><textarea value={c.address} onChange={set("address")} rows={2} /></CField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label="Facebook URL"><input value={c.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." /></CField>
            <CField label="Instagram URL"><input value={c.instagram} onChange={set("instagram")} placeholder="https://instagram.com/..." /></CField>
          </div>
          <CField label="⏰ เวลาทำการ"><input value={c.hours} onChange={set("hours")} /></CField>
          <CBtn onClick={save} color="#FF6B00">💾 บันทึกข้อมูลติดต่อ</CBtn>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================
function Card({ children }) {
  return <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>{children}</div>;
}
function SectionTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "#FF6B00", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>{children}</div>;
}
function CField({ label, children }) {
  return <div><label>{label}</label>{children}</div>;
}
function CBtn({ onClick, children, color, outline, small, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? "transparent" : (color || "#FF6B00"),
      border: `1px solid ${outline ? "rgba(255,255,255,0.15)" : (color || "#FF6B00")}`,
      color: outline ? "#A8B0C0" : "#fff",
      padding: small ? "6px 12px" : "9px 18px",
      borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap", ...style,
    }}>{children}</button>
  );
}
function CIconBtn({ onClick, children, danger, small }) {
  return (
    <button onClick={onClick} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "2px 6px" : "5px 9px", borderRadius: 6,
      cursor: "pointer", fontSize: small ? 11 : 14, fontFamily: "inherit",
    }}>{children}</button>
  );
}
function CModal({ title, onClose, children, width = 500 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
function EmptyState({ icon, text }) {
  return (
    <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#555" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div>{text}</div>
    </div>
  );
}
