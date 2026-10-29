import assert from 'node:assert/strict';
import {issuanceTargetScope} from '../lib/issuance-target';
import type {WorkspaceScope} from '../legacy/compat/context';
const base:WorkspaceScope={accountId:'actor',authUserId:'actor-auth',name:'Actor',role:'admin',issuerIds:['own'],inspection:false,readOnly:false,system:false};
const client:any={from:(table:string)=>({select:()=>({eq:()=>table==='accounts'?{single:async()=>({data:{id:'umar',auth_user_id:'umar-auth',display_name:'عمر',role:'admin',active:true},error:null})}:Promise.resolve({data:[{issuer_id:'04'}],error:null})})})};
async function main(){
 const scope=await issuanceTargetScope(client,base,'admin','ijazahHoldings',{action:'list',ownerId:'umar-auth'});
 assert.equal(scope.authUserId,'umar-auth');assert.deepEqual(scope.issuerIds,['04']);
 assert.equal(base.authUserId,'actor-auth','Operation must not change the global selection');
 await assert.rejects(()=>issuanceTargetScope(client,base,'shaykh','prepareIjazah',{ownerId:'umar-auth'}),/Administrator/);
 await assert.rejects(()=>issuanceTargetScope(client,{...base,inspection:true,readOnly:true},'admin','prepareIjazah',{ownerId:'umar-auth'}),/Return/);
 assert.equal(await issuanceTargetScope(client,base,'admin','studentDirectory',{ownerId:'umar-auth'}),base,'Unrelated pages keep their scope');
 console.log('PASS: explicit admin issuance target, immutable global scope, normal-user rejection and read-only inspection protection');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
