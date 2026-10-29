import {ensureCertificateRegistration} from '../lib/certificateRegistration';
import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {QURRA} from '../lib/qurra';
import {nextShahadaNumber} from '../lib/shahadaSequence';
import {assembleIjazah} from '../lib/assembleIjazah';
import {canUsePersonalSanad} from '../lib/personalSanadValidation';


export default createEndpoint({
  description:'Issue two distinct narrator certificates for one qiraah on the same completion date',
  authenticated:true,
  inputSchema:z.object({tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).default(''),qariId:z.string(),studentName:z.string().trim().min(2),completionDate:z.string().min(1),hijriDayOffset:z.number().int().min(-2).max(2).default(0),notes:z.string(),ownerId:z.string().optional()}),
  outputSchema:z.object({ids:z.array(z.string())}),
  execute:async({input,context})=>{
    const admin=(await isAppAdmin(context.user.email));
    const owner=admin&&input.ownerId?input.ownerId:context.user.id;
    if(admin&&owner!==context.user.id){
      const users=await zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000});
      if(!users.records.some(u=>u.id===owner))throw new Error('المُجيز غير موجود');
    }
    const imam=QURRA.find(q=>q.id===input.qariId);
    if(!imam)throw new Error('القراءة غير معروفة');
    const [{records:holdings},{records:sections},{records:preparations}]=await Promise.all([
      zite.ijazahHoldings.findAll({filters:{ownerId:owner},limit:2000}),
      zite.sanadSections.findAll({limit:2000}),
      zite.preparedIjazahs.findAll({filters:{ownerId:owner},limit:2000}),
    ]);
    // An individually saved riwayah takes precedence over a shared qiraah sanad.
    const entries=imam.rawis.map(rawi=>{
      const holding=holdings.find(h=>h.qariId===imam.id&&h.rawi===rawi&&(h.tariqNumber||'')===input.tariqNumber)
        ||holdings.find(h=>h.qariId===imam.id&&!h.rawi&&(h.tariqNumber||'')===input.tariqNumber);
      if(!holding||holding.ownerId!==owner||!canUsePersonalSanad(holding))
        throw new Error(`أكمل سند رواية ${rawi} قبل إصدار الشهادات`);
      const assembled=assembleIjazah({tariqNumber:holding.tariqNumber,tariqName:holding.tariqName,qariId:imam.id,rawi,personalChain:holding.personalChain||'',junction:holding.junction||'ubaydi',introductionId:holding.introductionId||'',wordingId:holding.wordingId||''},sections.map(s=>({id:s.id,title:s.title||'',body:s.body||'',sectionType:s.sectionType||'',formatting:s.formatting||''})));
      if(assembled.missing.length)throw new Error(`سند ${rawi} غير مكتمل: ${assembled.missing.join('، ')}`);
      return {rawi,holding,assembled};
    });
    const nextNumber=await nextShahadaNumber();
    const created:{id:string}[]=[];
    try{
      for(const [index,{rawi,holding,assembled}] of entries.entries()){
        const previous=preparations.find(p=>p.holdingId===holding.id&&p.rawi===rawi);
        let sanad=previous?.sanadId?await zite.asaneed.findOne({id:previous.sanadId}).catch(()=>null):null;
        const sanadOwner=Array.isArray(sanad?.shaykh)?sanad?.shaykh[0]:sanad?.shaykh;
        if(!sanad||sanadOwner!==owner){
          sanad=await zite.asaneed.create({record:{title:`${rawi} — السند المعتمد`,chain:assembled.chain,qiraah:null,shaykh:owner,certificates:null}});
        }else if(sanad.chain!==assembled.chain){
          await zite.asaneed.update({id:sanad.id,record:{chain:assembled.chain}});
        }
        const sourceSignature=JSON.stringify({chain:assembled.chain,sectionIds:assembled.sectionIds,holdingId:holding.id,rawi});
        if(previous)await zite.preparedIjazahs.update({id:previous.id,record:{sanadId:sanad.id,sourceSignature}});
        else await zite.preparedIjazahs.create({record:{name:rawi,ownerId:owner,holdingId:holding.id,rawi,sanadId:sanad.id,sourceSignature}});
        const cert=await zite.certificates.create({record:{studentName:input.studentName.trim(),completionDate:input.completionDate,hijriDayOffset:input.hijriDayOffset,shahadaNumber:nextNumber+index,publicationStatus:'draft',sanad:sanad.id,shaykh:owner,notes:input.notes}});
        created.push({id:cert.id});
        await ensureCertificateRegistration(cert.id);
      }
    }catch(error){
      // Avoid a half-issued qiraah when one of the two certificates fails.
      for(const row of [...created].reverse()){
        await zite.certificates.delete({id:row.id}).catch(()=>{});
      }
      throw error;
    }
    const studentName=input.studentName.normalize('NFKC').trim().replace(/\s+/gu,' ');
    try{
      const {records:students}=await zite.students.findAll({filters:{ownerId:owner},limit:2000});
      if(!students.some(s=>(s.name||'').normalize('NFKC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('ar')===studentName.toLocaleLowerCase('ar')))
        await zite.students.create({record:{name:studentName,ownerId:owner}});
    }catch{/* Student directory is auxiliary; both certificates already exist. */}
    return {ids:created.map(c=>c.id)};
  },
});
