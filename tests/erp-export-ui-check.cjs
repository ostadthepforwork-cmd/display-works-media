const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
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
    const radios=page.getByRole('radio');
    await radios.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await radios.nth(1).getAttribute('aria-checked'),'true');
    assert.equal(await radios.nth(1).evaluate(element=>element===document.activeElement),true);
    await page.keyboard.press('End');
    assert.equal(await radios.nth(4).getAttribute('aria-checked'),'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await radios.nth(0).getAttribute('aria-checked'),'true');
    for (const [index,kind,marker] of [[0,'documents','QT-1'],[1,'expenses','EXP-1'],[2,'customers','ลูกค้าทดสอบ'],[3,'products','ป้าย'],[4,'suppliers','ผู้ขายทดสอบ']]) {
      await radios.nth(index).click();
      const csvDownload=page.waitForEvent('download');
      await page.getByRole('button',{name:'ดาวน์โหลด CSV'}).click();
      const csv=await csvDownload;
      assert(csv.suggestedFilename().startsWith(`display-works-erp-${kind}-`));
      const csvPath=path.join(out,`${kind}.csv`);
      await csv.saveAs(csvPath);
      assert(fs.readFileSync(csvPath,'utf8').includes(marker));
    }
    const backupDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'สร้างไฟล์สำรอง' }).click();
    const backup = await backupDownload;
    await backup.saveAs(path.join(out,'backup.json'));
    const payload = JSON.parse(fs.readFileSync(path.join(out,'backup.json'), 'utf8'));
    assert.equal(payload.counts.documents, 1);
    assert.equal(payload.counts.expenseAttachments, 1);
    assert.match(payload.sha256, /^[a-f0-9]{64}$/);
    const {sha256,...unsigned}=payload;
    assert.equal(createHash('sha256').update(JSON.stringify(unsigned)).digest('hex'),sha256);
    await page.route('**/rest/v1/erp_expenses?**',route=>route.fulfill({status:403,contentType:'application/json',body:'{"message":"QA denied"}'}));
    await radios.nth(1).click();
    await page.getByRole('button',{name:'ดาวน์โหลด CSV'}).click();
    await page.waitForFunction(()=>document.title.startsWith('error:'));
    assert(await page.getByRole('button',{name:'ดาวน์โหลด CSV'}).isEnabled());
    console.log('PASS: 320/768/1280 layout, keyboard radio navigation, five real CSV downloads, JSON digest, denied-export recovery; synthetic data only.');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
