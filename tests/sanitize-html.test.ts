import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sanitizeHtml } from "../src/lib/sanitize-html";

test("removes scripts, event handlers, and unsafe urls from CMS article HTML", () => {
  const html = `
    <p onclick="alert(1)">Hello <strong>reader</strong></p>
    <script>alert("xss")</script>
    <a href="javascript:alert(1)" target="_blank">bad</a>
    <img src="/images/work.jpg" onerror="alert(1)" alt="work" />
  `;

  const sanitized = sanitizeHtml(html);

  assert.equal(sanitized.includes("<script"), false);
  assert.equal(sanitized.includes("onclick"), false);
  assert.equal(sanitized.includes("onerror"), false);
  assert.equal(sanitized.includes("javascript:"), false);
  assert.equal(sanitized.includes("<strong>reader</strong>"), true);
  assert.equal(sanitized.includes('src="/images/work.jpg"'), true);
});

test("keeps safe links and adds noopener noreferrer for new tabs", () => {
  const sanitized = sanitizeHtml('<a href="https://displayworksmedia.com" target="_blank">DWM</a>');

  assert.equal(sanitized, '<a href="https://displayworksmedia.com" target="_blank" rel="noopener noreferrer">DWM</a>');
});

test("preserves supported rich text structures and Thai content", () => {
  const html = '<h2>หัวข้อไทย</h2><p><strong>หนา</strong> <em>เอียง</em> <u>ขีดเส้น</u></p><ul><li>รายการ</li></ul><table><caption>ตาราง</caption><tbody><tr><td>ข้อมูล</td></tr></tbody></table><figure><img src="/images/work.jpg" alt="งานพิมพ์"><figcaption>คำบรรยาย</figcaption></figure>';
  const sanitized = sanitizeHtml(html);

  assert.equal(sanitized.includes("หัวข้อไทย"), true);
  assert.equal(sanitized.includes("<u>ขีดเส้น</u>"), true);
  assert.equal(sanitized.includes("<table>"), true);
  assert.equal(sanitized.includes("<figure>"), true);
  assert.equal(sanitized.includes("<figcaption>คำบรรยาย</figcaption>"), true);
});

test("neutralizes encoded protocols, SVG, MathML, and malformed hostile markup", () => {
  const html = `
    <a href="jav&#x61;script&#58;alert(1)">encoded</a>
    <a href="java&Tab;script:alert(1)">tabbed</a>
    <svg><a href="javascript:alert(1)"><text>svg</text></a></svg>
    <math><mtext onclick="alert(1)">math</mtext></math>
    <<img src="/images/safe.jpg" onerror="alert(1)">
  `;
  const sanitized = sanitizeHtml(html);

  assert.equal(/javascript|onerror|onclick|<svg|<math/i.test(sanitized), false);
  assert.equal(sanitized.includes('src="/images/safe.jpg"'), true);
});

test("editor load, paste, persistence, and public render share sanitizeHtml", async () => {
  const [adminPage, publicArticle] = await Promise.all([
    readFile("src/app/admin/page.tsx", "utf8"),
    readFile("src/app/blog/[slug]/BlogPostClient.tsx", "utf8"),
  ]);

  assert.match(adminPage, /const safeValue = sanitizeHtml\(value \|\| ""\)/);
  assert.match(adminPage, /clipboardHtml\s*\? sanitizeHtml\(clipboardHtml\)/);
  assert.match(adminPage, /body: sanitizeHtml\(p\.body \|\| ""\)/);
  assert.match(publicArticle, /demoteBodyH1\(sanitizeHtml\(body\)\)/);
});
