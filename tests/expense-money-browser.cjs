const assert = require('node:assert/strict');
const http = require('node:http');
const { build } = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

// Exercise the real editor and save helper without writing financial records.
(async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import ExpensePage from './src/app/admin/expenses/ExpensePage';createRoot(document.getElementById('root')).render(<ExpensePage customers={[]} suppliers={[]} documents={[]} showToast={message=>document.getElementById('toast').textContent=message}/>);`, loader: 'tsx', resolveDir: process.cwd() },
    bundle: true, write: false, outfile: 'expense.js', jsx: 'automatic',
    plugins: [{ name: 'synthetic-expense-backend', setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/supabase-browser$/ }, () => ({ path: 'backend', namespace: 'mock' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `const client={from(table){const result={data:table==='erp_expense_categories'?[{id:'11111111-1111-4111-8111-111111111111',name:'QA category',active:true}]:[],count:table==='erp_expense_categories'?1:0,error:null};const query={select(){return query},order(){return query},eq(){return query},then(resolve,reject){return Promise.resolve(result).then(resolve,reject)}};return query},async rpc(name,args){window.savedCalls.push({name,args});const expense={...args.p_expense,id:'22222222-2222-4222-8222-222222222222',expense_no:'QA-ONLY',revision:1,updated_at:new Date().toISOString()};return {error:null,data:{expense_id:expense.id,expense_no:expense.expense_no,revision:1,updated_at:expense.updated_at,expense,idempotent_replay:false}}}};window.savedCalls=[];export const getSupabaseBrowserClient=()=>client;`, loader: 'js' }));
    }}],
  });
  const server = http.createServer((req, res) => {
    if (req.url === '/expense.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle.outputFiles[0].text); }
    res.end('<!doctype html><meta charset="utf-8"><div id="toast" role="status"></div><div id="root"></div><script src="/expense.js"></script>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: 'เพิ่มค่าใช้จ่าย', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^หมวด/).selectOption('11111111-1111-4111-8111-111111111111');
    await dialog.getByLabel('รายละเอียด', { exact: true }).fill('QA grouped amount');
    await dialog.getByLabel('วันที่', { exact: true }).fill('2026-10-14');
    await dialog.getByLabel('ยอดก่อน VAT', { exact: true }).fill('17,45.25');
    await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'ยอดก่อน VAT ต้องเป็น' }).waitFor();
    assert.equal(await page.evaluate(() => window.savedCalls.length), 0);
    await dialog.getByLabel('ยอดก่อน VAT', { exact: true }).fill('17,453.25');
    assert.equal(await dialog.locator('.expense-total strong').textContent(), '฿17,453.25');
    await dialog.getByLabel(/^สถานะชำระ/).selectOption('paid');
    await dialog.getByLabel('วันที่ชำระ', { exact: true }).fill('2026-10-14');
    await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    const calls = await page.evaluate(() => window.savedCalls);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'save_erp_expense_v1');
    assert.equal(calls[0].args.p_expense.amount, '17453.25');
    assert.equal(calls[0].args.p_expense.total_amount, '17453.25');
    assert.equal(calls[0].args.p_expense.payment_status, 'paid');
    assert.deepEqual(errors, []);
    console.log('PASS: real expense editor rejects malformed grouping, previews grouped money, and saves exact decimal amount once. No production writes.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
