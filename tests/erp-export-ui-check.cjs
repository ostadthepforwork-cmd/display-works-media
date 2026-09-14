const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const fixtures = {
  erp_company: [{ id: 'co1', name: 'Display Works' }],
  erp_customers: [{ id: 'cu1', name: 'ลูกค้าทดสอบ' }],
  erp_products: [{ id: 'p1', name: 'ป้าย', price: '1000.00', cost: '500.00' }],
  erp_suppliers: [{ id: 's1', name: 'ผู้ขายทดสอบ' }],
  erp_documents: [{ id: 'd1', doc_no: 'QT-1', type: 'quote', customer_name: 'ลูกค้าทดสอบ', deleted: false }],
  erp_document_items: [{ id: 'i1', document_id: 'd1', name: 'ป้าย', qty: '1', price: '1000.00', cost_snapshot: '500.00' }],
  erp_expense_categories: [{ id: 'c1', name: 'โฆษณา' }],
  erp_expenses: [{ id: 'e1', expense_no: 'EXP-1', category_id: 'c1', supplier_id: 's1', description: 'ค่าโฆษณา', total_amount: '300.00' }],
  erp_expense_attachments: [{ id: 'a1', expense_id: 'e1', original_filename: 'proof.pdf' }],
  erp_expense_events: [{ id: 'v1', expense_id: 'e1', event_type: 'created' }],
};

(async () => {
  const out = path.resolve('output/playwright/erp-export');
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.split('/').pop();
      const rows = fixtures[table] || [];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Range', rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0');
      return res.end(JSON.stringify(rows));
    }
    if (url.pathname === '/preview.js' || url.pathname === '/preview.css') {
      res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript');
      return res.end(fs.readFileSync(path.join(out, url.pathname.slice(1))));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/preview.css"><style>body{margin:0;font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script src="/preview.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  await build({ entryPoints: [path.resolve('tests/erp-export-preview.tsx')], outfile: path.join(out, 'preview.js'), bundle: true, jsx: 'automatic', define: {
    'process.env.NODE_ENV': '"test"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(base), 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"synthetic-only"',
  }});
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ acceptDownloads: true });
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.getByRole('heading', { name: 'ส่งออกและสำรองข้อมูล' }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${width}`);
      await page.screenshot({ path: path.join(out, `export-${width}.png`), fullPage: true });
    }
    await page.getByRole('radio', { name: /ค่าใช้จ่ายจริง/ }).click();
    const csvDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ดาวน์โหลด CSV' }).click();
    const csv = await csvDownload;
    assert.match(csv.suggestedFilename(), /^display-works-erp-expenses-\d{4}-\d{2}-\d{2}\.csv$/);
    assert.match(fs.readFileSync(await csv.path(), 'utf8'), /EXP-1/);
    const backupDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'สร้างไฟล์สำรอง' }).click();
    const backup = await backupDownload;
    const payload = JSON.parse(fs.readFileSync(await backup.path(), 'utf8'));
    assert.equal(payload.counts.documents, 1);
    assert.equal(payload.counts.expenseAttachments, 1);
    assert.match(payload.sha256, /^[a-f0-9]{64}$/);
    console.log('PASS: export UI at 320/768/1280, expense CSV download, complete JSON backup; synthetic data only.');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
