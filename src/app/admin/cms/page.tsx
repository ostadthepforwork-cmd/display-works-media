import { redirect } from "next/navigation";

export default function CmsRedirect() {
  redirect("/admin?section=cms");
}
