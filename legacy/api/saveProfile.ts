import {context as requestContext} from '../compat/context';
import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
export default createEndpoint({ description:'Change own displayed name', authenticated:true, inputSchema:z.object({name:z.string().trim().min(2).max(100)}), outputSchema:z.object({success:z.boolean()}), execute:async ({input,context})=>{ const words=input.name.trim().split(/\s+/); await zite.auth.updateUserProfile(context.user.id,{firstName:words[0],lastName:words.slice(1).join(' ')}); if(requestContext().account.role==='admin'){const {error}=await requestContext().client.rpc('save_personal_issuer_profile',{profile:{}});if(error)throw new Error(error.message);requestContext().cache?.clear();}return {success:true}; } });