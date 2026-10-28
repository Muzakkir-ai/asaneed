import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { appOrigin } from '../../../lib/auth';
export async function GET(request: NextRequest) {
 const code=request.nextUrl.searchParams.get('code');
 if(code&&code.length<4096) {
  const client=await createClient();
  const {error}=await client.auth.exchangeCodeForSession(code);
  if(!error)return NextResponse.redirect(new URL(request.nextUrl.searchParams.get('flow')==='recovery'?'/reset-password':'/manage',appOrigin),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }
 return NextResponse.redirect(new URL('/login?error=expired',appOrigin),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
