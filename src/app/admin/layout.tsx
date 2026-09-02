import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";

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
  const { user } = await requireAdminUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
