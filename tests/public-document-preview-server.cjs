const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('esbuild');
const { renderToStaticMarkup } = require('react-dom/server');
const out = path.resolve('output/playwright/document-matrix');
fs.mkdirSync(out, { recursive: true });
const queries = [];
const types = ['quote', 'bill', 'invoice', 'receipt'];
const forbidden = /cost|supplier|profit|margin|internal_expenses/i;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname.startsWith('/rest/v1/')) {
    const fields = url.searchParams.get('select') || '';
    queries.push({ table: url.pathname.split('/').pop(), fields });
    if (fields === '*' || forbidden.test(fields)) { res.writeHead(400); return res.end('{"message":"Internal fields requested"}'); }
    const table = url.pathname.split('/').pop();
    const id = (url.searchParams.get('id') || url.searchParams.get('document_id') || '').replace(/^eq\./, '');
    const type = types.find(value => id.startsWith(value)) || 'quote';
    let rows;
    if (table === 'erp_documents') rows = [{ id, type, doc_no: `QA-${type}`, customer_name: 'QA Customer', date: '2026-10-05', due_date: '2026-10-15', notes: 'Customer note\ncost_snapshot PRIVATE_SENTINEL\nต้นทุน PRIVATE_THAI_SENTINEL', payment_note: 'unit_cost PRIVATE_PAYMENT', deposit_note: 'internal_expenses PRIVATE_DEPOSIT', discount: 0, vat: true, vat_rate: 7 }];
    else if (table === 'erp_document_items') rows = Array.from({length:id.endsWith('-long')?75:2}, (_,i)=>({ id:`item-${i}`, name:`QA Item ${i+1}`, sub_title:'supplier PRIVATE_SUPPLIER', detail:'Customer detail\nprofit PRIVATE_PROFIT\ncost_price PRIVATE_COST_PRICE', unit:'piece', qty:1, price:100, sort_order:i }));
    else if (table === 'erp_company') rows = [{ name:'QA Display Works', address:'QA Company Address', phone:'QA Phone', email:'qa@example.invalid' }];
    else rows = [];
    res.setHeader('Content-Type','application/json');
    return res.end(JSON.stringify(req.headers.accept?.includes('vnd.pgrst.object') ? rows[0] || null : rows));
  }
  if (url.pathname === '/images/logo.png') { res.setHeader('Content-Type','image/png'); return res.end(fs.readFileSync('public/images/logo.png')); }
  if (url.pathname === '/document.css') { res.setHeader('Content-Type','text/css'); return res.end(fs.readFileSync('src/app/doc/[id]/document.css')); }
  if (url.pathname === '/actions.js') { res.setHeader('Content-Type','text/javascript'); return res.end(fs.readFileSync(path.join(out,'actions.js'))); }
  if (url.pathname === '/audit') { res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify({queries})); }
  const match = /^\/doc\/(quote|bill|invoice|receipt)(-long)?$/.exec(url.pathname);
  if (!match) { res.writeHead(404); return res.end('Not found'); }
  try {
    const page = require(path.join(out,'page.cjs'));
    const html = renderToStaticMarkup(await page.default({params:Promise.resolve({id:match[1]+(match[2]||'')})}));
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/document.css">${html}<script src="/actions.js"></script>`);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
server.listen(0,'127.0.0.1',async()=>{
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = base;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-fixture-only';
  try {
    await build({entryPoints:['tests/public-document-actions-preview.tsx'],outfile:path.join(out,'actions.js'),bundle:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"test"'}});
    await build({entryPoints:['src/app/doc/[id]/page.tsx'],outfile:path.join(out,'page.cjs'),bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom'],loader:{'.css':'empty'},plugins:[{
      name:'fixture-server-boundaries',setup(builder){
        builder.onResolve({filter:/^(server-only|next\/navigation)$/},args=>({path:args.path,namespace:'fixture'}));
        builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='server-only'?'':'export function notFound(){throw new Error("Not found");}',loader:'js'}));
      }
    }]});
    console.log(base);
  } catch(error){console.error(error);server.close();process.exitCode=1;}
});
