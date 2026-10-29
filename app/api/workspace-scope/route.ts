import {personalIssuerName} from '../../../legacy/lib/issuerNames';
import {NextResponse} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
export const dynamic='force-dynamic';
export async function GET(){
 const client=await createClient();const {data:identity}=await client.auth.getClaims();const uid=identity?.claims.sub;
 if(!uid)return NextResponse.json({error:'Sign in required'},{status:401});
 const {data:actor}=await client.from('accounts').select('id,display_name,role,active').eq('auth_user_id',uid).single();
 if(!actor?.active)return NextResponse.json({error:'Active account required'},{status:403});
 const {data:accounts,error}=await client.rpc('list_application_accounts');if(error)return NextResponse.json({error:error.message},{status:400});
 const [issuers,links,certs]=await Promise.all([client.from('issuers').select('id,display_name,issuer_code,print_profile'),client.from('issuer_accounts').select('*'),client.from('certificates').select('id,issuer_id,student_id')]);
 if(issuers.error||links.error||certs.error)return NextResponse.json({error:'Unable to load workspace directory'},{status:400});
 const directory=(accounts as {id:string;display_name:string;email:string;role:string;active:boolean}[]).map(a=>{const ids=(links.data??[]).filter(l=>l.account_id===a.id).map(l=>l.issuer_id);const owned=(certs.data??[]).filter(c=>ids.includes(c.issuer_id));const personal=(issuers.data??[]).filter(i=>(i.print_profile as Record<string,unknown>)?.personalAccount===a.id);const personalIds=personal.map(i=>i.id);return {id:a.id,name:a.display_name,email:a.email,role:a.role,active:a.active,issuers:(issuers.data??[]).filter(i=>ids.includes(i.id)).map(i=>({id:i.id,name:i.display_name})),personalIssuerCode:personal[0]?.issuer_code||'',personalIssuerId:personal[0]?.id||'',personalIssuer:personal.map(i=>personalIssuerName(a.display_name,(i.print_profile as Record<string,unknown>)?.printedName as string,i.display_name)).join('، '),issuedCertificates:(certs.data??[]).filter(c=>personalIds.includes(c.issuer_id)).length,certificates:owned.length,students:new Set(owned.map(c=>c.student_id)).size};});
 return NextResponse.json({actorId:actor.id,isAdmin:actor.role==='admin',accounts:directory,issuers:actor.role==='admin'?(issuers.data??[]).map(i=>({id:i.id,name:(i.print_profile as Record<string,unknown>)?.personalAccount?personalIssuerName((accounts as any[]).find(a=>a.id===(i.print_profile as Record<string,unknown>).personalAccount)?.display_name||'',(i.print_profile as Record<string,unknown>).printedName as string,i.display_name):i.display_name,number:i.issuer_code})):[]},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)return NextResponse.json({error:'Forbidden origin'},{status:403});
 const client=await createClient();const {data:identity}=await client.auth.getClaims();if(!identity?.claims.sub)return NextResponse.json({error:'Sign in required'},{status:401});
 const {data:actor}=await client.from('accounts').select('role,active').eq('auth_user_id',identity.claims.sub).single();if(!actor?.active||actor.role!=='admin')return NextResponse.json({error:'Administrator required'},{status:403});
 try{const body=await request.json();if(!body||typeof body.enabled!=='boolean'||![body.accountId,body.issuerId].every(x=>typeof x==='string'&&/^[0-9a-f-]{36}$/i.test(x)))throw Error('Choose an account and issuing shaykh');const {error}=await client.rpc('set_issuer_assignment',{target:body.accountId,issuer:body.issuerId,enabled:body.enabled});if(error)throw Error(error.message);return NextResponse.json({success:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save assignment'},{status:400});}
}
