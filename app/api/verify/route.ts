import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '../../../lib/database.types';
import { isRegistration, normalizeRegistration } from '../../../lib/registration';
import { isVerificationResult } from '../../../lib/verification';
export async function POST(request: Request) {
 const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'no-store', ...(status === 429 && { 'Retry-After': '60' }) },
 });
 let body: unknown;
 try { body = await request.json(); } catch { return reply({error:'invalid_number'},400); }
 if (!body || typeof body !== 'object' || !('number' in body) || typeof body.number !== 'string' || body.number.length > 64) return reply({error:'invalid_number'},400);
 const number = normalizeRegistration(body.number);
 if (!isRegistration(number)) return reply({error:'invalid_number'},400);
 try {
  const capability = process.env.CERTIFICATE_LOOKUP_CAPABILITY;
  const ip = request.headers.get('x-vercel-forwarded-for') ?? '';
  const family = isIP(ip);
  if (process.env.VERCEL !== '1' || !family || ip.includes('%') || !capability || !/^[a-f0-9]{64}$/.test(capability)) {
   return reply({ error: 'unavailable' }, 503);
  }
  const address = family === 6 ? new URL(`http://[${ip}]/`).hostname : ip;
  const clientKey = createHmac('sha256', capability).update('certificate-lookup:' + address).digest('hex');
  const client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
   auth: { persistSession:false,autoRefreshToken:false,detectSessionInUrl:false },
  });
  const { data, error } = await client.rpc('lookup_certificate_number', {
   p_number: number, p_client_key: clientKey, p_capability: capability,
  });
  if (!error && data && typeof data === 'object' && 'status' in data && data.status === 'rate_limited') {
   return reply({ error: 'rate_limited' }, 429);
  }
  if (error || !isVerificationResult(data)) return reply({error:'unavailable'},503);
  if (data.status !== 'verified') return reply({ status: data.status });
  const { registration_number, student_name, issuer_name, qiraah_name, riwayah_name, completion_date } = data.certificate;
  if (registration_number !== number) return reply({ error: 'unavailable' }, 503);
  return reply({
   status: 'verified',
   certificate: { registration_number, student_name, issuer_name, qiraah_name, riwayah_name, completion_date },
  });
 } catch { return reply({error:'unavailable'},503); }
}
