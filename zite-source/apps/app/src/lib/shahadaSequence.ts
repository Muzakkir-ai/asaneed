import {zite} from 'zitejs/db';

/** Numbers are ordered chronologically for the initial one-time backfill.
 * Subsequent certificates continue with the next number, regardless of their completion date. */
export async function nextShahadaNumber():Promise<number>{
  const {records,hasMore}=await zite.certificates.findAll({limit:2000});
  if(hasMore)throw new Error('يلزم مراجعة ترقيم الشهادات قبل إصدار شهادة جديدة');
  const current=Math.max(0,...records.map(r=>r.shahadaNumber||0));
  if(records.some(r=>!r.shahadaNumber))throw new Error('يلزم إكمال ترقيم الشهادات المحفوظة');
  return current+1;
}
