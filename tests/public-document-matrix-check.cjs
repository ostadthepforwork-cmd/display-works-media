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
      for (const suffix of ['', '-detailed', '-long']) {
        const expectedRows = suffix === '-long' ? 75 : suffix === '-detailed' ? 6 : 2;
        await page.goto(`${base}/doc/${type}${suffix}`);
        await page.locator('article').waitFor();
        await page.locator('.doc-paged-preview[data-ready="true"]').waitFor({ timeout: 30000 });
        const source = page.locator('.doc-a4');
        assert((await source.textContent()).includes('Requested deposit 50% before production'), 'Payment terms remain visible as notes');
        assert(!/DEPOSIT PAID|BALANCE DUE/.test(await source.locator('.doc-summary').textContent()), 'Notes must not imply received payment');
        assert.equal(await source.locator('.doc-summary-total').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 107, 0)', 'Requested brand orange');
        const sheets = page.locator('.doc-paged-preview .pagedjs_sheet');
        const pageCount = await sheets.count();
        assert.equal(await page.locator('.doc-paged-preview .doc-repeated-footer .doc-footer').count(), pageCount, 'Every A4 page needs a footer');
        for (const sheet of await sheets.all()) {
          assert((await sheet.locator('.doc-repeated-footer .doc-footer').textContent()).includes('Thank you for your business.'));
          const positions = await sheet.evaluate(el => {
            const footer = el.querySelector('.doc-repeated-footer').getBoundingClientRect();
            const content = el.querySelector('.pagedjs_page_content').getBoundingClientRect();
            const page = el.getBoundingClientRect();
            return { separated: footer.top >= content.bottom - 1, inside: footer.bottom <= page.bottom };
          });
          assert(positions.separated && positions.inside, 'Footer must stay in the reserved margin, not overlap content');
        }
        assert(suffix ? pageCount > 1 : pageCount >= 1);
        for (const size of await sheets.evaluateAll(elements => elements.map(el => ({ width: el.offsetWidth, height: el.offsetHeight })))) {
          assert(Math.abs(size.width / size.height - 210 / 297) < 0.002, `Not an A4 preview: ${JSON.stringify(size)}`);
        }
        assert.equal(await page.locator('.doc-paged-preview .doc-table tbody tr').count(), expectedRows, 'Preview must retain every item exactly once');
        if (type === 'quote' && suffix === '-detailed') {
          for (const width of [1280, 390]) {
            await page.setViewportSize({ width, height: 900 });
            await page.screenshot({ path: path.join(output, `a4-preview-${width}.png`), fullPage: true });
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Preview overflows horizontally');
            for (const size of await page.locator('.doc-paged-preview .pagedjs_page').evaluateAll(elements => elements.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })))) {
              assert(Math.abs(size.width / size.height - 210 / 297) < 0.002, 'Responsive page lost A4 proportions');
            }
          }
          await page.setViewportSize({ width: 1280, height: 900 });
        }
        for (const media of ['screen', 'print']) {
          await page.emulateMedia({ media });
          for (const selector of ['.doc-title p', '.doc-section-kicker', '.doc-meta-row span:first-child', '.doc-table .num', '.doc-table td.right strong']) {
            const colors = await source.locator(selector).evaluateAll(elements => elements.map(el => getComputedStyle(el).color));
            assert(colors.length > 0, `Missing accent: ${selector}`);
            assert(colors.every(color => color === 'rgb(255, 107, 0)'), `${media} ${selector}: ${colors.join(', ')}`);
          }
        }
        await page.emulateMedia({ media: 'screen' });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
          document.documentElement.dataset.docPrinting = 'true';
        });
        assert(!/PRIVATE_[A-Z_]+/.test(await page.content()), `${type}${suffix}: internal data in HTML`);
        const rows = await source.locator('.doc-table tbody tr').count();
        assert.equal(rows, expectedRows);
        const pdf = path.join(output, `${type}${suffix}.pdf`);
        await page.emulateMedia({ media: 'print' });
        assert.equal(await source.evaluate(el => getComputedStyle(el).display), 'none', 'Do not print the unpaginated source');
        await page.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true });
        await page.emulateMedia({ media: 'screen' });
        assert(fs.statSync(pdf).size > 1000, 'Nonempty PDF');
        results.push({ type, suffix, rows, previewPages: pageCount });
      }
    }
    const audit = await (await fetch(`${base}/audit`)).json();
    assert(audit.queries.length > 0);
    assert(audit.queries.every(query => query.fields !== '*' && !/cost|profit|margin|supplier|internal/i.test(query.fields)), 'Public query allowlist');
    const adminSource = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
    const printTemplate = adminSource.slice(adminSource.indexOf('function printDocument('));
    const printStyles = printTemplate.match(/<style>([\s\S]*?)<\/style>/)[1];
    const legacyPage = await browser.newPage();
    for (const count of [6, 75]) {
      const rows = Array.from({ length: count }, (_, i) => `<tr><td>Legacy Item ${i + 1}</td><td>Multiline product detail<br>Size and material</td><td>100.00</td></tr>`).join('');
      await legacyPage.setContent(`<style>${printStyles}</style><div class="print-footer">Thank you for your business.</div><div class="page"><h1>QA QUOTATION</h1><table><thead><tr><th>ITEM</th><th>DETAIL</th><th>AMOUNT</th></tr></thead><tbody>${rows}</tbody></table><section>QA TOTAL</section></div>`);
      await legacyPage.emulateMedia({ media: 'print' });
      await legacyPage.pdf({ path: path.join(output, `legacy-${count}.pdf`), printBackground: true, preferCSSPageSize: true });
    }
    console.log(JSON.stringify({ syntheticOnly: true, results, queryAllowlist: true }));
  } finally {
    await browser?.close();
    server.kill();
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
