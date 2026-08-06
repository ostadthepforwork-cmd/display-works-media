import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const secret = typeof body.secret === "string" ? body.secret : "";
    const configuredSecret = process.env.REVALIDATE_SECRET || process.env.NEXT_PUBLIC_REVALIDATE_SECRET || "";

    if (configuredSecret && secret !== configuredSecret) {
      return NextResponse.json({ ok: false, error: "Invalid revalidate secret" }, { status: 401 });
    }

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");

    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }

    return NextResponse.json({
      ok: true,
      revalidated: ["/", "/blog", "/sitemap.xml", slug ? `/blog/${slug}` : null].filter(Boolean),
    });
  } catch (error) {
    console.error("Revalidate failed:", error);
    return NextResponse.json({ ok: false, error: "Revalidate failed" }, { status: 500 });
  }
}
