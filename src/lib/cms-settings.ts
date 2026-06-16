import { createClient } from "@supabase/supabase-js";

export type CmsSettings = {
  hero?: any;
  services?: any[];
  reviews?: any[];
  portfolio?: any[];
  contact?: any;
  page_content?: Record<string, any>;
};

const CMS_KEYS = ["hero", "services", "reviews", "portfolio", "contact", "page_content"] as const;

export async function getCmsSettings(): Promise<CmsSettings> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    const { data, error } = await supabase
      .from("cms_settings")
      .select("key,value")
      .in("key", [...CMS_KEYS]);

    if (error || !data) return {};

    return data.reduce((acc, row: any) => {
      if (CMS_KEYS.includes(row.key)) acc[row.key as keyof CmsSettings] = row.value;
      return acc;
    }, {} as CmsSettings);
  } catch (error) {
    console.warn("CMS settings unavailable:", error);
    return {};
  }
}
