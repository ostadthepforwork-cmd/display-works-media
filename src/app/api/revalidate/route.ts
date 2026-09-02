import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { handleRevalidate } from "@/lib/revalidation-server";

export async function POST(request: Request) {
  return handleRevalidate(request, {
    authorize: requireAdminUser,
    invalidate: revalidatePath,
  });
}
