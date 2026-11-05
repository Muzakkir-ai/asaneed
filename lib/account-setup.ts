import 'server-only';
import {createHash,randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import type {SupabaseClient} from '@supabase/supabase-js';
import {normalizeUsername,validUsername} from './usernames';
export const setupCookie='asaneed-account-setup';
export const normalizeSetupCode=(value:string)=>value.replace(/[\s-]/g,'').toUpperCase();
export const isSetupCode=(value:string)=>/^AS[A-F0-9]{40}$/.test(normalizeSetupCode(value));
export const hashSetupCode=(value:string)=>createHash('sha256').update(normalizeSetupCode(value)).digest('hex');
export function newSetupCode(){return 'AS-'+randomBytes(20).toString('hex').toUpperCase().match(/.{8}/g)!.join('-');}
export type SetupCredential={username:string;code:string};
export type SetupState={username:string;name:string;email:string;expiresAt:string;emailVerified:boolean;emailLocked:boolean};
export async function setupState(client:SupabaseClient,credential:SetupCredential,email?:string):Promise<SetupState|null>{
 const username=normalizeUsername(credential.username),key=process.env.USERNAME_LOOKUP_KEY;
 if(!validUsername(username)||!isSetupCode(credential.code)||!key)return null;
 const {data,error}=await client.rpc('account_setup_state',{login_username:username,code_hash:hashSetupCode(credential.code),lookup_key:key,...(email!==undefined?{email_input:email}:{})});
 if(error)throw Error(email?'تعذر اعتماد هذا البريد؛ تحقق منه أو اطلب من المشرف مراجعة الحساب.':'رمز التفعيل غير متاح.');
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const value=data as Record<string,unknown>;
 if(typeof value.username!=='string'||typeof value.name!=='string'||typeof value.email!=='string'||typeof value.expiresAt!=='string')return null;
 return {...value,emailVerified:value.emailVerified===true,emailLocked:value.emailLocked===true} as SetupState;
}
export async function readSetupCookie():Promise<SetupCredential|null>{
 try{const raw=(await cookies()).get(setupCookie)?.value;if(!raw||raw.length>600)return null;const value=JSON.parse(raw);return typeof value.username==='string'&&typeof value.code==='string'&&isSetupCode(value.code)?value:null;}catch{return null;}
}
export async function rememberSetup(credential:SetupCredential){(await cookies()).set(setupCookie,JSON.stringify({username:normalizeUsername(credential.username),code:normalizeSetupCode(credential.code)}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:72*60*60});}
export async function clearSetup(){(await cookies()).delete(setupCookie);}
