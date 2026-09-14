const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const url = process.env.PREVIEW_URL || 'http://127.0.0.1:52406/';
  assert.equal(new URL(url).hostname, '127.0.0.1');
  const out = 'output/playwright/executive-v2';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('requestfailed', request => {
      if (new URL(request.url()).origin === new URL(url).origin) errors.push(`request: ${request.url()} ${request.failure()?.errorText || ''}`);
    });
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort());
    for (const width of [320, 375, 414, 768, 1280, 1448, 2048]) {
      await page.setViewportSize({ width, height: 1086 });
      await page.goto(url);
      await page.getByRole('button', { name: 'ดูรายละเอียดค่าใช้จ่าย', exact: true }).waitFor();
      await page.getByText('฿83,000.00', { exact: true }).first().waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}px`);
      const contrastFailures = await page.evaluate(() => {
        const luminance = color => {
          if (color.startsWith('oklch(')) {
            const values = color.match(/[-\d.]+/g).map(Number);
            const L = color.match(/oklch\(\s*[-\d.]+%/) ? values[0] / 100 : values[0];
            const chroma = values[1], hue = values[2] * Math.PI / 180;
            const a = chroma * Math.cos(hue), b = chroma * Math.sin(hue);
            const l = Math.pow(L + .3963377774 * a + .2158037573 * b, 3);
            const m = Math.pow(L - .1055613458 * a - .0638541728 * b, 3);
            const s = Math.pow(L - .0894841775 * a - 1.291485548 * b, 3);
            const rgb = [
              4.0767416621 * l - 3.3077115913 * m + .2309699292 * s,
              -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s,
              -.0041960863 * l - .7034186147 * m + 1.707614701 * s,
            ].map(value => Math.max(0, Math.min(1, value)));
            return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
          }
          const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
            const channel = value / 255;
            return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
          });
          return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
        };
        const failures = [];
        for (const el of document.querySelectorAll('main *')) {
          if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) ||
              !el.getClientRects().length || el.closest('svg,[disabled]')) continue;
          const style = getComputedStyle(el);
          if (style.visibility === 'hidden') continue;
          let parent = el, background;
          while (parent) {
            background = getComputedStyle(parent).backgroundColor;
            if (!background.includes('rgba') && background !== 'transparent') break;
            parent = parent.parentElement;
          }
          if (!parent) continue;
          const a = luminance(style.color), b = luminance(background);
          const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          if (ratio < 4.5) failures.push({ text: el.textContent.slice(0, 50), ratio });
        }
        return failures;
      });
      assert.deepEqual(contrastFailures, [], `Text contrast at ${width}px`);
      const clippedFinancialValues = await page.evaluate(() => [...document.querySelectorAll('[class*="kpiValue"] strong, [class*="expenseMetrics"] b')].flatMap(el => {
        const box = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        const style = getComputedStyle(el);
        const lineHeight = Number.parseFloat(style.lineHeight);
        const wraps = Number.isFinite(lineHeight) && el.scrollHeight > lineHeight * 1.45;
        const overflows = parent ? box.right > parent.right + 1 : false;
        return wraps || overflows ? [{ text: el.textContent, wraps, overflows }] : [];
      }));
      assert.deepEqual(clippedFinancialValues, [], `Wrapped or clipped financial value at ${width}px`);
      assert.equal(await page.getByText(/(?:NaN|undefined|Infinity)/).count(), 0, `Invalid displayed value at ${width}px`);
      if (width === 320 || width === 1280) {
        const calendar = page.locator('details').filter({ has: page.getByText(/2026-09-01/) });
        await calendar.locator('summary').click();
        const popoverIsTopmost = await calendar.locator('form').evaluate(form => {
          const box = form.getBoundingClientRect();
          const hit = document.elementFromPoint(Math.max(1, Math.min(innerWidth - 1, box.left + 12)), Math.max(1, Math.min(innerHeight - 1, box.bottom - 12)));
          return Boolean(hit && form.contains(hit));
        });
        assert.equal(popoverIsTopmost, true, `Date popover is clipped or covered at ${width}px`);
        await calendar.locator('summary').click();
      }
      if (width <= 800) {
        const undersizedIconTargets = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')].flatMap(el => {
          const box = el.getBoundingClientRect();
          const visible = box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden';
          return visible && (box.width < 44 || box.height < 44) ? [{ label: el.getAttribute('aria-label'), width: box.width, height: box.height }] : [];
        }));
        assert.deepEqual(undersizedIconTargets, [], `Undersized mobile icon target at ${width}px`);
      }
      assert(await page.locator('.recharts-line-curve').count() >= 3);
      await page.screenshot({ path: `${out}/dashboard-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'ดูรายละเอียด ยอดใบเสร็จรวม VAT', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await page.getByRole('button', { name: 'ดูรายละเอียดค่าใช้จ่าย', exact: true }).click();
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.getByRole('heading', { name: 'ภาพรวมธุรกิจ', exact: true }).waitFor();
    }
    await page.getByRole('button', { name: 'รายการหน้าถัดไป', exact: true }).click();
    assert(await page.getByRole('button', { name: 'รายการหน้าก่อน', exact: true }).isEnabled());
    await page.getByLabel('เรียงสินค้า').selectOption('margin');
    const series = page.getByLabel('ชุดข้อมูลกราฟ');
    await series.getByRole('button', { name: 'ค่าใช้จ่าย', exact: true }).click();
    assert.equal(await series.getByRole('button', { name: 'ค่าใช้จ่าย', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.recharts-area-area').count(), 0);
    await series.getByRole('button', { name: 'ทั้งหมด', exact: true }).click();
    assert(await page.locator('.recharts-area-area').count() > 0);
    assert(await page.locator('.recharts-bar-rectangle').count() >= 5);
    assert((await page.locator('.recharts-line-curve').all()).length >= 3);
    await page.getByRole('button', { name: 'ข้อมูลกราฟ', exact: true }).click();
    await page.getByLabel('เปรียบเทียบกับ').selectOption('none');
    assert.equal(new URL(page.url()).searchParams.get('erpCompare'), 'none');
    await page.locator('details').filter({ has: page.getByText(/2026-09-01/) }).locator('summary').click();
    await page.getByLabel('เริ่มวันที่').fill('2026-09-10');
    await page.getByLabel('ถึงวันที่').fill('2026-09-01');
    await page.getByRole('button', { name: 'ใช้ช่วงวันที่', exact: true }).click();
    await page.locator('[role="alert"]').filter({ hasText: 'ช่วงวันที่ไม่ถูกต้อง' }).waitFor();
    await page.getByLabel('ถึงวันที่').fill('2026-09-10');
    await page.getByRole('button', { name: 'ใช้ช่วงวันที่', exact: true }).click();
    const applied = new URL(page.url()).searchParams;
    assert.equal(applied.get('erpFrom'), '2026-09-10');
    assert.equal(applied.get('erpTo'), '2026-09-10');
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS: seven viewports, overflow, financial value fit, mobile targets, chart paths, filters, comparison URL, invalid date, dialogs, navigation, pagination and sorting; synthetic local data only');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
