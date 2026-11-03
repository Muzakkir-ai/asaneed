import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
export default createEndpoint({
 description:'Read or set the signed-in account login username without changing its email, identity or role',authenticated:true,
 inputSchema:z.object({action:z.enum(['get','save']).default('get'),username:z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{2,29}$/,'استخدم ٣–٣٠ حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية، وابدأ بحرف').optional()}),
 outputSchema:z.object({username:z.string(),loginEnabled:z.boolean()}),
 execute:async({input,context})=>{
  if(context.scope?.inspection)throw Error('ارجع إلى حسابك لتعديل اسم الدخول');
  if(input.action==='save'&&!input.username)throw Error('أدخل اسم الدخول');
  const {data,error}=input.action==='save'?await context.client.rpc('set_account_username',{new_username:input.username!}):await context.client.rpc('get_account_username');
  if(error)throw Error(error.code==='23505'?'اسم الدخول مستخدم بالفعل':error.message.includes('reserved')?'اسم الدخول محجوز للإدارة':'تعذر حفظ اسم الدخول');
  return {username:typeof data==='string'?data:'',loginEnabled:Boolean(process.env.USERNAME_LOOKUP_KEY)};
 }
});
