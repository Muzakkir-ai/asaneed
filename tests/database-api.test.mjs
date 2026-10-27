import assert from 'node:assert/strict';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key,'Supabase public configuration is required');
const [lookup,privateSchema,certificateTable]=await Promise.all([
 fetch(`${url}/rest/v1/rpc/verify_ijazah`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({p_number:'0126-1002'})}),
 fetch(`${url}/rest/v1/ijazah_verification_index?select=registration_number&limit=1`,{headers:{apikey:key,'Accept-Profile':'private'}}),
 fetch(`${url}/rest/v1/certificates?select=id&limit=1`,{headers:{apikey:key}}),
]);
assert.equal(lookup.status,200);
assert.ok(['preparing','not_found','verified'].includes((await lookup.json()).status));
assert.equal(privateSchema.status,406,'Private schema must not be exposed through the Data API');
assert.equal((await privateSchema.json()).code,'PGRST106');
assert.ok([401,403].includes(certificateTable.status),'Private certificates must reject anonymous reads');
console.log('PASS: public exact lookup works; private schema and certificate table cannot be listed');
