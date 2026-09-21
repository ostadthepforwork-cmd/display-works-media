import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import "../../../tokens.css";
import "./admin-system.css";

export const metadata: Metadata = {
  title: "Admin | Display Works Media",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHost = (await headers()).get("host") ?? "";
  const isLocalAdminPreview =
    process.env.ENABLE_LOCAL_ADMIN_BYPASS === "1" &&
    (requestHost.startsWith("127.0.0.1:") || requestHost.startsWith("localhost:"));

  if (isLocalAdminPreview) return <>{children}</>;

  const { user } = await requireAdminUser(["owner", "admin", "sales", "marketing"]);
  if (!user) redirect("/login");
  return <>{children}</>;
}
