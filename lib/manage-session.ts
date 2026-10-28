import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
export async function managementSession() {
 const client=await createClient();
 const {data,error}=await client.auth.getClaims();
 if(error || !data?.claims.sub) redirect('/login');
 const result=await client.from('accounts').select('id,display_name,role,active').eq('auth_user_id',data.claims.sub).maybeSingle();
 if(result.error) throw new Error('Unable to load account');
 return {client,account:result.data,claims:data.claims};
}
