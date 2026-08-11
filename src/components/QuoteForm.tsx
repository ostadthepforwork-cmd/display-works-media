"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, CheckCircle } from "lucide-react";

type FormData = {
  name: string;
  phone: string;
  lineId: string;
  serviceType: string;
  width: string;
  height: string;
  quantity: number;
  details: string;
  needDate: string;
};

const services = [
  "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥", "Sticker Indoor", "Sticker Outdoor",
  "PP Board", "Roll Up", "X-Stand", "Backdrop", "Standee", "à¸­à¸·à¹ˆà¸™à¹†",
];

const inputStyle = {
  background: "#0d1220",
  border: "1px solid rgba(255,255,255,0.08)",
  fontFamily: "'Prompt', sans-serif",
};

const onFocusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "rgba(255,107,0,0.5)";
};
const onBlurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.08)";
};

export default function QuoteForm({ contact }: { contact?: any }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const phone = contact?.phone || "065-916-1539";
  const email = contact?.email || "info.displayworksmedia@gmail.com";
  const lineUrl = contact?.line || "https://lin.ee/O0nPl03";
  const tel = phone.replace(/[^\d+]/g, "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
      else alert("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸” à¸à¸£à¸¸à¸“à¸²à¸¥à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆà¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡");
    } catch {
      alert("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸” à¸à¸£à¸¸à¸“à¸²à¸¥à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆà¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="quote" className="py-16 sm:py-20 px-5 sm:px-6 lg:px-8" style={{ background: "#0B0F19" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16 items-start">

          {/* Left info â€” à¸¥à¸š framer-motion à¹ƒà¸Šà¹‰ CSS reveal à¹à¸—à¸™ */}
          <div className="lg:col-span-2 reveal-section">
            <div className="section-label">à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡</div>
            <h2 className="section-title">à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡ à¹à¸¥à¸°à¸›à¸£à¸¶à¸à¸©à¸²à¹„à¸”à¹‰à¸Ÿà¸£à¸µ</h2>
            <p className="section-sub mb-10">
              à¹„à¸¡à¹ˆà¸§à¹ˆà¸²à¸ˆà¸°à¹€à¸›à¹‡à¸™à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢ à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ à¸«à¸£à¸·à¸­à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸² à¹€à¸£à¸²à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢
            </p>
            <div className="flex flex-col gap-4">
              {[
                "à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¹ƒà¸™à¸à¸²à¸£à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²",
                "à¸•à¸­à¸šà¸à¸¥à¸±à¸šà¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
                "à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¸à¹ˆà¸­à¸™à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆ",
                "à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹à¸šà¸šà¸à¹‡à¸ªà¸­à¸šà¸–à¸²à¸¡à¹„à¸”à¹‰",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={18} style={{ color: "#FF6B00", flexShrink: 0 }} aria-hidden="true" />
                  <span className="text-muted text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 rounded-xl border" style={{ background: "#141A24", borderColor: "rgba(255,107,0,0.2)" }}>
              <div className="text-sm font-semibold text-white mb-3">à¸•à¸´à¸”à¸•à¹ˆà¸­à¸”à¹ˆà¸§à¸™</div>
              <a href={lineUrl} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-2">
                ðŸ’¬ LINE: @displayworks
              </a>
              <a href={`tel:${tel}`} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-2">
                ðŸ“ž {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
                âœ‰ï¸ {email}
              </a>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-3 reveal-section">
            <div className="p-8 sm:p-10 rounded-2xl border" style={{ background: "#141A24", borderColor: "rgba(255,255,255,0.08)" }}>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
                  <CheckCircle size={56} style={{ color: "#FF6B00" }} aria-hidden="true" />
                  <h3 className="font-kanit font-bold text-2xl text-white">à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¸³à¹€à¸£à¹‡à¸ˆ!</h3>
                  <p className="text-muted text-sm max-w-xs">à¸—à¸µà¸¡à¸‡à¸²à¸™à¹„à¸”à¹‰à¸£à¸±à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‚à¸­à¸‡à¸„à¸¸à¸“à¹à¸¥à¹‰à¸§ à¸ˆà¸°à¸•à¸´à¸”à¸•à¹ˆà¸­à¸à¸¥à¸±à¸šà¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡</p>
                  <button type="button" onClick={() => setSubmitted(false)} className="mt-4 text-sm underline" style={{ color: "#FF6B00" }}>
                    à¸ªà¹ˆà¸‡à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²à¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* à¸Šà¸·à¹ˆà¸­ */}
                    <div>
                      <label htmlFor="quote-name" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¸Šà¸·à¹ˆà¸­-à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥ *
                      </label>
                      <input
                        id="quote-name"
                        {...register("name", { required: true })}
                        placeholder="à¸Šà¸·à¹ˆà¸­à¸‚à¸­à¸‡à¸„à¸¸à¸“"
                        autoComplete="name"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, border: `1px solid ${errors.name ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                        aria-required="true"
                        aria-invalid={errors.name ? "true" : "false"}
                      />
                    </div>

                    {/* à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£ */}
                    <div>
                      <label htmlFor="quote-phone" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ *
                      </label>
                      <input
                        id="quote-phone"
                        {...register("phone", { required: true })}
                        placeholder="08X-XXX-XXXX"
                        type="tel"
                        autoComplete="tel"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, border: `1px solid ${errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                        aria-required="true"
                        aria-invalid={errors.phone ? "true" : "false"}
                      />
                    </div>

                    {/* LINE ID */}
                    <div>
                      <label htmlFor="quote-line" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        LINE ID
                      </label>
                      <input
                        id="quote-line"
                        {...register("lineId")}
                        placeholder="@yourline"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* à¸›à¸£à¸°à¹€à¸ à¸—à¸ªà¸´à¸™à¸„à¹‰à¸² */}
                    <div>
                      <label htmlFor="quote-service" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¸›à¸£à¸°à¹€à¸ à¸—à¸ªà¸´à¸™à¸„à¹‰à¸² *
                      </label>
                      <select
                        id="quote-service"
                        {...register("serviceType", { required: true })}
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, border: `1px solid ${errors.serviceType ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}
                        aria-required="true"
                        aria-invalid={errors.serviceType ? "true" : "false"}
                      >
                        <option value="">à¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸ à¸—</option>
                        {services.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* à¸‚à¸™à¸²à¸”à¸à¸§à¹‰à¸²à¸‡ */}
                    <div>
                      <label htmlFor="quote-width" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¸‚à¸™à¸²à¸”à¸à¸§à¹‰à¸²à¸‡ (cm)
                      </label>
                      <input
                        id="quote-width"
                        {...register("width")}
                        placeholder="à¹€à¸Šà¹ˆà¸™ 100"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* à¸‚à¸™à¸²à¸”à¸ªà¸¹à¸‡ */}
                    <div>
                      <label htmlFor="quote-height" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¸‚à¸™à¸²à¸”à¸ªà¸¹à¸‡ (cm)
                      </label>
                      <input
                        id="quote-height"
                        {...register("height")}
                        placeholder="à¹€à¸Šà¹ˆà¸™ 200"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* à¸ˆà¸³à¸™à¸§à¸™ */}
                    <div>
                      <label htmlFor="quote-qty" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¸ˆà¸³à¸™à¸§à¸™ (à¸Šà¸´à¹‰à¸™)
                      </label>
                      <input
                        id="quote-qty"
                        {...register("quantity")}
                        type="number"
                        min={1}
                        placeholder="1"
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* à¸§à¸±à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£ */}
                    <div>
                      <label htmlFor="quote-date" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        à¸§à¸±à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸£à¸±à¸šà¸‡à¸²à¸™
                      </label>
                      <input
                        id="quote-date"
                        {...register("needDate")}
                        type="date"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, colorScheme: "dark" as React.CSSProperties["colorScheme"] }}
                      />
                    </div>
                  </div>

                  {/* à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸” */}
                  <div>
                    <label htmlFor="quote-details" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                      à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡
                    </label>
                    <textarea
                      id="quote-details"
                      {...register("details")}
                      rows={4}
                      placeholder="à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‡à¸²à¸™ à¸§à¸±à¸ªà¸”à¸¸ à¸„à¸§à¸²à¸¡à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸žà¸´à¹€à¸¨à¸© à¸«à¸£à¸·à¸­à¸ªà¸´à¹ˆà¸‡à¸—à¸µà¹ˆà¸­à¸¢à¸²à¸à¹ƒà¸«à¹‰à¹€à¸£à¸²à¸—à¸£à¸²à¸š..."
                      className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-y"
                      style={inputStyle}
                      onFocus={onFocusBorder}
                      onBlur={onBlurBorder}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-white text-base transition-all duration-200 disabled:opacity-70"
                    style={{ background: loading ? "#9A3412" : "#C2410C", boxShadow: "0 4px 20px rgba(194,65,12,0.25)" }}
                    onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#9A3412"; }}
                    onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#C2410C"; }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        à¸à¸³à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥...
                      </>
                    ) : (
                      <>
                        <Send size={18} aria-hidden="true" />
                        à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‚à¸­à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs" style={{ color: "#A8B0C0" }}>
                    à¸—à¸µà¸¡à¸‡à¸²à¸™à¸ˆà¸°à¸•à¸´à¸”à¸•à¹ˆà¸­à¸à¸¥à¸±à¸šà¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡ â€¢ à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¹ƒà¸™à¸à¸²à¸£à¸‚à¸­à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
