import {zite} from 'zitejs/db';
import {context} from '../compat/context';
import {assembleIjazah} from './assembleIjazah';
import {parseFormatting} from './sanadFormatting';
import {readingIdentityFromHeading} from './riwayahSvgHeading';
import {canUsePersonalSanad,sanadInChain,sanadBlockMessage,reachesJunction} from './personalSanadValidation';
const one=(v?:string|string[])=>Array.isArray(v)?v[0]:v;
export async function getCurrentSanadForIssuance(sanadId:string,uid:string,{persist=true}:{persist?:boolean}={}){
 const sanad=await zite.asaneed.findOne({id:sanadId}).catch(()=>null);
 if(!sanad||one(sanad.shaykh)!==uid)throw new Error('السند غير موجود لهذا الحساب');
 // Additional-shaykh drafts use the chain validated when they were created or
 // transferred. Previewing must not rewrite their preserved sanad.
 if(sanad.additionalShaykh){
  const guest=await zite.additionalShaykhs.findOne({id:sanad.additionalShaykh});
  if(!guest||!sanad.chain||!(['ubaydi','jazari'] as const).some(junction=>reachesJunction({personalChain:sanad.chain,junction})))throw new Error(sanadBlockMessage);
  return sanad.chain;
 }
 const sourceOwner=uid;
 const {records:preps}=await zite.preparedIjazahs.findAll({filters:{ownerId:sourceOwner},limit:2000});
 const prep=preps.find(p=>p.sanadId===sanad.id);
 if(!prep)throw new Error(sanadBlockMessage);
 const holding=await zite.ijazahHoldings.findOne({id:prep.holdingId||''}).catch(()=>null);
 if(!holding||holding.ownerId!==sourceOwner)throw new Error('الإجازة المرتبطة بهذا السند حُذفت؛ اختر إجازة محفوظة أخرى');
 if(!canUsePersonalSanad(holding as typeof holding & {personalSanadConfirmed?:boolean}))throw new Error(sanadBlockMessage);
 const {records:sections}=await zite.sanadSections.findAll({limit:2000});
 const result=assembleIjazah({...holding,rawi:prep.rawi||holding.rawi||''} as Parameters<typeof assembleIjazah>[0],sections.map(s=>({id:s.id,title:s.title||'',body:s.body||'',sectionType:s.sectionType||'',formatting:s.formatting||''})));
 if(result.missing.length)throw new Error('السند غير مكتمل: '+result.missing.join('، '));
 if(!sanadInChain(result.chain,holding.personalChain||''))throw new Error(sanadBlockMessage);
 if(persist&&result.chain!==sanad.chain&&!context().scope?.readOnly)await zite.asaneed.update({id:sanad.id,record:{chain:result.chain}});
 return result.chain;
}
export async function collectSnapshotFormatting(sanadId:string,uid:string,chain:string){
 const sanad=await zite.asaneed.findOne({id:sanadId});
 const sourceOwner=sanad?.additionalShaykh?'guest:'+sanad.additionalShaykh:uid;
 const [{records:sections},{records:holdings},{records:styles}]=await Promise.all([
  zite.sanadSections.findAll({limit:2000}),
  zite.ijazahHoldings.findAll({filters:{ownerId:sourceOwner},limit:2000}),
  zite.sanadPrintStyles.findAll({filters:{sanadId},limit:50}),
 ]);
 const body=chain.replace(/^【بيان القراءة:[^】]+】\s*/, '');
 const phrases:{text:string;font:string;size:number;color:string}[]=[];
 for(const item of [...sections.filter(s=>!s.ownerId),...holdings]){
  const formatting=item.formatting;
  if(!formatting)continue;
  const parsed=parseFormatting(formatting);
  const source=('body' in item?item.body:('personalChain' in item?item.personalChain:''))||'';
  const core=source.trim().replace(/[.،؛\s]+$/u,'');
  if(core.length>=20&&body.includes(core))phrases.push({text:core,font:parsed.font,size:parsed.size,color:parsed.color});
  for(const p of parsed.phrases)if(body.includes(p.text))phrases.push(p);
 }
 const latest=styles.find(x=>x.ownerId===uid&&!!x.settings);
 const heading=chain.match(/^【بيان القراءة:([^】]+)】/)?.[1]||'';
 const reading=readingIdentityFromHeading(heading);
 let palette: {primaryColor:string;secondaryColor:string}|null=null;
 if(reading){
   const {records:colors}=await zite.riwayahPrintColors.findAll({filters:{qariId:reading.qariId},limit:50});
   const found=colors.find(c=>c.rawi===reading.rawi);
   if(found)palette={primaryColor:found.primaryColor||'#926e35',secondaryColor:found.secondaryColor||'#075f69'};
 }
 let settings:unknown=null;
 try{settings=latest?.settings?JSON.parse(latest.settings):null;}catch{}
 return JSON.stringify({phrases:phrases.slice(0,180),settings,palette});
}

/** Resolve a draft afresh; old certificates with an unavailable original holding
 * still preview safely from their issuer-owned preserved text, not another sanad. */
export async function getDraftSanadForCertificate(sanadId:string,issuer:string,certificateId:string){
 try{return {chain:await getCurrentSanadForIssuance(sanadId,issuer,{persist:false}),source:'current' as const};}
 catch(error){
  const {records}=await zite.certificateSnapshots.findAll({filters:{certificateId},limit:100});
  const saved=records.find(s=>s.ownerId===issuer&&!!s.chain?.trim());
  if(saved?.chain)return {chain:saved.chain,source:'saved' as const};
  throw error;
 }
}
