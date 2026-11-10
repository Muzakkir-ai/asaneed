import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '../../../lib/supabase/server';
import {hashSetupCode,newSetupCode} from '../../../lib/account-setup';
import {readBoundedJson,RequestTooLarge} from '../../../lib/bounded-json';

const username=z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{2,29}$/);
const requestSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('revoke'),username}),
 z.object({action:z.literal('create'),username,name:z.string().trim().min(1).max(120),email:z.string().trim().toLowerCase().email().max(254).or(z.literal('')).default(''),role:z.enum(['shaykh','student']),canIssue:z.boolean().default(false),issuerId:z.string().uuid().optional()}),
]);
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(error:string,status:number)=>reply({error},status);

async function session(request:Request){
 const client=await createClient();
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)return {response:fail('سجّل الدخول أولاً',401)};
 const {data:actor}=await client.from('accounts').select('id,role,active').eq('auth_user_id',data.user.id).single();
 if(!actor?.active||actor.role!=='admin')return {response:fail('يلزم حساب مدير نشط',403)};
 const workspace=request.headers.get('x-workspace-account');
 if(workspace&&workspace!==actor.id)return {response:fail('ارجع إلى مساحة الإدارة الخاصة بك أولاً',403)};
 return {client};
}

export async function GET(request:Request){
 const {client,response}=await session(request);
 if(response)return response;
 const issuerId=new URL(request.url).searchParams.get('issuerId');
 if(issuerId!==null&&!z.string().uuid().safeParse(issuerId).success)return fail('المجيز غير صالح',400);
 const {data,error}=await client.rpc('manage_account_setup',{action:'list',record:issuerId?{issuerId}:{}});
 if(error)return fail('تعذر تحميل دعوات الحسابات',error.code==='42501'?403:500);
 return reply({invitations:data});
}

export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Forbidden origin',403);
 const {client,response}=await session(request);
 if(response)return response;
 let input;
 try{
  input=requestSchema.parse(await readBoundedJson(request,5000));
 }catch(error){
  if(error instanceof RequestTooLarge)return fail('الطلب أكبر من الحد المسموح',413);
  return fail('تحقّق من بيانات التفعيل المدخلة',400);
 }
 if(input.action==='revoke'){
  const {error}=await client.rpc('manage_account_setup',{action:'revoke',record:{username:input.username}});
  if(error?.message==='Pending invitation unavailable')return fail('رمز التفعيل المعلّق غير متاح',404);
  if(error)return fail('تعذر إلغاء رمز التفعيل',error.code==='42501'?403:500);
  return reply({revoked:true});
 }
 const key=process.env.USERNAME_LOOKUP_KEY;
 if(!key||key.length<48)return fail('خدمة تفعيل الحساب غير جاهزة',503);
 const configuration=await client.rpc('account_setup_state',{login_username:'setup_configuration_check',code_hash:'0'.repeat(64),lookup_key:key});
 if(configuration.error)return fail('خدمة تفعيل الحساب غير جاهزة',503);
 const {action,...record}=input;
 const code=newSetupCode();
 const {data,error}=await client.rpc('manage_account_setup',{action,record:{...record,codeHash:hashSetupCode(code)}});
 if(error?.code==='42501')return fail('يلزم حساب مدير نشط',403);
 switch(error?.message){
  case 'Invalid username': return fail('اسم الدخول غير صالح أو محجوز',400);
  case 'Invalid email': return fail('البريد الإلكتروني غير صالح',400);
  case 'Invalid setup invitation': return fail('تحقّق من بيانات التفعيل المدخلة',400);
  case 'Username already belongs to an account': return fail('اسم الدخول مرتبط بحساب موجود',409);
  case 'Choose an additional shaykh without an existing login':
  case 'This shaykh is already assigned to an account': return fail('اختر شيخًا إضافيًا غير مرتبط بحساب',409);
 }
 if(error)return fail('تعذر إنشاء رمز التفعيل',500);
 return reply({invitation:data,code});
}
