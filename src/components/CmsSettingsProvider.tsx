"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { CmsSettings } from "@/lib/cms-settings";

const CmsSettingsContext = createContext<CmsSettings>({});

export function CmsSettingsProvider({
  children,
  initialSettings = {},
}: {
  children: React.ReactNode;
  initialSettings?: CmsSettings;
}) {
  const [settings, setSettings] = useState<CmsSettings>(initialSettings);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    supabase
      .from("cms_settings")
      .select("key,value")
      .in("key", ["hero", "services", "reviews", "portfolio", "contact", "page_content"])
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const next = data.reduce((result, row: any) => {
          result[row.key as keyof CmsSettings] = row.value;
          return result;
        }, {} as CmsSettings);
        setSettings((current) => ({ ...current, ...next }));
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => settings, [settings]);
  return <CmsSettingsContext.Provider value={value}>{children}</CmsSettingsContext.Provider>;
}

export function useCmsSettings() {
  return useContext(CmsSettingsContext);
}

export function cmsValue(settings: CmsSettings, path: string, fallback: string) {
  const value = path.split(".").reduce<any>((current, key) => current?.[key], settings.page_content);
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function CmsText({
  path,
  fallback,
  as: Tag = "span",
  className,
}: {
  path: string;
  fallback: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const settings = useCmsSettings();
  return <Tag className={className}>{cmsValue(settings, path, fallback)}</Tag>;
}
