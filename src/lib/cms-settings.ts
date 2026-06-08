import { createSupabaseServerClient } from "@/lib/supabase-server";

export type CmsSettings = {
  hero?: any;
  services?: any[];
  reviews?: any[];
  portfolio?: any[];
  contact?: any;
};

const CMS_KEYS = ["hero", "services", "reviews", "portfolio", "contact"] as const;

export async function getCmsSettings(): Promise<CmsSettings> {
  try {
    const supabase = await createSupabaseServerClient();
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
