export const authPaths = ['/login','/register','/forgot-password','/reset-password','/manage','/studio','/control','/privacy'] as const;
export function authReturnPath(value: unknown) { return typeof value==='string' && (authPaths as readonly string[]).includes(value) ? value : '/'; }
export function validEmail(value:string) { return value.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function validPassword(value:string) { return value.length>=12 && value.length<=1024; }
// Fixed canonical origin prevents Host-header redirects in confirmation and recovery emails.
export const appOrigin = 'https://asaneed.vercel.app';
export async function googleEnabled() {
 try {
  const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},next:{revalidate:60},signal:AbortSignal.timeout(5000)});
  if(!response.ok)return false;
  const settings=await response.json();
  return settings?.external?.google===true;
 } catch { return false; }
}
