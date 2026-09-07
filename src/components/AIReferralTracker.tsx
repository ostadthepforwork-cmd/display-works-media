"use client";

import { useEffect } from "react";
import { detectAiReferrer, publicReferralPath } from "@/lib/ai-evidence";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function consentAllowsAnalytics() {
  try {
    const consent = window.localStorage.getItem("pdpa_consent");
    return consent === "all" || consent === "accepted" || consent === "true";
  } catch {
    return false;
  }
}

function publicLandingPage() {
  return publicReferralPath(window.location.pathname);
}

export default function AIReferralTracker() {
  useEffect(() => {
    if (!consentAllowsAnalytics()) return;

    const matched = detectAiReferrer(document.referrer);
    const landingPage = publicLandingPage();
    if (!matched || !landingPage) return;

    const storageKey = `dwm_ai_referral:${matched.platform}:${landingPage}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
    } catch {}

    fetch("/api/marketing/ai-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: matched.platform,
        landing_page: landingPage,
        referrer: new URL(document.referrer).origin,
      }),
      keepalive: true,
    }).then(async response => {
      const result = await response.json();
      if (response.ok && result.success) {
        try { window.sessionStorage.setItem(storageKey, "1"); } catch {}
      }
    }).catch(() => undefined);

    window.gtag?.("event", "ai_referral", {
      ai_platform: matched.platform,
      landing_page: landingPage,
      referrer_domain: matched.hosts[0],
    });
  }, []);

  return null;
}
