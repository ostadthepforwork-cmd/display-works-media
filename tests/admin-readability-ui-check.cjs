const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const fixture = {
  erp_customers: [{ id: 'qa-customer', name: 'QA Customer', customer_segment: 'B2B', business_type: 'Retail' }],
  erp_products: [{ id: 'qa-product', name: 'QA Product', unit: 'piece', price: 100, cost: 40 }],
  erp_company: [{ id: 'qa-company', name: 'QA Company' }],
  erp_documents: ['quote', 'bill', 'invoice', 'receipt'].map(type => ({ id: `qa-${type}`, type, doc_no: `QA-${type}`, customer_id: 'qa-customer', customer_name: 'QA Customer', status: 'approved', deleted: false, date: '2026-10-06', due_date: '2026-10-16' })),
  erp_document_items: ['quote', 'bill', 'invoice', 'receipt'].map(type => ({ id: `qa-item-${type}`, document_id: `qa-${type}`, name: 'QA Product', qty: 1, price: 100, cost_snapshot: 40 })),
  erp_expense_categories: [{ id: 'qa-category', name: 'QA Rent', active: true, code: 'QA', default_class: 'operating' }],
  erp_expenses: [],
  posts: [{ id: 'qa-article', title: 'QA Readability', slug: 'qa-readability', published: false, date: '2026-10-06', body: '<h2>QA Heading</h2><p>Readable paragraph with <strong>bold text</strong>.</p><ul><li>Readable list item</li></ul><p style="color: #e2e8f0">Legacy light ink</p><p><font color="#ffffff">Legacy white ink</font></p><p style="color: #b91c1c">Authored red ink</p>' }],
};

async function main() {
  const out = path.resolve(process.env.QA_OUTPUT || 'output/playwright/readability');
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/rest/v1/')) {
      if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
      const rows = fixture[url.pathname.split('/').pop()] || [];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Range', rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0');
      return res.end(JSON.stringify(req.headers.accept?.includes('vnd.pgrst.object') ? rows[0] || null : rows));
    }
    if (url.pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ connected: false, campaigns: [], ads: [], adsets: [], data: [], leads: [], logs: [] }));
    }
    if (url.pathname.startsWith('/images/')) {
      const file = path.resolve('public', `.${url.pathname}`);
      if (!file.startsWith(path.resolve('public') + path.sep) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
      return res.end(fs.readFileSync(file));
    }
    if (['/preview.js', '/preview.css'].includes(url.pathname)) {
      res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript');
      return res.end(fs.readFileSync(path.join(out, url.pathname.slice(1))));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/preview.css"><style>body{margin:0;font-family:Arial,sans-serif}.hide-mobile{display:block}.show-mobile{display:none}@media(max-width:768px){.hide-mobile{display:none!important}.show-mobile{display:flex}}</style></head><body><div id="root"></div><script src="/preview.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Admin from './src/app/admin/page'; import './src/app/admin/admin-system.css'; createRoot(document.getElementById('root')).render(<Admin/>);`, resolveDir: process.cwd(), loader: 'tsx' }, outfile: path.join(out, 'preview.js'), bundle: true, jsx: 'automatic', external: ['/images/*'], define: {
      'process.env': '{}', 'process.env.NODE_ENV': '"test"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(base), 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"synthetic-only"',
    }, plugins: [{ name: 'local-next-boundaries', setup(builder) {
      builder.onResolve({ filter: /^next\/(image|navigation)$/ }, args => ({ path: args.path, namespace: 'qa-next' }));
      builder.onLoad({ filter: /.*/, namespace: 'qa-next' }, args => ({ contents: args.path.endsWith('image')
        ? 'import React from "react"; export default function Image({priority,fill,unoptimized,...props}){return React.createElement("img",props)}'
        : 'export const useRouter=()=>({push:url=>location.assign(url),replace:url=>location.replace(url),refresh:()=>location.reload()}); export const useSearchParams=()=>new URLSearchParams(location.search); export const usePathname=()=>location.pathname;', loader: 'js', resolveDir: process.cwd() }));
    } }] });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    const checks = [];
    const check = async (selector, name, inverse = false) => {
      const value = await page.locator(selector).first().evaluate(el => {
        const s = getComputedStyle(el);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        const rgba = color => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data];
        };
        const ancestors = [];
        for (let node = el; node; node = node.parentElement) ancestors.unshift(node);
        let background = [255, 255, 255];
        for (const node of ancestors) {
          const color = rgba(getComputedStyle(node).backgroundColor);
          background = background.map((channel, i) => color[i] * color[3] / 255 + channel * (1 - color[3] / 255));
        }
        const foreground = rgba(s.webkitTextFillColor === 'currentcolor' ? s.color : s.webkitTextFillColor);
        const luminance = color => color.slice(0, 3).reduce((sum, channel, i) => {
          const normalized = channel / 255;
          return sum + (normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
        }, 0);
        const a = luminance(foreground), b = luminance(background);
        return { color: s.color, fill: s.webkitTextFillColor, size: parseFloat(s.fontSize), background: s.backgroundColor, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
      if (inverse) assert.equal(value.fill, 'rgb(248, 250, 252)', name);
      assert(value.size >= 12, `${name}: ${value.size}px`);
      assert(value.contrast >= 4.5, `${name}: contrast ${value.contrast}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: page overflow`);
      checks.push({ name, ...value });
    };
    for (const width of [1440, 819, 390]) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${base}/admin?section=erp`);
      await page.getByRole('navigation', { name: 'เมนู ERP' }).getByRole('button', { name: 'ค่าใช้จ่าย', exact: true }).click();
      await page.getByRole('heading', { name: 'ค่าใช้จ่ายจริง', exact: true }).waitFor();
      await page.setViewportSize({ width, height: 844 });
      await check('.expense-header h2', `expense heading ${width}`, true);
      await page.getByRole('button', { name: 'เพิ่มค่าใช้จ่าย', exact: true }).click();
      await check('.expense-modal h3', `expense modal ${width}`, true);
      await check('.evidence-head strong', `expense evidence ${width}`, true);
      await page.screenshot({ path: path.join(out, `expense-${width}.png`), fullPage: false });
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.goto(`${base}/admin?section=cms`);
      await page.getByRole('button', { name: /เพิ่มบทความ/ }).click();
      for (const tab of ['SEO', 'เผยแพร่']) {
        await page.locator('.blog-form-tabs').getByRole('button', { name: new RegExp(tab) }).click();
        await check('.cms-editor-section', `CMS ${tab} ${width}`);
        const textFill = await page.locator('.cms-editor-section').first().evaluate(el => getComputedStyle(el).webkitTextFillColor);
        assert.notEqual(textFill, 'rgb(248, 250, 252)', 'Light CMS panel must not have inverse text');
      }
      const checkbox = await page.locator('#published').boundingBox();
      assert(checkbox && checkbox.width === 18 && checkbox.height === 18, 'Publish checkbox keeps its native dimensions');
      await page.screenshot({ path: path.join(out, `cms-${width}.png`), fullPage: false });
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.getByRole('button', { name: 'Edit article: QA Readability', exact: true }).click();
      const editor = page.locator('.rich-editor-surface');
      await editor.getByText('Readable paragraph with', { exact: false }).waitFor();
      await check('.rich-editor-surface p', `CMS paragraph ${width}`);
      await check('.rich-editor-surface li', `CMS list ${width}`);
      await check('.rich-editor-toolbar button[aria-label="Bold"]', `CMS toolbar ${width}`);
      await check('.rich-editor-surface p:nth-of-type(2)', `CMS legacy light ink ${width}`);
      await check('.rich-editor-surface p:nth-of-type(3)', `CMS legacy white ink ${width}`);
      assert.equal(await editor.locator('strong').innerText(), 'bold text', 'Bold formatting is preserved');
      assert((await editor.innerText()).includes('Legacy white ink'), 'Existing article text is preserved');
      await editor.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, `cms-body-${width}.png`), fullPage: false, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await page.goto(`${base}/admin?section=marketing`);
      const ads = page.getByRole('button', { name: /Ads Performance/ }).filter({ visible: true });
      await ads.first().click();
      await page.locator('.mk-segmented button.active').first().waitFor();
      const active = await page.locator('.mk-segmented button.active').first().evaluate(el => getComputedStyle(el).webkitTextFillColor);
      assert.equal(active, 'rgb(17, 24, 39)', 'Selected Ads control ink');
      await page.screenshot({ path: path.join(out, `marketing-${width}.png`), fullPage: false });
    }
    assert.deepEqual(errors, [], 'Uncaught app errors');
    console.log(JSON.stringify({ base, checks, pageErrors: errors, screenshots: out }));
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
