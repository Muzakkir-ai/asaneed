import {createPublicKey,verify} from 'node:crypto';
export async function verifyArtworkWorkflow(token:string){
 const parts=token.split('.');if(parts.length!==3||token.length>20000)throw Error('Invalid token');
 const header=JSON.parse(Buffer.from(parts[0],'base64url').toString());
 const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('Invalid algorithm');
 const r=await fetch('https://token.actions.githubusercontent.com/.well-known/jwks',{cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('Key service unavailable');
 const keys=await r.json();const key=keys.keys?.find((k:any)=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256');
 if(!key||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw Error('Invalid signature');
 const now=Date.now()/1000;
 if(payload.iss!=='https://token.actions.githubusercontent.com'||payload.aud!=='asaneed-artwork-refresh'||typeof payload.exp!=='number'||payload.exp<=now||typeof payload.iat!=='number'||payload.iat>now+30||payload.iat<now-600||typeof payload.nbf==='number'&&payload.nbf>now+30)throw Error('Invalid token lifetime');
 if(payload.repository!=='Muzakkir-ai/fonts'||payload.ref!=='refs/heads/main'||payload.sub!=='repo:Muzakkir-ai/fonts:ref:refs/heads/main'||payload.workflow_ref!=='Muzakkir-ai/fonts/.github/workflows/refresh-asaneed-artwork.yml@refs/heads/main'||!['push','workflow_dispatch'].includes(payload.event_name))throw Error('Workflow unavailable');
 return payload;
}
