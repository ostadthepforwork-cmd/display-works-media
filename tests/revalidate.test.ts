import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { AdminAuthorization } from "../src/lib/admin-authorization";
import { handleRevalidate } from "../src/lib/revalidation-server";
import { requestBlogRevalidation } from "../src/lib/revalidation-client";

const activeAdmin = {
  user: { id: "admin-user" },
  authenticated: true,
  status: 200,
  error: null,
} as AdminAuthorization;

function request(body: unknown, contentType = "application/json") {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

test("revalidate fails closed for anonymous, inactive, and unavailable authorization", async () => {
  for (const authorization of [
    { user: null, authenticated: false, status: 401, error: "Unauthorized" },
    { user: null, authenticated: true, status: 403, error: "Forbidden" },
    { user: null, authenticated: false, status: 503, error: "Authorization unavailable" },
  ] as AdminAuthorization[]) {
    const invalidated: string[] = [];
    const response = await handleRevalidate(request({ slug: "safe-article" }), {
      authorize: async () => authorization,
      invalidate: (path) => invalidated.push(path),
    });
    assert.equal(response.status, authorization.status);
    assert.deepEqual(invalidated, []);
  }
});

test("active admin can revalidate only fixed paths and a canonical blog slug", async () => {
  const invalidated: string[] = [];
  const response = await handleRevalidate(request({ slug: "บทความ-display-123" }), {
    authorize: async () => activeAdmin,
    invalidate: (path) => invalidated.push(path),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(invalidated, ["/", "/blog", "/sitemap.xml", "/blog/บทความ-display-123"]);
});

test("revalidate rejects noncanonical or hostile paths before invalidation", async () => {
  const invalid = ["/escape", "blog/post", "post/child", "post..child", "post?draft=1", "<script>", "a".repeat(201)];
  for (const slug of invalid) {
    const invalidated: string[] = [];
    const response = await handleRevalidate(request({ slug }), {
      authorize: async () => activeAdmin,
      invalidate: (path) => invalidated.push(path),
    });
    assert.equal(response.status, 400, slug);
    assert.deepEqual(invalidated, [], slug);
  }
});

test("revalidate rejects malformed requests and reports invalidation failures", async () => {
  const unsupported = await handleRevalidate(request({}, "text/plain"), {
    authorize: async () => activeAdmin,
    invalidate: () => assert.fail("must not invalidate"),
  });
  assert.equal(unsupported.status, 415);

  const failed = await handleRevalidate(request({}), {
    authorize: async () => activeAdmin,
    invalidate: () => { throw new Error("cache unavailable"); },
  });
  assert.equal(failed.status, 500);
});

test("admin caller detects a revalidation failure without throwing", async () => {
  const result = await requestBlogRevalidation("saved-post", async () => (
    Response.json({ ok: false, error: "Revalidate failed" }, { status: 500 })
  ));
  assert.deepEqual(result, { ok: false, error: "Revalidate failed" });
});

test("route and browser caller contain no secret-based authorization", async () => {
  const [route, caller, adminPage] = await Promise.all([
    readFile("src/app/api/revalidate/route.ts", "utf8"),
    readFile("src/lib/revalidation-client.ts", "utf8"),
    readFile("src/app/admin/page.tsx", "utf8"),
  ]);
  const reviewedSource = `${route}\n${caller}\n${adminPage}`;

  assert.match(route, /authorize: requireAdminUser/);
  assert.doesNotMatch(reviewedSource, /NEXT_PUBLIC_REVALIDATE_SECRET|REVALIDATE_SECRET/);
  assert.doesNotMatch(caller, /secret\s*:/);
});
