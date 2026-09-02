import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("server clients have explicit non-switching privilege contracts", async () => {
  const [userClient, publicClient, privilegedClient, browserClient, blogPage, documentPage] = await Promise.all([
    readFile("src/lib/supabase-server.ts", "utf8"),
    readFile("src/lib/supabase-public-server.ts", "utf8"),
    readFile("src/lib/supabase-privileged-server.ts", "utf8"),
    readFile("src/lib/supabase-browser.ts", "utf8"),
    readFile("src/app/blog/[slug]/page.tsx", "utf8"),
    readFile("src/app/doc/[id]/page.tsx", "utf8"),
  ]);

  assert.equal(userClient.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.equal(publicClient.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.equal(browserClient.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.match(privilegedClient, /import "server-only"/);
  assert.match(privilegedClient, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(blogPage, /createPublicServerClient/);
  assert.equal(blogPage.includes("createPrivilegedServerClient"), false);
  assert.match(documentPage, /createPrivilegedServerClient/);
  assert.match(documentPage, /\.eq\("id", id\)/);
  assert.match(documentPage, /\.eq\("deleted", false\)/);
});
