import { NextResponse } from "next/server";
import type { AdminAuthorization } from "./admin-authorization";

const FIXED_REVALIDATION_PATHS = ["/", "/blog", "/sitemap.xml"] as const;
const CANONICAL_BLOG_SLUG = /^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u;

export type RevalidateDependencies = {
  authorize: () => Promise<AdminAuthorization>;
  invalidate: (path: string) => void;
};

function isCanonicalBlogSlug(value: string) {
  return value.length <= 200 && CANONICAL_BLOG_SLUG.test(value);
}

export async function handleRevalidate(request: Request, dependencies: RevalidateDependencies) {
  const authorization = await dependencies.authorize();
  if (authorization.status !== 200 || !authorization.user) {
    return NextResponse.json(
      { ok: false, error: authorization.error || "Unauthorized" },
      { status: authorization.status },
    );
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ ok: false, error: "JSON request required" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const rawSlug = (body as Record<string, unknown>).slug;
  if (rawSlug !== undefined && typeof rawSlug !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid blog slug" }, { status: 400 });
  }

  const slug = rawSlug?.trim() || "";
  if (slug && (slug !== rawSlug || !isCanonicalBlogSlug(slug))) {
    return NextResponse.json({ ok: false, error: "Invalid blog slug" }, { status: 400 });
  }

  const paths = [...FIXED_REVALIDATION_PATHS, ...(slug ? [`/blog/${slug}`] : [])];
  try {
    paths.forEach(dependencies.invalidate);
  } catch (error) {
    console.error("Revalidate failed:", error);
    return NextResponse.json({ ok: false, error: "Revalidate failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, revalidated: paths });
}
