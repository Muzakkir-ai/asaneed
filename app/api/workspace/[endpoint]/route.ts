import {NextResponse} from 'next/server';
import {createClient} from '../../../../lib/supabase/server';
import {requestContext} from '../../../../legacy/compat/context';
import {endpoints} from '../../../../legacy/compat/endpoints';
import {resolveWorkspaceScope,readOnlyWorkspaceRequest,administrativeWorkspaceRequest} from '../../../../lib/workspace-scope';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{endpoint:string}>}){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:'Forbidden origin'},{status:403});
 const {endpoint}=await params;if(!(endpoint in endpoints))return NextResponse.json({error:'Unknown endpoint'},{status:404});
 if(Number(request.headers.get('content-length')??0)>15000000)return NextResponse.json({error:'Request too large'},{status:413});
 const client=await createClient();
 if(endpoint==='verifyCertificate'){
  try{const input=endpoints.verifyCertificate.inputSchema.parse(await request.json());const result=await client.rpc('verify_certificate_token' as never,{token:input.token} as never);if(result.error)throw result.error;return NextResponse.json(result.data,{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Unable to verify certificate'},{status:400});}
 }
 const {data:identity,error}=await client.auth.getClaims();
 const claims=identity?.claims;const user=claims?.sub?{id:claims.sub,email:typeof claims.email==='string'?claims.email:''}:null;
 if(error||!user)return NextResponse.json({error:'Sign in required'},{status:401});
 const {data:account,error:accountError}=await client.from('accounts').select('id,display_name,role,active').eq('auth_user_id',user.id).maybeSingle();
 if(accountError||!account?.active)return NextResponse.json({error:'Account activation required'},{status:403});
 if(account.role==='student'&&!['myCertificates','certificatePrintAuthorization','assetSource','getDashboard','saveProfile'].includes(endpoint))return NextResponse.json({error:'Staff access required'},{status:403});
 try{
  const text=await request.text();if(text.length>15000000)return NextResponse.json({error:'Request too large'},{status:413});const body=JSON.parse(text);
  // Administrative directories use existing RLS grants, independently of list filters.
  const system=administrativeWorkspaceRequest(endpoint);
  const scope=await resolveWorkspaceScope(client,{...account,auth_user_id:user.id},request,system);
  if(endpoint==='myCertificates')scope.certificateAccess='recipient';
  else if(['certificatePrintAuthorization','resolveSanadFormatting'].includes(endpoint))scope.certificateAccess='assigned-or-recipient';
  if(scope.readOnly&&!readOnlyWorkspaceRequest(endpoint,body))return NextResponse.json({error:'هذه المساحة للقراءة فقط. فعّل وضع التعديل من شريط المعاينة أولاً.'},{status:403});
  if(scope.inspection&&system)return NextResponse.json({error:'Return to your own administration area first'},{status:403});
  const result=await requestContext.run({client,user:{id:scope.authUserId,email:user.email??'',name:scope.name,image:null},account,scope},()=>endpoints[endpoint as keyof typeof endpoints].invoke(body));
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to complete request'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
export async function DELETE(request:Request,{params}:{params:Promise<{endpoint:string}>}){if((await params).endpoint!=='session')return NextResponse.json({error:'Not found'},{status:404});const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:'Forbidden'},{status:403});await (await createClient()).auth.signOut();return NextResponse.json({success:true});}
