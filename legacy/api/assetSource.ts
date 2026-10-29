import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { isAppAdmin } from '../lib/admin';

import {artworkListSchema,discoverArtwork} from '../lib/artworkCatalog';
import {context as requestContext} from '../compat/context';
const KEY = 'default';
const out = z.object({ repository: z.string(), branch: z.string(), revision:z.string(),artwork:artworkListSchema,issuerDirectory:z.array(z.object({number:z.string(),name:z.string()})) });

/** Reads (anyone) or saves (admins) the GitHub repo that hosts fonts & artwork. Included in application-data backups. */
export default createEndpoint({
  description: 'Reads or saves the GitHub repository the site loads fonts and artwork from',
  inputSchema: z.object({ repository: z.string().optional(), branch: z.string().optional(), refresh:z.boolean().optional() }),
  outputSchema: out,
  execute: async ({ input, context }) => {
    const { records } = await zite.assetSources.findAll({ filters: { key: KEY }, limit: 1 });
    const existing = records[0];
    const admin=await isAppAdmin(context.user?.email);
    const {data:issuers,error}=admin?await requestContext().client.from('issuers').select('issuer_code,display_name').order('issuer_code'):{data:[],error:null};
    if(error)throw Error(error.message);
    const issuerDirectory=(issuers||[]).map((i:any)=>({number:i.issuer_code,name:i.display_name}));
    const savedArtwork=artworkListSchema.catch([]).parse(existing?.artwork||[]);
    if (input.repository === undefined && !input.refresh) {
      return { repository: existing?.gitHubRepository ?? '', branch: existing?.branch || 'main',revision:existing?.revision||'',artwork:savedArtwork,issuerDirectory };
    }
    if (!(await isAppAdmin(context.user?.email))) {
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Admins only', userFacingMessage: 'هذا الإعداد للمشرفين فقط' } as never);
    }
    const repository = (input.repository??existing?.gitHubRepository??'').trim();
    if (repository && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repository)) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Invalid repo', userFacingMessage: 'أدخل رابط مستودع GitHub صحيحاً مثل https://github.com/user/repo' } as never);
    }
    const branch = (input.branch || existing?.branch || 'main').trim();
    if(!/^[A-Za-z0-9_.\/-]+$/.test(branch)||branch.length>180)throw new Error('Invalid branch');
    let revision='';
    if(repository){const repo=repository.match(/github\.com\/([\w.-]+\/[\w.-]+)\/?$/)?.[1];const response=await fetch('https://api.github.com/repos/'+repo+'/commits/'+encodeURIComponent(branch),{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('تعذر جلب آخر تحديث من GitHub. حاول مجددًا.');const commit=await response.json();if(typeof commit.sha!=='string'||! /^[a-f0-9]{40}$/.test(commit.sha))throw new Error('Invalid GitHub revision');revision=commit.sha;}
    const repo=repository.match(/github\.com\/([\w.-]+\/[\w.-]+)\/?$/)?.[1];
    const artwork=repo&&revision?await discoverArtwork(repo,revision):[];
    await zite.assetSources.bulkCreate({ records: [{ key: KEY, gitHubRepository: repository, branch,revision,artwork }], matchOn: ['key'] });
    return { repository, branch,revision,artwork,issuerDirectory };
  },
});
