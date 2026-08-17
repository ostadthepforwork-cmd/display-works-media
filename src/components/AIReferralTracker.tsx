"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const AI_REFERRER_PATTERNS = [
  { platform: "chatgpt", hosts: ["chatgpt.com", "chat.openai.com"] },
  { platform: "openai", hosts: ["openai.com"] },
  { platform: "perplexity", hosts: ["perplexity.ai"] },
  { platform: "claude", hosts: ["claude.ai"] },
  { platform: "copilot", hosts: ["copilot.microsoft.com", "bing.com"] },
  { platform: "gemini", hosts: ["gemini.google.com", "bard.google.com"] },
  { platform: "poe", hosts: ["poe.com"] },
  { platform: "you", hosts: ["you.com"] },
  { platform: "phind", hosts: ["phind.com"] },
];

function consentAllowsAnalytics() {
  try {
    const consent = window.localStorage.getItem("pdpa_consent");
    return consent === "all" || consent === "accepted" || consent === "true";
  } catch {
    return false;
  }
}

function detectAiReferrer(referrer: string) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    return AI_REFERRER_PATTERNS.find((item) =>
      item.hosts.some((knownHost) => host === knownHost || host.endsWith(`.${knownHost}`)),
    ) || null;
  } catch {
    return null;
  }
}

function publicLandingPage() {
  const path = `${window.location.pathname}${window.location.search}`.slice(0, 300);
  if (/^\/(admin|api|auth|doc|login)(\/|$)/i.test(path)) return "";
  return path || "/";
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
      window.sessionStorage.setItem(storageKey, "1");
    } catch {}

    fetch("/api/marketing/ai-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: matched.platform,
        landing_page: landingPage,
        referrer: document.referrer.slice(0, 500),
      }),
      keepalive: true,
    }).catch(() => undefined);

    window.gtag?.("event", "ai_referral", {
      ai_platform: matched.platform,
      landing_page: landingPage,
      referrer_domain: matched.hosts[0],
    });
  }, []);

  return null;
}
