import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { isAppAdmin } from '../lib/admin';

const KEY = 'default';
const out = z.object({ repository: z.string(), branch: z.string() });

/** Reads (anyone) or saves (admins) the GitHub repo that hosts fonts & artwork. Not part of backups. */
export default createEndpoint({
  description: 'Reads or saves the GitHub repository the site loads fonts and artwork from',
  inputSchema: z.object({ repository: z.string().optional(), branch: z.string().optional() }),
  outputSchema: out,
  execute: async ({ input, context }) => {
    const { records } = await zite.assetSources.findAll({ filters: { key: KEY }, limit: 1 });
    const existing = records[0];
    if (input.repository === undefined) {
      return { repository: existing?.gitHubRepository ?? '', branch: existing?.branch || 'main' };
    }
    if (!(await isAppAdmin(context.user?.email))) {
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Admins only', userFacingMessage: 'هذا الإعداد للمشرفين فقط' } as never);
    }
    const repository = input.repository.trim();
    if (repository && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repository)) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Invalid repo', userFacingMessage: 'أدخل رابط مستودع GitHub صحيحاً مثل https://github.com/user/repo' } as never);
    }
    const branch = (input.branch || 'main').trim();
    await zite.assetSources.bulkCreate({ records: [{ key: KEY, gitHubRepository: repository, branch }], matchOn: ['key'] });
    return { repository, branch };
  },
});
