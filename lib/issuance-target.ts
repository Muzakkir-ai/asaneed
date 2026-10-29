import type {SupabaseClient} from '@supabase/supabase-js';
import type {WorkspaceScope} from '../legacy/compat/context';
/** Explicit per-operation target, never a global workspace selection. */
export async function issuanceTargetScope(client:SupabaseClient,scope:WorkspaceScope,actorRole:string,endpoint:string,input:Record<string,unknown>){
 const certificateOperation=['certificateDraftPreview','finalizeCertificate','certificatePrintAuthorization'].includes(endpoint);
 const supported=certificateOperation||endpoint==='ijazahHoldings'&&(input.action??'list')==='list'||['prepareIjazah','issueQiraah','saveCertificate'].includes(endpoint);
 let owner=endpoint==='saveCertificate'?input.shaykhId:input.ownerId;
 if(certificateOperation&&actorRole==='admin'&&typeof input.certificateId==='string'){
  const {data:certificate,error}=await client.from('certificates').select('issuer_id').eq('id',input.certificateId).single();
  if(error||!certificate)throw Error('Certificate unavailable');
  const {data:issuer,error:issuerError}=await client.from('issuers').select('print_profile').eq('id',certificate.issuer_id).single();
  if(issuerError)throw Error(issuerError.message);
  const personalAccount=(issuer?.print_profile as Record<string,unknown>)?.personalAccount;
  if(typeof personalAccount==='string'){
   const {data:account,error:accountError}=await client.from('accounts').select('auth_user_id').eq('id',personalAccount).single();
   if(accountError||!account)throw Error('Issuing account unavailable');owner=account.auth_user_id;
  }
 }
 if(!supported||typeof owner!=='string'||!owner||owner===scope.authUserId)return scope;
 if(actorRole!=='admin')throw Error('Administrator required to issue for another shaykh');
 if(scope.inspection||scope.readOnly)throw Error('Return to your own administration area first');
 const {data:target,error}=await client.from('accounts').select('id,auth_user_id,display_name,role,active').eq('auth_user_id',owner).single();
 if(error||!target?.active||target.role==='student')throw Error('Active issuing account required');
 const {data:links,error:linkError}=await client.from('issuer_accounts').select('issuer_id').eq('account_id',target.id);
 if(linkError)throw Error(linkError.message);
 return {...scope,accountId:target.id,authUserId:target.auth_user_id,name:target.display_name,role:target.role,issuerIds:(links||[]).map(l=>l.issuer_id),inspection:false,readOnly:false,system:false};
}
