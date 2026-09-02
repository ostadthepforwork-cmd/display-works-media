// Run: node --env-file=.env.local scripts/verify-batch-1a-public.mjs
// Only anonymous Data API requests; never prints keys or returned business rows.
import assert from 'node:assert/strict';

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.equal(base, 'https://qlxxqrpsyjdsiyjnabjb.supabase.co');
assert.ok(key, 'Public anon key required');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const results = [];
async function request(path, options = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(20000),
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

for (const table of ['erp_customers','erp_products','erp_documents','erp_document_items','erp_suppliers','erp_company']) {
  const read = await request(`${table}?select=id&limit=1`);
  assert.ok([401,403].includes(read.response.status), `${table}: anonymous SELECT should be denied`);
  // A nonexistent UUID guarantees PATCH cannot modify any row even on regression.
  const write = await request(`${table}?id=eq.00000000-0000-0000-0000-000000000000`, {
    method: 'PATCH', body: JSON.stringify(table === 'erp_documents' ? { notes: 'batch-1a-denied-probe' } : { name: 'batch-1a-denied-probe' }),
  });
  assert.ok([401,403].includes(write.response.status), `${table}: anonymous UPDATE should be denied`);
  results.push({ table, anonymousRead: read.response.status, anonymousWrite: write.response.status });
}
for (const [table,filter,payload] of [
  ['posts','id=eq.batch-1a-nonexistent-probe',{title:'batch-1a-denied-probe'}],
  ['cms_settings','key=eq.batch-1a-nonexistent-probe',{value:{}}],
]) {
  const write = await request(`${table}?${filter}`, {method:'PATCH',body:JSON.stringify(payload)});
  assert.ok([401,403].includes(write.response.status), `${table}: anonymous UPDATE should be denied`);
  results.push({table,anonymousWrite:write.response.status});
}
const member = await request('admin_users?select=user_id&limit=1');
assert.ok([401,403].includes(member.response.status), 'Membership must not be public');
const posts = await request('posts?select=slug,published&limit=1000');
assert.equal(posts.response.status,200);
assert.ok(Array.isArray(posts.body) && posts.body.length>0);
assert.ok(posts.body.every(row=>row.published===true),'Unpublished post exposed');
const settings = await request('cms_settings?select=key');
assert.equal(settings.response.status,200);
assert.ok(Array.isArray(settings.body) && settings.body.length>0);
console.log(JSON.stringify({results,membership:member.response.status,
  publicPosts:posts.body.length,publicSettings:settings.body.length,
  signedInIdentities:'NOT TESTED: real sessions required'},null,2));

for (const origin of ['http://127.0.0.1:3000','https://displayworksmedia.com']) {
  // Invalid input exits validation before database writes or notifications.
  const quote = await fetch(`${origin}/api/quote`,{method:'POST',
    headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(20000)});
  assert.equal(quote.status,400,`${origin}: quote validation endpoint`);
  console.log(JSON.stringify({origin,quoteValidation:quote.status,notificationsSent:false}));
}
for (const path of ['/api/admin/session','/api/marketing/ga4','/api/marketing/meta','/api/marketing/ai-crawlers','/api/marketing/ai-citations']) {
  const response = await fetch(`http://127.0.0.1:3000${path}`,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,401,`${path}: anonymous must be denied`);
  console.log(JSON.stringify({path,anonymousStatus:response.status}));
}
