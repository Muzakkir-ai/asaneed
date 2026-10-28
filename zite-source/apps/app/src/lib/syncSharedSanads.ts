import {zite} from 'zitejs/db';
import {assembleIjazah} from './assembleIjazah';

/** Propagate administrator edits into prepared asaneed and their certificate copies.
 * Existing certificate records, students, and issue dates are never changed. */
export async function syncSharedSanads(oldText?:string,newText?:string){
 const [{records:sections},{records:preps},{records:holdings},{records:sanads},{records:snapshots}]=await Promise.all([
  zite.sanadSections.findAll({limit:2000}),zite.preparedIjazahs.findAll({limit:2000}),
  zite.ijazahHoldings.findAll({limit:2000}),zite.asaneed.findAll({limit:2000}),
  zite.certificateSnapshots.findAll({limit:2000}),
 ]);
 const normalized=(s:string)=>s.replace(/\(ح\)\.\s*\n\s*(?=وقرأ)/gu,'(ح). ');
 const sourceSections=sections.map(s=>({id:s.id,title:s.title||'',body:s.body||'',sectionType:s.sectionType||'',formatting:s.formatting||''}));
 const replacements=oldText&&newText?[{from:oldText.trim().replace(/[.،؛\s]+$/u,''),to:newText.trim().replace(/[.،؛\s]+$/u,'')}]:[];
 const refreshed=new Map<string,string>();
 for(const prep of preps){
  const h=holdings.find(x=>x.id===prep.holdingId&&x.ownerId===prep.ownerId);
  const old=sanads.find(x=>x.id===prep.sanadId);
  if(!h||!old||!prep.rawi||!h.qariId)continue;
  const assembled=assembleIjazah({...h,qariId:h.qariId,personalChain:h.personalChain||'',junction:h.junction||'ubaydi',rawi:prep.rawi},sourceSections);
  if(assembled.missing.length)continue;
  const fresh=normalized(assembled.chain);
  if(fresh!==old.chain)await zite.asaneed.update({id:old.id,record:{chain:fresh}});
  refreshed.set(old.id,fresh);
 }
 // Manually stored chains cannot be reconstructed; replace only exact matching
 // section text, preserving all other wording and original ownership.
 const apply=(value:string)=>{
  let output=normalized(value);
  for(const {from,to} of replacements)if(from&&output.includes(from))output=output.replaceAll(from,to);
  return output;
 };
 for(const sanad of sanads){
  if(refreshed.has(sanad.id))continue;
  const next=apply(sanad.chain||'');
  if(next!==sanad.chain)await zite.asaneed.update({id:sanad.id,record:{chain:next}});
  refreshed.set(sanad.id,next);
 }
 const {records:certs}=await zite.certificates.findAll({limit:2000});
 for(const snapshot of snapshots){
  const cert=certs.find(x=>x.id===snapshot.certificateId);
  const sanadId=cert?(Array.isArray(cert.sanad)?cert.sanad[0]:cert.sanad):undefined;
  const next=sanadId&&refreshed.has(sanadId)?refreshed.get(sanadId)!:apply(snapshot.chain||'');
  if(next!==snapshot.chain)await zite.certificateSnapshots.update({id:snapshot.id,record:{chain:next}});
 }
 return {prepared:refreshed.size,snapshots:snapshots.length};
}
