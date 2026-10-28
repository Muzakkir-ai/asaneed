import {AsyncLocalStorage} from 'node:async_hooks';
import type {SupabaseClient} from '@supabase/supabase-js';
export type User={id:string;name:string;email:string;firstName?:string;lastName?:string;image:string|null;role?:string};
export type Context={client:SupabaseClient;user:User;account:{id:string;role:string;active:boolean};cache?:Map<string,Promise<any>>};
export const requestContext=new AsyncLocalStorage<Context>();
export function context(){const value=requestContext.getStore();if(!value)throw Error('Request context required');return value;}
