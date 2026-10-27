import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '../../../lib/database.types';
import { isRegistration, normalizeRegistration } from '../../../lib/registration';
import { isVerificationResult } from '../../../lib/verification';
export async function POST(request: Request) {
 const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control':'no-store' } });
 let body: unknown;
 try { body = await request.json(); } catch { return reply({error:'invalid_number'},400); }
 if (!body || typeof body !== 'object' || !('number' in body) || typeof body.number !== 'string' || body.number.length > 64) return reply({error:'invalid_number'},400);
 const number = normalizeRegistration(body.number);
 if (!isRegistration(number)) return reply({error:'invalid_number'},400);
 try {
  const client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
   auth: { persistSession:false,autoRefreshToken:false,detectSessionInUrl:false },
  });
  const { data, error } = await client.rpc('verify_ijazah',{p_number:number});
  if (error || !isVerificationResult(data)) return reply({error:'unavailable'},503);
  return reply(data);
 } catch { return reply({error:'unavailable'},503); }
}
