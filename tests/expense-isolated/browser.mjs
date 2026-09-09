import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, readdirSync, appendFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

assert.equal(process.env.GITHUB_ACTIONS, 'true');
assert.equal(process.env.RUNNER_ENVIRONMENT, 'github-hosted');
const container = 'supabase_db_expense-supabase';
const info = JSON.parse(execFileSync('docker', ['inspect', container], { encoding: 'utf8' }))[0];
assert.equal(info.Name, '/' + container);
assert.equal(info.State.Running, true);
const root = new URL('../../', import.meta.url);
const sql = input => execFileSync('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'], { input, encoding: 'utf8', timeout: 30000 });
sql(readFileSync(new URL('browser-fixture.sql', import.meta.url), 'utf8'));
const local = JSON.parse(execFileSync('npx', ['--yes', 'supabase@2.116.0', 'status', '--workdir', process.env.RUNNER_TEMP + '/expense-supabase', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
assert.equal(local.API_URL, 'http://127.0.0.1:54321');
assert(local.ANON_KEY && local.SERVICE_ROLE_KEY);
const email = `browser-${randomUUID()}@example.invalid`;
const password = randomUUID() + 'aA!9';
const created = await fetch(local.API_URL + '/auth/v1/admin/users', {
  method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
  headers: { apikey: local.ANON_KEY, Authorization: 'Bearer ' + local.SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, email_confirm: true }),
});
assert(created.ok, 'Synthetic Auth account creation failed');
const user = await created.json();
assert.match(user.id, /^[0-9a-f-]{36}$/);
sql(`insert into public.admin_users(user_id,email,role,active) values ('${user.id}','${email}','owner',true);`);
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: local.API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY, NEXT_PUBLIC_DISABLE_LOCAL_ADMIN_BYPASS: '1', SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, NEXT_TELEMETRY_DISABLED: '1' };
execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit', timeout: 240000 });
execFileSync('npm', ['run', 'typecheck'], { cwd: root, env, stdio: 'inherit', timeout: 120000 });
execFileSync('npm', ['run', 'test:unit'], { cwd: root, env, stdio: 'inherit', timeout: 120000 });
// Do not stream application build/runtime logs: they may contain local-only credentials.
try { execFileSync('npm', ['run', 'build'], { cwd: root, env, stdio: 'pipe', timeout: 300000 }); }
catch { throw new Error('Isolated application build failed; raw output withheld'); }
function scan(dir) {
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    const path = new URL(file.name + (file.isDirectory() ? '/' : ''), dir);
    if (file.isDirectory()) scan(path);
    else if (file.name.endsWith('.js')) {
      const body = readFileSync(path, 'utf8');
      assert(!body.includes(local.SERVICE_ROLE_KEY) && !/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/.test(body), 'Privileged browser-bundle marker');
    }
  }
}
scan(new URL('.next/static/', root));
const require = createRequire(process.env.RUNNER_TEMP + '/expense-browser/package.json');
const { chromium } = require('playwright');
const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'], { cwd: root, env, stdio: 'ignore' });
let browser;
let page;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch('http://127.0.0.1:3100/login', { signal: AbortSignal.timeout(1000) }); if (r.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert(ready, 'Local application did not start');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Bangkok' });
  // The browser may communicate only with the disposable local app and Supabase.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' && ['3100', '54321'].includes(url.port) ? route.continue() : route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto('http://127.0.0.1:3100/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await page.waitForURL('**/admin');
  async function openExpenses() {
    await page.getByRole('button', { name: /ERP/ }).filter({ visible: true }).first().click();
    await page.getByRole('button', { name: /ค่าใช้จ่าย/ }).filter({ visible: true }).first().click();
    await page.getByRole('heading', { name: 'ค่าใช้จ่ายจริง', exact: true }).waitFor();
  }
  await openExpenses();
  const description = 'Synthetic rent browser ' + randomUUID();
  await page.getByRole('button', { name: 'เพิ่มค่าใช้จ่าย', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'เพิ่มค่าใช้จ่าย', exact: true });
  await dialog.waitFor();
  const select = (scope, label) => scope.locator('label').filter({ hasText: new RegExp('^' + label) }).locator('select');
  await select(dialog, 'หมวด').selectOption('44444444-4444-4444-8444-444444444444');
  await dialog.getByLabel('รายละเอียด', { exact: true }).fill(description);
  await dialog.getByLabel('ยอดก่อน VAT', { exact: true }).fill('12000');
  await select(dialog, 'สถานะชำระ').selectOption('paid');
  await dialog.getByLabel('วันที่ชำระ', { exact: true }).fill('2026-09-09');
  for (const label of ['Supplier', 'ลูกค้า', 'เอกสาร']) assert.equal(await select(dialog, label).inputValue(), '');
  await dialog.locator('input[type=file]').setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% Synthetic only\n%%EOF\n') });
  const upload = page.waitForResponse(r => r.url().includes('/attachments') && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
  assert.equal((await upload).status(), 201, 'Application evidence upload failed');
  await dialog.waitFor({ state: 'hidden' });
  await page.reload();
  await openExpenses();
  const row = page.locator('.expense-table tbody tr').filter({ hasText: description });
  await row.waitFor();
  const stored = JSON.parse(sql(`select row_to_json(e) from public.erp_expenses e where description='${description}';`).trim());
  const evidence = JSON.parse(sql(`select row_to_json(a) from public.erp_expense_attachments a where expense_id='${stored.id}';`).trim());
  const evidencePath = `/api/admin/expenses/${stored.id}/attachments/${evidence.id}`;
  const signed = await context.request.get('http://127.0.0.1:3100' + evidencePath);
  assert.equal(signed.status(), 200);
  const signedBody = await signed.json();
  assert.equal(new URL(signedBody.url).origin, local.API_URL);
  assert.equal(signedBody.expiresIn, 300);
  const downloaded = await fetch(signedBody.url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert(downloaded.ok);
  assert.equal(await downloaded.text(), '%PDF-1.4\n% Synthetic only\n%%EOF\n');
  const denied = await fetch('http://127.0.0.1:3100' + evidencePath, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.equal(denied.status, 401);
  await row.getByTitle('แก้ไข', { exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'แก้ไขค่าใช้จ่าย', exact: true });
  assert.equal(await edit.getByLabel('วันที่ชำระ', { exact: true }).inputValue(), '2026-09-09');
  await edit.getByText('synthetic.pdf', { exact: true }).waitFor();
  await edit.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await edit.waitFor({ state: 'hidden' });
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? 'Synthetic cancellation' : undefined));
  await row.getByTitle('เก็บถาวร', { exact: true }).click();
  await row.waitFor({ state: 'hidden' });
  await page.getByLabel('กรองสถานะรายการ', { exact: true }).selectOption('archived');
  await row.getByTitle('นำกลับมาใช้', { exact: true }).click();
  await row.waitFor({ state: 'hidden' });
  await page.getByLabel('กรองสถานะรายการ', { exact: true }).selectOption('active');
  await row.getByTitle('ยกเลิกรายการ', { exact: true }).click();
  await row.waitFor({ state: 'hidden' });
  await page.getByLabel('กรองสถานะรายการ', { exact: true }).selectOption('voided');
  await row.waitFor();
  const persisted = JSON.parse(sql(`select row_to_json(e) from public.erp_expenses e where description='${description}';`).trim());
  assert.equal(persisted.source_document_id, null);
  assert.equal(persisted.customer_id, null);
  assert.equal(persisted.supplier_id, null);
  assert(persisted.voided_at);
  assert.equal(persisted.paid_at.slice(0, 10), '2026-09-08');
  await row.getByTitle('ประวัติการแก้ไข', { exact: true }).click();
  const history = page.getByRole('dialog', { name: /^ประวัติค่าใช้จ่าย / });
  for (const label of ['สร้างรายการ', 'แนบหลักฐาน', 'เก็บถาวร', 'นำกลับมาใช้', 'ยกเลิกรายการ']) {
    await history.getByText(label, { exact: true }).waitFor();
  }
  await history.getByRole('button', { name: 'ปิดประวัติ', exact: true }).click();
  await page.getByLabel('กรองสถานะรายการ', { exact: true }).selectOption('active');
  await page.getByRole('button', { name: 'หมวดค่าใช้จ่าย', exact: true }).click();
  const categories = page.getByRole('dialog', { name: 'จัดการหมวดค่าใช้จ่าย', exact: true });
  await categories.getByLabel('รหัสหมวด', { exact: true }).fill('BROWSER_ADS');
  await categories.getByLabel('ชื่อหมวด', { exact: true }).fill('Synthetic advertising');
  await categories.getByLabel('ประเภทเริ่มต้น', { exact: true }).selectOption('operating');
  await categories.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
  await categories.getByText('Synthetic advertising', { exact: true }).waitFor();
  await categories.getByTitle('ปิด', { exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'เพิ่มค่าใช้จ่าย', exact: true }).click();
  await dialog.waitFor();
  await select(dialog, 'หมวด').selectOption({ label: 'Synthetic advertising' });
  const adsDescription = 'Synthetic advertising browser ' + randomUUID();
  await dialog.getByLabel('รายละเอียด', { exact: true }).fill(adsDescription);
  await dialog.getByLabel('ยอดก่อน VAT', { exact: true }).fill('2500');
  await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.locator('.expense-table tbody tr').filter({ hasText: adsDescription }).waitFor();
  const ads = JSON.parse(sql(`select row_to_json(e) from public.erp_expenses e where description='${adsDescription}';`).trim());
  assert.equal(ads.source_document_id, null);
  assert.equal(ads.payment_status, 'unpaid');
  assert.equal(Number(ads.amount), 2500);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.locator('.expense-page').isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile page overflows horizontally');
  console.log('PASS real browser: owner login, separate expenses, rent, advertising on mobile, category creation, no receipt link, upload/sign/download API, anonymous denial, reload, Bangkok payment date, edit, archive/restore/void, audit history, mobile bounds');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n## Browser contract acceptance\nPASS: owner login, separate expense page, independent rent, application attachment upload, reload/edit/payment date, archive/restore/void, mobile bounds, build and privileged bundle scan.\nProduction schema equivalence and production deployment remain NOT EXECUTED.\n');
} catch (error) {
  if (page) console.log('Synthetic browser visible state: ' + (await page.locator('body').innerText()).slice(-8000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await new Promise(resolve => { if (server.exitCode !== null) resolve(); else { server.once('exit', resolve); setTimeout(() => server.kill('SIGKILL'), 5000).unref(); } });
}
