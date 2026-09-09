import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';

// Deliberately no URL, password, production key or remote target parameter.
assert.equal(process.env.GITHUB_ACTIONS, 'true');
assert.equal(process.env.RUNNER_ENVIRONMENT, 'github-hosted');
const container = 'supabase_db_expense-supabase';
const info = JSON.parse(execFileSync('docker', ['inspect', container], { encoding: 'utf8' }))[0];
assert.equal(info.Name, '/' + container);
assert.equal(info.State.Running, true);
const root = new URL('./', import.meta.url);
const owner = '11111111-1111-4111-8111-111111111111';
const nonadmin = '22222222-2222-4222-8222-222222222222';
const inactive = '33333333-3333-4333-8333-333333333333';
const category = '44444444-4444-4444-8444-444444444444';
const quote = v => "'" + String(v).replaceAll("'", "''") + "'";
const results = [];
function session(input, options = {}) {
  const child = spawn('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '', err = '';
  const timer = setTimeout(() => child.kill(), 45000);
  const done = new Promise((resolve, reject) => {
    child.stdout.on('data', data => { out += data; options.onData?.(out); });
    child.stderr.on('data', data => { err += data; });
    child.on('error', reject);
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(out.trim()) : reject(new Error(err || `psql exited ${code}`)); });
  });
  if (options.open) child.stdin.write(input); else child.stdin.end(input);
  return { child, done };
}
const sql = input => session("set statement_timeout='30s'; set lock_timeout='20s';\n" + input).done;
const lastJson = output => JSON.parse(output.trim().split('\n').at(-1));
const auth = (id = owner, role = 'authenticated') => `begin; set local application_name='expense-isolated'; select set_config('request.jwt.claim.sub', ${quote(id)}, true); select set_config('request.jwt.claims', ${quote(JSON.stringify({ sub: id || undefined, role }))}, true); set local role ${role};`;
const payload = (extra = {}) => ({ id: null, expense_date: '2026-09-08', category_id: category, expense_class: 'operating', description: 'Synthetic rent', amount: '1000.00', vat_amount: '70.00', total_amount: '1070.00', withholding_amount: '30.00', payment_status: 'unpaid', paid_at: null, source_document_id: null, supplier_id: null, customer_id: null, archived: false, ...extra });
const rpc = (p, rev = 0, request = randomUUID()) => `select public.save_erp_expense_v1(${quote(JSON.stringify(p))}::jsonb, ${rev}, '${request}'::uuid);`;
const save = async (p, rev = 0, req = randomUUID()) => lastJson(await sql(auth() + rpc(p, rev, req) + 'commit;'));
async function test(name, fn) {
  try { await fn(); results.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
  catch (e) { results.push({ name, status: 'FAIL', error: e.message }); console.log('FAIL ' + name + ': ' + e.message); }
}
async function concurrent(commands) {
  let ready;
  const gateReady = new Promise(resolve => { ready = resolve; });
  const gate = session("begin; select pg_advisory_lock(7132026); select 'GATE_READY';\n", { open: true, onData: out => { if (out.includes('GATE_READY')) ready(); } });
  const gateTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('gate timeout')), 10000).unref());
  await Promise.race([gateReady, gateTimeout]);
  const workers = commands.map(command => session(auth() + "select pg_advisory_xact_lock_shared(7132026);" + command + 'commit;'));
  const settled = Promise.allSettled(workers.map(w => w.done));
  let waiting = 0;
  try {
    for (let i = 0; i < 50; i++) {
      waiting = Number(await sql("select count(distinct pid) from pg_stat_activity where application_name='expense-isolated' and wait_event='advisory';"));
      if (waiting === workers.length) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(waiting, workers.length, 'All independent DB sessions must overlap at the barrier');
  } finally { gate.child.stdin.end('select pg_advisory_unlock(7132026); commit;\n'); await gate.done; }
  console.log(`Observed ${waiting} independent concurrent DB sessions`);
  return settled;
}

const candidate = readFileSync(new URL('candidate.sql', root), 'utf8');
console.log('Candidate SHA256 ' + createHash('sha256').update(candidate).digest('hex'));
await sql(readFileSync(new URL('fixture.sql', root), 'utf8'));
await sql(readFileSync(new URL('../../supabase/batch-1a-admin-membership.sql', root), 'utf8'));
// Reproduce the observed postgres public sequence default ACL from production metadata.
await sql('alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;');
await sql('begin;\n' + candidate + '\ncommit;');
console.log('PASS migration on synthetic dependency contract (NOT production-equivalence acceptance)');
await sql(`insert into auth.users(id,email) values ('${owner}','owner@example.invalid'),('${nonadmin}','reader@example.invalid'),('${inactive}','inactive@example.invalid');
insert into public.admin_users(user_id,email,role,active) values ('${owner}','owner@example.invalid','owner',true),('${inactive}','inactive@example.invalid','admin',false);
insert into public.erp_expense_categories(id,code,name,default_expense_class) values ('${category}','RENT','Synthetic rent','operating');`);

await test('existing SQL integration suite', async () => {
  const suite = readFileSync(new URL('existing-suite.sql', root), 'utf8');
  const result = await sql(`begin; set local app.batch_3_owner_id='${owner}'; set local app.batch_3_nonadmin_id='${nonadmin}';\n${suite}\nrollback;`);
  assert.equal(lastJson(result).fixtures_rolled_back, true);
});
await test('independent expense, exact money and no document link', async () => {
  const r = await save(payload());
  assert.equal(r.expense.total_amount, 1070);
  assert.equal(r.expense.withholding_amount, 30);
  assert.equal(r.expense.source_document_id, null);
  assert.equal(r.expense.customer_id, null);
  assert.equal(r.expense.supplier_id, null);
});
await test('eight concurrent creates and unique numbers', async () => {
  const rs = await concurrent(Array.from({ length: 8 }, (_, i) => rpc(payload({ description: `Synthetic concurrent ${i}` }))));
  assert(rs.every(r => r.status === 'fulfilled'));
  const values = rs.map(r => lastJson(r.value));
  assert.equal(new Set(values.map(r => r.expense_id)).size, 8);
  assert.equal(new Set(values.map(r => r.expense_no)).size, 8);
});
await test('concurrent identical retry creates once', async () => {
  const req = randomUUID();
  const rs = await concurrent([rpc(payload(), 0, req), rpc(payload(), 0, req)]);
  assert(rs.every(r => r.status === 'fulfilled'));
  const [a, b] = rs.map(r => lastJson(r.value));
  assert.equal(a.expense_id, b.expense_id);
  assert.notEqual(a.idempotent_replay, b.idempotent_replay);
  assert.equal(Number(await sql(`select count(*) from public.erp_expense_events where expense_id='${a.expense_id}' and event_type='created';`)), 1);
});
await test('concurrent revision conflict has exactly one winner', async () => {
  const saved = await save(payload());
  const rs = await concurrent(['A', 'B'].map(s => rpc(payload({ id: saved.expense_id, description: 'Synthetic ' + s }), 1)));
  assert.equal(rs.filter(r => r.status === 'fulfilled').length, 1);
  assert.match(rs.find(r => r.status === 'rejected').reason.message, /REVISION_CONFLICT/);
  assert.equal(Number(await sql(`select revision from public.erp_expenses where id='${saved.expense_id}';`)), 2);
});
await test('anon, nonadmin, inactive and missing-subject RPC denied', async () => {
  for (const [id, role] of [['', 'anon'], [nonadmin, 'authenticated'], [inactive, 'authenticated'], ['', 'authenticated']]) {
    await assert.rejects(sql(auth(id, role) + rpc(payload()) + 'commit;'), /permission denied|ADMIN_REQUIRED/);
  }
});
await test('nonadmin RLS reads empty and direct owner writes denied', async () => {
  const r = lastJson(await sql(auth(nonadmin) + "select json_build_object('n',count(*)) from public.erp_expenses; rollback;"));
  assert.equal(r.n, 0);
  await assert.rejects(sql(auth() + 'delete from public.erp_expenses; commit;'), /permission denied/);
  await assert.rejects(sql(auth() + 'update public.erp_expense_number_counters set last_value=0; commit;'), /permission denied/);
});
await test('expense audit sequence cannot be changed by client roles', async () => {
  for (const [id, role] of [['', 'anon'], [owner, 'authenticated'], [nonadmin, 'authenticated']]) {
    await assert.rejects(sql(auth(id, role) + "select setval('public.erp_expense_events_id_seq',1); rollback;"), /permission denied/);
  }
});

await test('real Storage HTTP upload, registration, private access and signed download', async () => {
  const local = JSON.parse(execFileSync('npx', ['--yes', 'supabase@2.116.0', 'status', '--workdir', process.env.RUNNER_TEMP + '/expense-supabase', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  assert.equal(local.API_URL, 'http://127.0.0.1:54321');
  assert(local.ANON_KEY && local.SERVICE_ROLE_KEY);
  const base = local.API_URL;
  async function request(path, token, method = 'GET', body, contentType = 'application/json') {
    assert(path.startsWith('/') && !path.startsWith('//'));
    return fetch(base + path, { method, redirect: 'error', signal: AbortSignal.timeout(15000), headers: { apikey: local.ANON_KEY, Authorization: 'Bearer ' + token, 'Content-Type': contentType }, body: body === undefined ? undefined : contentType === 'application/json' ? JSON.stringify(body) : body });
  }
  async function login(id) {
    const password = randomUUID() + 'aA!9';
    const updated = await request('/auth/v1/admin/users/' + id, local.SERVICE_ROLE_KEY, 'PUT', { password, email_confirm: true });
    assert(updated.ok, 'Synthetic auth user setup failed: ' + updated.status);
    const email = id === owner ? 'owner@example.invalid' : 'reader@example.invalid';
    const signed = await request('/auth/v1/token?grant_type=password', local.ANON_KEY, 'POST', { email, password });
    assert(signed.ok, 'Synthetic login failed: ' + signed.status);
    const data = await signed.json();
    assert(data.access_token);
    return data.access_token;
  }
  const token = await login(owner);
  const reader = await login(nonadmin);
  await sql("notify pgrst, 'reload schema';");
  const expense = await save(payload());
  const id = randomUUID();
  const path = `expenses/${expense.expense_id}/${id}.pdf`;
  const objectPath = '/storage/v1/object/erp-expense-evidence/' + path;
  const bytes = Buffer.from('%PDF-1.4\n% Synthetic expense evidence only\n%%EOF\n');
  const deniedUpload = await request(objectPath, reader, 'POST', bytes, 'application/pdf');
  assert(!deniedUpload.ok, 'Nonadmin upload allowed');
  const uploaded = await request(objectPath, token, 'POST', bytes, 'application/pdf');
  assert(uploaded.ok, 'Owner upload failed: ' + uploaded.status);
  const register = await request('/rest/v1/rpc/register_erp_expense_attachment_v1', token, 'POST', { p_expense_id: expense.expense_id, p_attachment_id: id, p_storage_path: path, p_original_filename: 'synthetic.pdf', p_mime_type: 'application/pdf', p_size_bytes: bytes.length });
  assert(register.ok, 'Attachment registration failed: ' + register.status);
  assert.equal((await register.json()).id, id);
  for (const forbidden of [local.ANON_KEY, reader]) {
    const download = await request(objectPath, forbidden);
    assert(!download.ok, 'Private download allowed');
    const sign = await request('/storage/v1/object/sign/erp-expense-evidence/' + path, forbidden, 'POST', { expiresIn: 60 });
    assert(!sign.ok, 'Private signing allowed');
  }
  const signed = await request('/storage/v1/object/sign/erp-expense-evidence/' + path, token, 'POST', { expiresIn: 60 });
  assert(signed.ok, 'Owner signing failed: ' + signed.status);
  const signedPath = (await signed.json()).signedURL;
  assert(typeof signedPath === 'string' && signedPath.startsWith('/object/sign/'));
  const download = await request('/storage/v1' + signedPath, local.ANON_KEY);
  assert(download.ok, 'Signed download failed: ' + download.status);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
  const publicRead = await request('/storage/v1/object/public/erp-expense-evidence/' + path, local.ANON_KEY);
  assert(!publicRead.ok, 'Evidence is publicly readable');
  // Exact synthetic object only; its disposable Auth/SQL fixtures disappear with the runner.
  const removed = await request('/storage/v1/object/erp-expense-evidence', local.SERVICE_ROLE_KEY, 'DELETE', { prefixes: [path] });
  assert(removed.ok, 'Synthetic object cleanup failed');
});
await test('invalid money rolls back request and number allocation', async () => {
  const before = await sql('select json_build_array((select count(*) from public.erp_expenses),(select count(*) from public.erp_expense_save_requests),(select sum(last_value) from public.erp_expense_number_counters));');
  await assert.rejects(save(payload({ amount: '10.001' })), /INVALID_EXPENSE_PAYLOAD/);
  await assert.rejects(save(payload({ total_amount: '999.00' })), /INVALID_EXPENSE_AMOUNT/);
  assert.equal(await sql('select json_build_array((select count(*) from public.erp_expenses),(select count(*) from public.erp_expense_save_requests),(select sum(last_value) from public.erp_expense_number_counters));'), before);
});
await test('audit insertion failure rolls back whole save', async () => {
  const before = await sql('select json_build_array((select count(*) from public.erp_expenses),(select count(*) from public.erp_expense_save_requests),(select sum(last_value) from public.erp_expense_number_counters));');
  await sql("create function private.expense_test_fail() returns trigger language plpgsql as $$ begin raise exception 'SYNTHETIC_AUDIT_FAILURE'; end $$; create trigger expense_test_fail before insert on public.erp_expense_events for each row execute function private.expense_test_fail();");
  try { await assert.rejects(save(payload()), /SYNTHETIC_AUDIT_FAILURE/); }
  finally { await sql('drop trigger expense_test_fail on public.erp_expense_events; drop function private.expense_test_fail();'); }
  assert.equal(await sql('select json_build_array((select count(*) from public.erp_expenses),(select count(*) from public.erp_expense_save_requests),(select sum(last_value) from public.erp_expense_number_counters));'), before);
});
await test('private storage bucket and nonadmin upload denied', async () => {
  assert.equal(await sql("select public from storage.buckets where id='erp-expense-evidence';"), 'f');
  const r = await save(payload());
  const name = `expenses/${r.expense_id}/${randomUUID()}.pdf`;
  await assert.rejects(sql(auth(nonadmin) + `insert into storage.objects(bucket_id,name) values ('erp-expense-evidence',${quote(name)}); commit;`), /row-level security|permission denied/);
  // Policy test only: no real file upload or signed-URL acceptance is claimed.
  await sql(auth() + `insert into storage.objects(bucket_id,name) values ('erp-expense-evidence',${quote(name)}); rollback;`);
});
await test('numbering boundary 9999 to 10000 retains all digits', async () => {
  const year = Number(await sql("select extract(year from timezone('Asia/Bangkok', now()))::integer+543;"));
  await sql(`update public.erp_expense_number_counters set last_value=9998 where buddhist_year=${year};`);
  const a = await save(payload()); const b = await save(payload());
  const c = await save(payload());
  assert.equal(a.expense_no, `EXP${year}-9999`);
  assert.equal(b.expense_no, `EXP${year}-10000`);
  assert.equal(c.expense_no, `EXP${year}-10001`);
});

const summary = '## Expense isolated SQL results\n\nSynthetic FK contract + actual Batch 1A membership and expense candidate. Not a production baseline clone.\n\n' + results.map(r => `- ${r.status}: ${r.name}${r.error ? ': ' + r.error.replaceAll('\n', ' ') : ''}`).join('\n') + '\n\nNOT EXECUTED: production baseline equivalence, real Storage HTTP upload/signed URLs, browser acceptance, production migrations/deployment.\n';
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
if (results.some(r => r.status !== 'PASS')) process.exitCode = 1;
