import {isAppAdmin} from '../lib/admin';
import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: "Deletes one of the signed-in shaykh's certificates",
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const c = await zite.certificates.findOne({ id: input.id });
    const s = c?.shaykh;
    const mine = Array.isArray(s) ? s.includes(context.user.id) : s === context.user.id;
    if (!c || (!mine&&!(await isAppAdmin(context.user.email)))) throw new ZiteError({ code: 'NOT_FOUND', message: 'Not found', userFacingMessage: 'الشهادة غير موجودة' });
    await zite.certificates.delete({ id: input.id });
    const {records:snapshots}=await zite.certificateSnapshots.findAll({filters:{certificateId:input.id},limit:100});
    for(const snapshot of snapshots){if(snapshot.ownerId=== (Array.isArray(c.shaykh)?c.shaykh[0]:c.shaykh))await zite.certificateSnapshots.delete({id:snapshot.id});}
    return { success: true };
  },
});
