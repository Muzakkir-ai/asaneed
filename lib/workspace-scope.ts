import type {SupabaseClient} from '@supabase/supabase-js';
import type {WorkspaceScope} from '../legacy/compat/context';
/** These endpoints already require admin privileges; RLS remains authoritative. */
export function administrativeWorkspaceRequest(endpoint:string){return ['manageUsers','adminBackup','additionalShaykhs','additionalReadingSanads','getAdminAsaneed','manageAsaneed','sanadSections','sectionVersions','riwayahColors','narratorDirectory'].includes(endpoint);}
export function readOnlyWorkspaceRequest(endpoint:string,input:Record<string,unknown>){
 if(endpoint==='assetSource')return input.repository===undefined&&!input.refresh;
 if(['getDashboard','myCertificates','getAdminAsaneed','narratorDirectory','certificateDraftPreview','certificatePrintAuthorization','resolveSanadFormatting','sectionVersions'].includes(endpoint))return true;
 const actions:Record<string,string[]>={assetSource:['get','list'],additionalReadingSanads:['list'],additionalShaykhs:['list'],ijazahHoldings:['list'],mutoonHoldings:['list'],mutoonTemplates:['list'],personalWording:['list'],riwayahColors:['list'],sanadPrintStyle:['get'],sanadSections:['list'],shaykhPrintProfile:['get'],studentDirectory:['list']};
 return !!actions[endpoint]?.includes(String(input.action??'list'));
}
export async function resolveWorkspaceScope(client:SupabaseClient,actor:{id:string;auth_user_id:string;display_name:string;role:string},request:Request,system=false):Promise<WorkspaceScope>{
 const targetId=request.headers.get('x-workspace-account')||actor.id;
 const inspection=targetId!==actor.id;
 if(inspection&&actor.role!=='admin')throw Error('Administrator required to inspect another workspace');
 let target=actor;
 if(inspection){const {data,error}=await client.from('accounts').select('id,auth_user_id,display_name,role').eq('id',targetId).single();if(error||!data)throw Error('Workspace unavailable');target=data;}
 const {data:links,error}=await client.from('issuer_accounts').select('issuer_id').eq('account_id',target.id);
 if(error)throw Error('Unable to load issuing-shaykh assignments');
 const issuerIds=(links??[]).map(r=>r.issuer_id as string);
 // Administrators manage every additional shaykh by role; explicit assignments
 // still define personal-user access and account inspection. This is not a UI filter.
 if(actor.role==='admin'&&!inspection&&!system){
  const {data:profiles,error:profileError}=await client.from('issuers').select('id,print_profile');
  if(profileError)throw Error('Unable to load authorized additional shaykhs');
  for(const profile of profiles??[])if(!(profile.print_profile as Record<string,unknown>)?.personalAccount&&!issuerIds.includes(profile.id))issuerIds.push(profile.id);
 }
 return {accountId:target.id,authUserId:target.auth_user_id,name:target.display_name,role:target.role,issuerIds,inspection,readOnly:inspection&&request.headers.get('x-workspace-edit')!=='confirmed',system:system&&actor.role==='admin'};
}
