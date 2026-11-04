export type MatnUsage={id:string;ownerName:string;source:'personal'|'additional';sanadText:string;wordingText:string;sanadFormatting:string;createdAt:string};
type Row={id:string;payload:Record<string,unknown>};
/** Exact catalog links only: matching names do not establish ownership or identity. */
export function collectMatnUsage(catalogId:string,personal:Row[],extensions:Row[],accounts:{id:string;display_name:string;auth_user_id:string|null;legacy_auth_id?:string|null}[],issuers:{id:string;display_name:string}[]):MatnUsage[]{
 const rows:MatnUsage[]=[];const text=(value:unknown)=>typeof value==='string'?value:'';
 for(const row of personal){const p=row.payload;if(p.catalogId!==catalogId)continue;const owner=accounts.find(a=>[a.id,a.auth_user_id,a.legacy_auth_id].includes(text(p.ownerId)));rows.push({id:row.id,ownerName:owner?.display_name||'حساب غير مرتبط بدليل المستخدمين',source:'personal',sanadText:text(p.sanadText),wordingText:text(p.wordingText),sanadFormatting:text(p.sanadFormatting),createdAt:text(p.createdAtText)});}
 for(const row of extensions){const p=row.payload;let mutoon:unknown;try{mutoon=JSON.parse(text(p.mutoonJson)||'[]');}catch{continue;}if(!Array.isArray(mutoon))continue;for(const [index,item] of mutoon.entries()){if(!item||typeof item!=='object'||item.catalogId!==catalogId)continue;rows.push({id:row.id+':'+index,ownerName:issuers.find(s=>s.id===p.shaykhId)?.display_name||text(p.name)||'شيخ إضافي',source:'additional',sanadText:text(item.sanadText),wordingText:text(item.wordingText),sanadFormatting:text(item.sanadFormatting),createdAt:''});}}
 return rows;
}
