'use server';
import {redirect} from 'next/navigation';
import {createClient} from '../../lib/supabase/server';
import {appOrigin,validEmail,validPassword} from '../../lib/auth';
import {clearSetup,hashSetupCode,readSetupCookie,rememberSetup,setupState} from '../../lib/account-setup';
export async function beginActivation(form:FormData){
 const credential={username:String(form.get('username')??''),code:String(form.get('code')??'')};
 let valid=false;try{valid=Boolean(await setupState(await createClient(),credential));}catch{}
 if(!valid)redirect('/activate-account?error=invalid');
 await rememberSetup(credential);redirect('/activate-account');
}
export async function requestSetupEmail(form:FormData){
 const credential=await readSetupCookie(),email=String(form.get('email')??'').trim().toLowerCase();
 if(!credential||!validEmail(email))redirect('/activate-account?error=invalid');
 let sent=false;try{const client=await createClient(),state=await setupState(client,credential,email);if(state){const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true,data:{display_name:state.name},emailRedirectTo:`${appOrigin}/auth/callback`}});sent=!error;}}catch{}
 redirect(sent?'/activate-account?notice=sent':'/activate-account?error=request');
}
export async function finishActivation(form:FormData){
 const credential=await readSetupCookie(),password=String(form.get('password')??'');
 if(!credential)redirect('/activate-account?error=invalid');
 if(!validPassword(password)||password!==String(form.get('confirmPassword')??''))redirect('/activate-account?error=mismatch');
 let completed=false;try{const client=await createClient(),identity=await client.auth.getUser(),state=await setupState(client,credential);
  if(!identity.error&&identity.data.user?.email_confirmed_at&&state?.emailVerified){const updated=await client.auth.updateUser({password});if(!updated.error){const {data,error}=await client.rpc('complete_account_setup',{login_username:state.username,code_hash:hashSetupCode(credential.code),lookup_key:process.env.USERNAME_LOOKUP_KEY!});completed=!error&&Boolean(data);}}
 }catch{}
 if(!completed)redirect('/activate-account?error=request');
 await clearSetup();redirect('/studio');
}
export async function resetActivation(){await clearSetup();redirect('/activate-account');}
export async function signOutForActivation(){await (await createClient()).auth.signOut();redirect('/activate-account');}
