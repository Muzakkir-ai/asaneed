import {createClient} from '@supabase/supabase-js';
import {appOrigin} from '../../lib/auth';
import {context as requestContext} from '../compat/context';
import {z} from 'zod';
import {createEndpoint,ZiteError} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';

export default createEndpoint({
 description:'Administrator directory of stable user identities and roles',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','update','create','username','delete','restore']).default('list'),id:z.string().optional(),confirmName:z.string().optional(),email:z.string().trim().email().max(254).optional(),password:z.string().min(8).max(1024).optional(),username:z.string().trim().toLowerCase().regex(/^(?:[a-z][a-z0-9_]{2,29})?$/).optional(),name:z.string().optional(),role:z.enum(['Admin','Shaykh','Student']).optional(),active:z.boolean().optional(),authUserId:z.string().optional(),transferOwnership:z.boolean().optional(),legacyUserId:z.string().optional()}),
 outputSchema:z.object({createdUserId:z.string().optional(),confirmationRequired:z.boolean().optional(),warning:z.string().optional(),legacyProfiles:z.array(z.object({id:z.string(),name:z.string(),email:z.string()})),users:z.array(z.object({id:z.string(),stableId:z.string(),name:z.string(),email:z.string(),username:z.string(),role:z.string(),active:z.boolean(),deleted:z.boolean(),authUserId:z.string(),legacyUserId:z.string()}))}),
 execute:async({input,context})=>{
  if(!await isAppAdmin(context.user.email))throw new ZiteError({code:'FORBIDDEN',message:'Admins only'});
  const {client,scope}=requestContext();
  if(scope?.inspection&&input.action!=='list')throw Error('ارجع إلى مساحة الإدارة أولًا');
  const deletedResult=await client.rpc('account_deletion_ids');if(deletedResult.error)throw deletedResult.error;
  let deletedIds=new Set<string>(deletedResult.data||[]);
  if(input.id&&deletedIds.has(input.id)&&!['list','restore','delete'].includes(input.action))throw Error('استعد الحساب المحذوف قبل تعديله');
  if(input.action==='delete'||input.action==='restore'){
   if(!input.id)throw Error('اختر المستخدم');
   if(input.action==='delete'){const target=await zite.appUsers.findOne({id:input.id});if(!target||input.confirmName!==target.name)throw Error('اكتب اسم المستخدم كما يظهر لتأكيد الحذف');}
   const {error}=await client.rpc('set_account_deleted',{target_account:input.id,deleted:input.action==='delete'});if(error)throw Error(error.message);
   requestContext().cache?.clear();
   const current=await client.rpc('account_deletion_ids');if(current.error)throw current.error;deletedIds=new Set(current.data||[]);
  }
  let createdUserId:string|undefined,warning:string|undefined,confirmationRequired:boolean|undefined;
  if(input.action==='username'){
   if(!input.id||input.username===undefined)throw Error('اختر الحساب وأدخل اسم الدخول');
   const {error}=await requestContext().client.rpc('admin_set_account_username',{target_account:input.id,new_username:input.username});
   if(error)throw Error(error.code==='23505'?'اسم الدخول مستخدم بالفعل':error.message);
  }
  if(input.action==='create'){
   if(!input.name?.trim()||input.name.length>120||!input.email||!input.password)throw Error('أدخل الاسم والبريد وكلمة مرور من ٨ أحرف على الأقل');
   const email=input.email.trim().toLowerCase();
   const {records:known}=await zite.appUsers.findAll({limit:2000});
   if(known.some(u=>(u.email||'').toLowerCase()===email))throw Error('هذا البريد له حساب بالفعل؛ استخدم زر إدارة لتعديله');
   if(input.username){const lookup=await requestContext().client.from('accounts').select('id').eq('username',input.username).maybeSingle();if(lookup.error)throw lookup.error;if(lookup.data)throw Error('اسم الدخول مستخدم بالفعل');}
   // A separate stateless Auth client never replaces the administrator's cookie/session.
   const signup=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data,error}=await signup.auth.signUp({email,password:input.password,options:{data:{display_name:input.name.trim()},emailRedirectTo:`${appOrigin}/auth/callback`}});
   if(error||!data.user||data.user.identities?.length===0)throw Error('تعذر إنشاء الحساب؛ تحقق من البريد أو افتح الحساب الموجود');
   if(data.session)await signup.auth.signOut();
   requestContext().cache?.clear();
   const account=await requestContext().client.from('accounts').select('id').eq('auth_user_id',data.user.id).single();
   if(account.error||!account.data)throw Error('أُنشئ حساب الدخول؛ حدّث قائمة المستخدمين لإكمال تفعيله');
   const newAccountId=String(account.data.id);createdUserId=newAccountId;
   const requestedActive=input.active??true;
   confirmationRequired=requestedActive&&!data.user.email_confirmed_at;
   try{
    await zite.appUsers.update({id:newAccountId,record:{name:input.name.trim(),role:input.role||'Student',active:requestedActive&&!confirmationRequired}});
    if(input.username){const result=await requestContext().client.rpc('admin_set_account_username',{target_account:newAccountId,new_username:input.username});if(result.error)throw result.error;}
   }catch{warning='أُنشئ الحساب، لكن لم تُحفظ جميع إعداداته. افتح إدارة الحساب لإكمالها.';}
  }
  if(input.action==='update'){
   if(!input.id)throw new Error('User required');
   const existing=await zite.appUsers.findOne({id:input.id});
   if(!existing)throw new Error('User not found');
   const patch:Record<string,string|boolean>={};
   if(input.name!==undefined){if(!input.name.trim())throw new Error('Name required');patch.name=input.name.trim();}
   if(input.role!==undefined)patch.role=input.role;
   if(input.legacyUserId)patch.legacyUserId=input.legacyUserId;
   if(input.active!==undefined)patch.active=input.active;
   if(input.authUserId!==undefined){
    const uid=input.authUserId.trim();
    const {records:all}=await zite.appUsers.findAll({limit:2000});
    if(uid&&all.some(u=>u.id!==existing.id&&u.authUserId===uid))throw new Error('Account is linked to another identity');
    if(uid&&uid!==existing.authUserId){
     const accounts=await zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000});
     const target=accounts.records.find(u=>u.id===uid);
     if(!target||(target.email||'').trim().toLowerCase()!==(existing.email||'').trim().toLowerCase())throw new Error('The new account ID must belong to the same verified email');
     if(!input.transferOwnership)throw new Error('Confirm ownership transfer before linking a new account');
     const prior=[existing.authUserId,existing.legacyUserId].filter((v):v is string=>!!v&&v!==uid);
     for(const oldId of prior){
      const tables=[
       {client:zite.ijazahHoldings,field:'ownerId'},
       {client:zite.preparedIjazahs,field:'ownerId'},
       {client:zite.certificateSnapshots,field:'ownerId'},
       {client:zite.shaykhPrintProfiles,field:'ownerId'},
       {client:zite.sanadPrintStyles,field:'ownerId'},
       {client:zite.students,field:'ownerId'},
      ] as const;
      for(const t of tables){
       const {records}=await t.client.findAll({filters:{ownerId:oldId},limit:2000});
       for(const rec of records)await t.client.update({id:rec.id,record:{ownerId:uid}});
      }
      const {records:asaneed}=await zite.asaneed.findAll({filters:{shaykh:oldId},limit:2000});
      for(const rec of asaneed)await zite.asaneed.update({id:rec.id,record:{shaykh:[uid]}});
      const {records:certificates}=await zite.certificates.findAll({filters:{shaykh:oldId},limit:2000});
      for(const rec of certificates)await zite.certificates.update({id:rec.id,record:{shaykh:[uid]}});
     }
    }
    patch.authUserId=uid;
   }
   await zite.appUsers.update({id:existing.id,record:patch});
  }
  const {records}=await zite.appUsers.findAll({limit:2000});
  const legacy=await requestContext().client.rpc('legacy_identity_choices');if(legacy.error)throw new Error(legacy.error.message);
  const aliases=await requestContext().client.from('accounts').select('id,username');if(aliases.error)throw aliases.error;
  const usernames=new Map((aliases.data||[]).map(a=>[a.id,a.username||'']));
  return {createdUserId,confirmationRequired,warning,legacyProfiles:legacy.data,users:records.map(u=>({id:u.id,stableId:u.stableId||'',name:u.name||'',email:u.email||'',username:usernames.get(u.id)||'',role:u.role||'Shaykh',active:u.active===true,deleted:deletedIds.has(u.id),authUserId:u.authUserId||'',legacyUserId:u.legacyUserId||''}))};
 }
});
