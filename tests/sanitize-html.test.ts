import test from "node:test";
import assert from "node:assert/strict";
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
