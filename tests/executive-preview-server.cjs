const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('esbuild');
const fixtures = require('./executive-fixtures.cjs');
const out = path.resolve('output/executive-preview');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/rest/v1/')) {
    if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
    let rows = url.pathname.endsWith('erp_expense_categories') ? fixtures.categories.filter(row=>(url.searchParams.get('id')||'').includes(row.id)) : fixtures.expenses;
    for (const filter of url.searchParams.getAll('expense_date')) {
      if (filter.startsWith('gte.')) rows = rows.filter(row => row.expense_date >= filter.slice(4));
      if (filter.startsWith('lte.')) rows = rows.filter(row => row.expense_date <= filter.slice(4));
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Range', rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0');
    return res.end(JSON.stringify(rows));
  }
  if(url.pathname==='/images/logo.png'){res.setHeader('Content-Type','image/png');return res.end(fs.readFileSync('public/images/logo.png'));}
  if(url.pathname==='/images/erp-dashboard-facade.png'){res.setHeader('Content-Type','image/png');return res.end(fs.readFileSync('public/images/erp-dashboard-facade.png'));}
  if(url.pathname==='/shell.css'){res.setHeader('Content-Type','text/css');return res.end(fs.readFileSync('tests/executive-shell.css'));}
  if (['/preview.js', '/preview.css'].includes(url.pathname)) {
    res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript');
    return res.end(fs.readFileSync(path.join(out, url.pathname.slice(1))));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/preview.css"><link rel="stylesheet" href="/shell.css"><div id="root"></div><script src="/preview.js"></script>');
});
server.listen(0, '127.0.0.1', async () => {
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    await build({ entryPoints: [path.resolve('tests/executive-preview.tsx')], outfile: path.join(out, 'preview.js'), bundle: true, jsx: 'automatic', external: ['/images/*'], define: { 'process.env.NODE_ENV': '"test"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(url), 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"synthetic-only"' } });
    console.log(url);
  } catch (error) { console.error(error); server.close(); process.exitCode = 1; }
});
