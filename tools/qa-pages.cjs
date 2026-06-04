const { chromium } = require("playwright");

const baseUrl = "http://localhost:3000";
const paths = [
  "/",
  "/services/vinyl",
  "/services/sticker",
  "/services/rollup",
  "/services/ppboard",
  "/services/label",
  "/services/backdrop",
  "/blog",
  "/about",
  "/contact",
  "/login",
];

async function inspectPage(page, path, viewport) {
  const consoleErrors = [];
  const badResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      badResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 20000 });

  const result = await page.evaluate(() => {
    const body = document.body;
    const doc = document.documentElement;
    const title = document.title;
    const description = document.querySelector("meta[name='description']")?.getAttribute("content") || "";
    const robots = document.querySelector("meta[name='robots']")?.getAttribute("content") || "";
    const canonical = document.querySelector("link[rel='canonical']")?.getAttribute("href") || "";
    const ogTitle = document.querySelector("meta[property='og:title']")?.getAttribute("content") || "";
    const h1Count = document.querySelectorAll("h1").length;
    const missingAlt = Array.from(document.querySelectorAll("img"))
      .filter((img) => !img.getAttribute("alt"))
      .map((img) => img.currentSrc || img.src)
      .slice(0, 10);
    const horizontalOverflow = Math.max(body.scrollWidth, doc.scrollWidth) - window.innerWidth;
    const tinyButtons = Array.from(document.querySelectorAll("a,button"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (!el.textContent?.trim() && !el.getAttribute("aria-label")) return false;
        return rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32);
      })
      .map((el) => ({
        text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 60),
        width: Math.round(el.getBoundingClientRect().width),
        height: Math.round(el.getBoundingClientRect().height),
      }))
      .slice(0, 10);

    return {
      title,
      descriptionLength: description.length,
      robots,
      canonical,
      ogTitle,
      h1Count,
      missingAlt,
      horizontalOverflow,
      tinyButtons,
    };
  });

  return {
    path,
    viewport: `${viewport.width}x${viewport.height}`,
    consoleErrors,
    badResponses,
    ...result,
  };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage();
  const results = [];

  for (const path of paths) {
    results.push(await inspectPage(page, path, { width: 1366, height: 900 }));
    results.push(await inspectPage(page, path, { width: 390, height: 844 }));
  }

  await browser.close();

  const failures = results.filter((result) => (
    result.consoleErrors.some((error) => !error.includes("ERR_NETWORK_ACCESS_DENIED")) ||
    result.badResponses.some((response) => !response.includes("/__nextjs_original-stack-frames")) ||
    result.horizontalOverflow > 2 ||
    result.missingAlt.length ||
    result.h1Count !== 1 ||
    !result.title ||
    (!result.robots.includes("noindex") && (!result.canonical || !result.ogTitle || result.descriptionLength < 80))
  ));

  console.log(JSON.stringify({
    checked: results.length,
    failures,
    summary: results.map(({ path, viewport, h1Count, horizontalOverflow, missingAlt, title, robots }) => ({
      path,
      viewport,
      h1Count,
      horizontalOverflow,
      missingAlt: missingAlt.length,
      title,
      robots,
    })),
  }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
