const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const output = path.resolve('output/playwright/document-matrix');
  fs.mkdirSync(output, { recursive: true });
  const server = spawn(process.execPath, ['tests/public-document-preview-server.cjs'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Fixture server start timed out')), 30000);
      let log = '';
      server.stdout.on('data', chunk => {
        log += chunk.toString();
        const match = log.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timeout); resolve(match[0]); }
      });
      server.stderr.on('data', chunk => process.stderr.write(chunk));
      server.on('exit', code => { clearTimeout(timeout); reject(new Error(`Fixture server exited: ${code}`)); });
    });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const results = [];
    for (const type of ['quote', 'bill', 'invoice', 'receipt']) {
      for (const suffix of ['', '-long']) {
        await page.goto(`${base}/doc/${type}${suffix}`);
        await page.locator('article').waitFor();
        assert.equal(await page.locator('.doc-summary-total').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 107, 0)', 'Requested brand orange');
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
          document.documentElement.dataset.docPrinting = 'true';
        });
        assert(!/PRIVATE_[A-Z_]+/.test(await page.content()), `${type}${suffix}: internal data in HTML`);
        const rows = await page.locator('.doc-table tbody tr').count();
        assert.equal(rows, suffix ? 75 : 2);
        const pdf = path.join(output, `${type}${suffix}.pdf`);
        await page.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true });
        assert(fs.statSync(pdf).size > 1000, 'Nonempty PDF');
        results.push({ type, long: !!suffix, rows });
      }
    }
    const audit = await (await fetch(`${base}/audit`)).json();
    assert(audit.queries.length > 0);
    assert(audit.queries.every(query => query.fields !== '*' && !/cost|profit|margin|supplier|internal/i.test(query.fields)), 'Public query allowlist');
    console.log(JSON.stringify({ syntheticOnly: true, results, queryAllowlist: true }));
  } finally {
    await browser?.close();
    server.kill();
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
