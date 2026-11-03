import 'server-only';
import {validEmail} from './auth';
import {normalizeUsername,validUsername} from './usernames';
import type {SupabaseClient} from '@supabase/supabase-js';
/** Alias resolution never reaches the browser. Passwords still go through Supabase Auth. */
export async function loginEmail(client:SupabaseClient,identifier:string):Promise<string|null>{
 const value=identifier.trim();
 if(validEmail(value))return value;
 const username=normalizeUsername(value),key=process.env.USERNAME_LOOKUP_KEY;
 if(!validUsername(username)||!key)return null;
 const {data,error}=await client.rpc('resolve_account_username',{login_username:username,lookup_key:key});
 return !error&&typeof data==='string'&&validEmail(data)?data:null;
}
