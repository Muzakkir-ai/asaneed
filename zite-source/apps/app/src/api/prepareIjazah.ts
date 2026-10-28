import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {assembleIjazah} from '../lib/assembleIjazah';
import {QURRA} from '../lib/qurra';
import {canUsePersonalSanad,sanadBlockMessage} from '../lib/personalSanadValidation';
export default createEndpoint({
 description:'Prepare one stable, automatically assembled sanad per held ijazah, updating it instead of creating duplicates',
 authenticated:true,
 inputSchema:z.object({holdingId:z.string(),rawi:z.string().optional(),ownerId:z.string().optional()}),
 outputSchema:z.object({sanadId:z.string(),updated:z.boolean(),heading:z.string()}),
 execute:async({input,context})=>{
  const admin=(await isAppAdmin(context.user.email));
  const uid=admin&&input.ownerId?input.ownerId:context.user.id;
  if(!admin&&uid!==context.user.id)throw new Error('غير مصرح');
  const holding=await zite.ijazahHoldings.findOne({id:input.holdingId}).catch(()=>null);
  if(!holding||holding.ownerId!==uid)throw new Error('الإجازة غير متاحة');
  if(!canUsePersonalSanad(holding as typeof holding & {personalSanadConfirmed?:boolean}))throw new Error(sanadBlockMessage);
  const q=QURRA.find(q=>q.id===holding.qariId);
  if(!q)throw new Error('القراءة غير معروفة');
  const selectedRawi=input.rawi||holding.rawi||'';
  if(!selectedRawi)throw new Error('إصدار الشهادة برواية واحدة فقط؛ اختر إحدى الروايتين');
  if(!q.rawis.some(r=>r===selectedRawi)||(holding.rawi&&holding.rawi!==selectedRawi))throw new Error('الرواية غير متاحة في إجازتك');
  const {records:sections}=await zite.sanadSections.findAll({limit:2000});
  const assembled=assembleIjazah({...holding,rawi:selectedRawi} as Parameters<typeof assembleIjazah>[0],sections.map(s=>({id:s.id,title:s.title||'',body:s.body||'',sectionType:s.sectionType||'',formatting:s.formatting||''})));
  if(assembled.missing.length)throw new Error('لم تكتمل الأسانيد: '+assembled.missing.join('، '));
  const {records:preparations}=await zite.preparedIjazahs.findAll({filters:{ownerId:uid},limit:2000});
  const existing=preparations.find(p=>p.holdingId===holding.id&&(p.rawi||'')===selectedRawi);
  const sig=JSON.stringify({chain:assembled.chain,sectionIds:assembled.sectionIds,holdingId:holding.id,rawi:selectedRawi});
  if(existing){
    const sanad=existing.sanadId?await zite.asaneed.findOne({id:existing.sanadId}).catch(()=>null):null;
    const owner=Array.isArray(sanad?.shaykh)?sanad.shaykh[0]:sanad?.shaykh;
    if(sanad&&owner===uid){
      if(sanad.chain!==assembled.chain){await zite.asaneed.update({id:sanad.id,record:{chain:assembled.chain,title:`${selectedRawi||holding.name||'إجازة'} — السند المعتمد`}});}
      await zite.preparedIjazahs.update({id:existing.id,record:{sourceSignature:sig}});
      return {sanadId:sanad.id,updated:true,heading:assembled.heading};
    }
  }
  const record=await zite.asaneed.create({record:{title:`${selectedRawi||holding.name||'إجازة'} — السند المعتمد`,chain:assembled.chain,qiraah:null,shaykh:uid,certificates:null}});
  if(existing)await zite.preparedIjazahs.update({id:existing.id,record:{sanadId:record.id,rawi:selectedRawi,sourceSignature:sig}});
  else await zite.preparedIjazahs.create({record:{name:selectedRawi||holding.name||'إجازة',ownerId:uid,holdingId:holding.id,rawi:selectedRawi,sanadId:record.id,sourceSignature:sig}});
  return {sanadId:record.id,updated:false,heading:assembled.heading};
 }
});
