import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
export default createEndpoint({ description:'Change own displayed name', authenticated:true, inputSchema:z.object({name:z.string().trim().min(2).max(100)}), outputSchema:z.object({success:z.boolean()}), execute:async ({input,context})=>{ const words=input.name.trim().split(/\s+/); await zite.auth.updateUserProfile(context.user.id,{firstName:words[0],lastName:words.slice(1).join(' ')}); return {success:true}; } });