import type {SupabaseClient} from '@supabase/supabase-js';
import type {WorkspaceScope} from '../legacy/compat/context';
export function readOnlyWorkspaceRequest(endpoint:string,input:Record<string,unknown>){
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
 const requested=request.headers.get('x-workspace-issuer');
 if(requested&&!issuerIds.includes(requested))throw Error('Issuing-shaykh profile is not assigned to this account');
 return {accountId:target.id,authUserId:target.auth_user_id,name:target.display_name,role:target.role,issuerIds,issuerId:requested||issuerIds[0]||'',inspection,readOnly:inspection&&request.headers.get('x-workspace-edit')!=='confirmed',system:system&&actor.role==='admin'};
}
