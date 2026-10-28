import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { appOrigin } from '../../../lib/auth';
export async function GET(request: NextRequest) {
 const token=request.nextUrl.searchParams.get('token_hash');const type=request.nextUrl.searchParams.get('type');
 if(token&&token.length<4096&&(type==='recovery'||type==='signup'||type==='email'||type==='invite')) {
  const client=await createClient();const {error}=await client.auth.verifyOtp({token_hash:token,type});
  if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/reset-password':'/studio',appOrigin),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }
 return NextResponse.redirect(new URL('/login?error=expired',appOrigin),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
