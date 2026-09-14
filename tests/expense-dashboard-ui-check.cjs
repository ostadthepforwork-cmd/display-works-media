const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const out = path.resolve('output/playwright/expense-dashboard');
  fs.mkdirSync(out, { recursive: true });
  await build({ entryPoints: ['tests/expense-dashboard-preview.tsx'], outfile: path.join(out, 'preview.js'), bundle: true, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"test"' } });
  const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/preview.css"><style>body{margin:0;background:#0b0f19;color:#fff;font-family:Arial,sans-serif}#root{max-width:1000px;margin:auto;padding:20px;box-sizing:border-box}</style><div id="root"></div><script src="/preview.js"></script>';
  const server = http.createServer((req, res) => {
    if (req.url === '/preview.js' || req.url === '/preview.css') {
      res.setHeader('Content-Type', req.url.endsWith('.css') ? 'text/css' : 'text/javascript');
      res.end(fs.readFileSync(path.join(out, req.url.slice(1))));
    } else res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const url = `http://127.0.0.1:${server.address().port}`;
    for (const width of [320, 375, 414, 768, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(url);
      await page.getByText('ค่าโฆษณา Facebook', { exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`);
      await page.screenshot({ path: path.join(out, `category-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'รายการรายวัน', exact: true }).click();
      await page.getByRole('button', { name: 'หน้าถัดไป', exact: true }).click();
      await page.getByText('หน้า 2 / 3', { exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `daily overflow ${width}`);
      await page.screenshot({ path: path.join(out, `daily-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'รีเฟรชค่าใช้จ่าย', exact: true }).click();
      assert.equal(await page.title(), 'refreshed');
    }
    for (const state of ['empty', 'loading', 'error']) {
      await page.goto(`${url}/?state=${state}`);
      if (state === 'loading') assert(await page.getByRole('button', { name: 'รีเฟรชค่าใช้จ่าย' }).isDisabled());
      if (state === 'error') await page.getByRole('alert').waitFor();
      if (state === 'empty') await page.getByText('ไม่มีรายการในช่วงวันที่นี้', { exact: true }).waitFor();
    }
    console.log('PASS: 5 viewport widths, tabs, pagination, refresh, empty/loading/error; synthetic data only.');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
