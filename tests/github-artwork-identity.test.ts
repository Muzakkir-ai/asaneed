import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {verifyArtworkWorkflow} from '../legacy/lib/githubArtworkIdentity';
(async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const now=Math.floor(Date.now()/1000);
 const claims={iss:'https://token.actions.githubusercontent.com',aud:'asaneed-artwork-refresh',iat:now,exp:now+300,repository_id:'1420583732',repository:'Muzakkir-ai/fonts',ref:'refs/heads/main',sub:'repo:Muzakkir-ai/fonts:ref:refs/heads/main',workflow_ref:'Muzakkir-ai/fonts/.github/workflows/refresh-asaneed-artwork.yml@refs/heads/main',event_name:'push'};
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({keys:[{...publicKey.export({format:'jwk'}),kid:'test',alg:'RS256'}]}));
 const jwt=(patch:Record<string,unknown>={})=>{const data=[{alg:'RS256',kid:'test'},{...claims,...patch}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');return data+'.'+sign('RSA-SHA256',Buffer.from(data),privateKey).toString('base64url');};
 try{
  assert.equal((await verifyArtworkWorkflow(jwt())).repository,claims.repository);
  assert.equal((await verifyArtworkWorkflow(jwt({sub:'repo:Muzakkir-ai@123297158/fonts@1420583732:ref:refs/heads/main'}))).repository_id,'1420583732');
  for(const patch of [{repository_id:'wrong'},{repository:'someone/fonts'},{ref:'refs/heads/other'},{aud:'wrong'},{exp:now-1},{event_name:'pull_request'},{workflow_ref:'different'},{sub:'different'}])await assert.rejects(()=>verifyArtworkWorkflow(jwt(patch)));
  await assert.rejects(()=>verifyArtworkWorkflow(jwt().slice(0,-12)+'invalid'));
 }finally{globalThis.fetch=original;}
 console.log('GitHub workflow signature, audience, repository, ref and lifetime: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
