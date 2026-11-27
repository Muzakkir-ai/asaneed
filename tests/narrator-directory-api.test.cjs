const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('next/dist/build/swc');
const {createClient} = require('@supabase/supabase-js');

async function main() {
 await swc.loadBindings();
 const cache = new Map();
 const aliases = {'zitejs/backend': 'legacy/compat/backend.ts'};
 let client, endpoints;
 const stubs = {
  'lib/supabase/server.ts': {createClient: async () => client},
  'lib/issuance-target.ts': {issuanceTargetScope: async (_client, scope) => scope},
  'legacy/compat/endpoints.ts': {get endpoints() { return endpoints; }},
 };

 function load(filename) {
  if (stubs[filename]) return stubs[filename];
  if (cache.has(filename)) return cache.get(filename).exports;
  const fullPath = path.resolve(filename);
  const entry = new Module(fullPath, module);
  entry.paths = module.paths;
  cache.set(filename, entry);
  entry.require = id => {
   if (aliases[id]) return load(aliases[id]);
   if (id.startsWith('.')) {
    const target = path.relative(process.cwd(), path.resolve(path.dirname(fullPath), id));
    if (fs.existsSync(target + '.ts')) return load(target + '.ts');
    if (fs.existsSync(target)) return require(path.resolve(target));
   }
   return require(id);
  };
  entry._compile(swc.transformSync(fs.readFileSync(fullPath, 'utf8'), {
   filename: fullPath, jsc: {parser: {syntax: 'typescript'}}, module: {type: 'commonjs'},
  }).code, fullPath);
  return entry.exports;
 }

 endpoints = {narratorDirectory: load('legacy/api/narratorDirectory.ts').default};
 const {POST} = load('app/api/workspace/[endpoint]/route.ts');
 let role = 'admin', active = true, signedIn = true, ranges = [];
 const db = createClient('https://fixture.invalid', 'fixture-key', {
  auth: {persistSession: false},
  global: {fetch: async (url, options) => {
   url = new URL(url);
   assert.equal(options.method, 'GET');
   if (url.pathname.endsWith('/accounts')) {
    return Response.json({id: 'fixture-account', display_name: 'Fixture staff', active, role, can_issue: false});
   }
   if (url.pathname.endsWith('/issuer_accounts')) return Response.json([]);
   assert.ok(url.pathname.endsWith('/workspace_records'), 'registry must never fetch private rosters, sanads or certificates');
   assert.equal(url.searchParams.get('kind'), 'eq.sanadSections');
   assert.equal(url.searchParams.get('or'), '(payload->>ownerId.is.null,payload->>ownerId.eq."")');
   assert.equal(url.searchParams.get('order'), 'id.asc');
   const offset = Number(url.searchParams.get('offset'));
   assert.equal(url.searchParams.get('limit'), '1000');
   ranges.push(offset);
   if (offset < 2000) return Response.json(Array.from({length: 1000}, (_, index) => ({
    id: String(offset + index), payload: {title: 'Fixture unrelated source'},
   })));
   return Response.json([
    {id: '2000', payload: {title: 'CHAIN:nafi:قالون', body: 'عن الشيخ الاختباري، عن قالون'}},
    {id: '2001', payload: {title: 'CHAIN:nafi:ورش', ownerId: 'private', body: 'عن الشيخ الاختباري'}},
   ]);
  }},
 });
 client = {from: db.from.bind(db), auth: {getClaims: async () => ({
  data: signedIn ? {claims: {sub: 'fixture-user'}} : null,
 })}};
 const call = () => POST(new Request('https://fixture.invalid/api/workspace/narratorDirectory', {
  method: 'POST', body: '{}',
 }), {params: Promise.resolve({endpoint: 'narratorDirectory'})});

 let reference;
 for (role of ['admin', 'shaykh']) {
  ranges = [];
  const response = await call();
  assert.equal(response.status, 200, await response.clone().text());
  const result = await response.json();
  assert.deepEqual(ranges, [0, 1000, 2000]);
  assert.equal(result.sections, 1);
  assert.deepEqual(result.people.find(person => person.id === 'person:الاختباري')?.sources, ['CHAIN:nafi:قالون']);
  assert.ok(result.people.some(person => person.id === 'rawi:qalun'));
  if (reference) assert.deepEqual(result, reference);
  reference = result;
 }
 ranges = [];
 role = 'student';
 assert.equal((await call()).status, 403);
 role = 'shaykh';
 active = false;
 assert.equal((await call()).status, 403);
 signedIn = false;
 assert.equal((await call()).status, 401);
 assert.deepEqual(ranges, []);
 console.log('PASS: registry role gates, shared-only inputs, stable historical IDs, and pagination past 2,000');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
