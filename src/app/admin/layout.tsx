import { createSupabaseServerClient } from "./supabase-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    // ใช้ getUser() แทน getSession() — getSession() ไม่ validate token จาก cookie ใน server component
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
