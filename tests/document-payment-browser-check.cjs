const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const ts = require('typescript');
const { build } = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const source = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  const ast = ts.createSourceFile('admin.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const helpers = new Set(['docDepositInfo', 'resolveDepositInfo', 'calcDocTotal']);
  const declarations = ast.statements.filter(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && helpers.has(d.name.text)));
  let change;
  const form = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'DocForm');
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'onChange' && node.initializer?.getText(ast).includes('depositPaid: value, paymentAmount: value')) change = node.initializer.expression.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(form);
  assert(change, 'Use the actual deposit input handler');
  const result = await build({ stdin: { contents: `
    import React, {useState} from 'react'; import {createRoot} from 'react-dom/client';
    const lineAmount = i => i.qty * i.price; const docVatRate = () => 7;
    ${declarations.map(n => n.getText(ast)).join('\n')}
    const base = {items:[{qty:1,price:17964}],wht:true,whtRate:3,vat:false,paymentAmount:8712.54,depositPaid:0,notes:''};
    function Fixture(){
      const [f,setF]=useState({...base,paymentAmount:docDepositInfo(base).depositPaid,depositPaid:docDepositInfo(base).depositPaid});
      const totals=calcDocTotal(f,[]);
      return <><input aria-label="Received deposit" value={f.depositPaid} onChange={${change}} />
        <textarea aria-label="Conditions" value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))}/>
        <output data-testid="received">{totals.depositPaid.toFixed(2)}</output>
        <output data-testid="balance">{totals.balanceDue.toFixed(2)}</output>
        <button onClick={()=>window.saved=f}>Save</button></>;
    } createRoot(document.getElementById('root')).render(<Fixture/>);
  `, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic' });
  const server = http.createServer((req, res) => {
    if (req.url === '/test.js') { res.setHeader('Content-Type','text/javascript'); res.end(result.outputFiles[0].text); }
    else res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/test.js"></script>');
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const input = page.getByLabel('Received deposit');
    assert.equal(await input.inputValue(), '8712.54');
    await input.fill('0');
    await page.getByLabel('Conditions').fill('ชำระเงินมัดจำ 50% ก่อนเริ่มดำเนินการผลิต');
    assert.equal(await page.getByTestId('received').textContent(), '0.00');
    assert.equal(await page.getByTestId('balance').textContent(), '17425.08');
    await page.getByRole('button',{name:'Save'}).click();
    const saved = await page.evaluate(()=>window.saved);
    assert.equal(saved.paymentAmount,0); assert.equal(saved.depositPaid,0);
    console.log(JSON.stringify({syntheticOnly:true,actualInputHandler:true,zeroSaved:true,notesDoNotChangeBalance:true,balance:17425.08}));
  } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
