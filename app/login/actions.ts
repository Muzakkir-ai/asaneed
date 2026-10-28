'use server';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { appOrigin, googleEnabled, validEmail, validPassword } from '../../lib/auth';
export async function login(form: FormData) {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!validEmail(email) || !password || password.length > 1024) redirect('/login?error=invalid');
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect('/login?error=invalid');
  redirect('/studio');
}
export async function logout() {
  const client = await createClient();
  await client.auth.signOut();
  redirect('/login');
}
export async function register(form: FormData) {
 const name=String(form.get('name')??'').trim();
 const email=String(form.get('email')??'').trim();
 const password=String(form.get('password')??'');
 if(!name || name.length>120 || !validEmail(email) || !validPassword(password))redirect('/register?error=invalid');
 if(password!==String(form.get('confirmPassword')??''))redirect('/register?error=mismatch');
 const client=await createClient();
 const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:`${appOrigin}/auth/callback`}});
 if(error)redirect('/register?error=request');
 if(data.session)redirect('/studio');
 redirect('/login?notice=signup');
}
export async function requestReset(form: FormData) {
 const email=String(form.get('email')??'').trim();
 if(!validEmail(email))redirect('/forgot-password?error=invalid');
 const client=await createClient();
 const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${appOrigin}/auth/callback?flow=recovery`});
 if(error)redirect('/forgot-password?error=request');
 redirect('/forgot-password?notice=sent');
}
export async function updatePassword(form: FormData) {
 const password=String(form.get('password')??'');
 if(!validPassword(password))redirect('/reset-password?error=invalid');
 if(password!==String(form.get('confirmPassword')??''))redirect('/reset-password?error=mismatch');
 const client=await createClient();
 const {data,error:identityError}=await client.auth.getUser();
 if(identityError||!data.user)redirect('/forgot-password?error=expired');
 const {error}=await client.auth.updateUser({password});
 if(error)redirect('/reset-password?error=request');
 await client.auth.signOut();
 redirect('/login?notice=password');
}
export async function googleLogin() {
 if(!await googleEnabled())redirect('/login?error=google');
 const client=await createClient();
 const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${appOrigin}/auth/callback`,scopes:'openid email profile'}});
 if(error||!data.url)redirect('/login?error=request');
 if(new URL(data.url).origin!==new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin)redirect('/login?error=request');
 redirect(data.url);
}
