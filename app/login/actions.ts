'use server';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
export async function login(form: FormData) {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password || email.length > 254 || password.length > 1024) redirect('/login?error=invalid');
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect('/login?error=invalid');
  redirect('/manage');
}
export async function logout() {
  const client = await createClient();
  await client.auth.signOut();
  redirect('/login');
}
