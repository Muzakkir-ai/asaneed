import {ensureCertificateRegistration} from '../lib/certificateRegistration';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';
import {QURRA} from '../lib/qurra';
import {assembleIjazah} from '../lib/assembleIjazah';
import {reachesJunction} from '../lib/personalSanadValidation';
import {nextShahadaNumber} from '../lib/shahadaSequence';

const choice=z.object({qariId:z.string(),rawi:z.string()});
const matn=z.object({name:z.string().trim().min(1).max(200),category:z.string().trim().min(1).max(120),sanadText:z.string().trim().min(1).max(60000),wordingText:z.string().max(30000).default(''),introductionId:z.string().default(''),conclusionId:z.string().default(''),sanadFormatting:z.string().default('')});
const shaykh=z.object({
 id:z.string(),name:z.string(),qualification:z.string(),teachingRole:z.string(),
 madrasaName:z.string(),madrasaPlace:z.string(),personalChain:z.string(),
 routes:z.array(z.object({qariId:z.string(),rawi:z.string(),tariqNumber:z.string(),tariqName:z.string()})),junction:z.enum(['ubaydi','jazari']),readings:z.array(choice),email:z.string(),mutoon:z.array(matn),
});
export default createEndpoint({
 description:'Shared extra sheikh profiles and administrator-supervised sanad drafts',
 authenticated:true,
 inputSchema:z.object({
   action:z.enum(['list','save','issue']).default('list'),id:z.string().optional(),
   name:z.string().optional(),qualification:z.string().optional(),teachingRole:z.string().optional(),
   madrasaName:z.string().optional(),madrasaPlace:z.string().optional(),
   personalChain:z.string().optional(),junction:z.enum(['ubaydi','jazari']).optional(),
   readings:z.array(choice).optional(),email:z.string().email().or(z.literal('')).optional(),mutoon:z.array(matn).max(100).optional(),
   tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).default(''),qariId:z.string().optional(),rawi:z.string().optional(),studentName:z.string().optional(),
   completionDate:z.string().optional(),hijriDayOffset:z.number().int().min(-2).max(2).optional(),notes:z.string().max(10000).optional(),
 }),
 outputSchema:z.object({sheikhs:z.array(shaykh),createdCertificateId:z.string().optional()}),
 execute:async({input,context})=>{
  if(!(await isAppAdmin(context.user.email)))throw new Error('Permission denied');
  const {records:extensions}=await zite.additionalShaykhExtensions.findAll({limit:2000});
  const extensionFor=(id:string)=>extensions.find(e=>e.shaykhId===id);
  const {records:routeRecords}=await zite.additionalShaykhReadingSanads.findAll({limit:2000});
  const serialize=(x:any)=>{
    let readings: {qariId:string;rawi:string}[]=[];
    try{readings=JSON.parse(x.readingsJson||'[]');}catch{}
    const extension=extensionFor(x.id);let mutoon: z.infer<typeof matn>[]=[];try{mutoon=matn.array().parse(JSON.parse(extension?.mutoonJson||'[]'));}catch{}
    return {routes:routeRecords.filter(r=>r.shaykhId===x.id&&r.tariqNumber&&r.tariqName).map(r=>({qariId:r.qariId||'',rawi:r.rawi||'',tariqNumber:r.tariqNumber||'',tariqName:r.tariqName||''})),id:x.id,email:extension?.email||'',mutoon,name:x.name||'',qualification:x.qualification||'',teachingRole:x.teachingRole||'',
      madrasaName:x.madrasaName||'',madrasaPlace:x.madrasaPlace||'',personalChain:x.personalChain||'',
      junction:(x.junction==='jazari'?'jazari':'ubaydi') as 'ubaydi'|'jazari',readings};
  };
  let createdCertificateId: string|undefined;
  if(input.action==='save'){
   const name=(input.name||'').trim(),personalChain=(input.personalChain||'').trim();
   const readings=input.readings||[];
   if(name.length<3||name.length>220)throw new Error('Enter a valid sheikh name');
   if(personalChain&&(personalChain.length<25||personalChain.length>30000||!reachesJunction({personalChain,junction:input.junction||'ubaydi'})))throw new Error('The general sanad must reach Ibn al-Jazari or Ibrahim al-Ubaydi');
   if(!readings.length&&!input.mutoon?.length)throw new Error('Add a qiraat riwayah or a matn');
   if(readings.some(r=>!QURRA.some(q=>q.id===r.qariId&&q.rawis.some(v=>v===r.rawi))))throw new Error('Choose the ijazah riwayat');
   const existing=input.id?await zite.additionalShaykhs.findOne({id:input.id}).catch(()=>null):null;
   if(input.id&&!existing)throw new Error('Unknown sheikh');
   const record={name,qualification:input.qualification?.trim()||'',teachingRole:input.teachingRole?.trim()||'',
    madrasaName:input.madrasaName?.trim()||'',madrasaPlace:input.madrasaPlace?.trim()||'',
    readingsJson:JSON.stringify([...new Map(readings.map(x=>[x.qariId+'|'+x.rawi,x])).values()]),
    personalChain,junction:input.junction||'ubaydi',createdBy:existing?.createdBy||context.user.id};
   const saved=existing?await zite.additionalShaykhs.update({id:existing.id,record}):await zite.additionalShaykhs.create({record});
   const extension=extensionFor(saved.id);const extRecord={name:name,shaykhId:saved.id,email:input.email?.trim().toLowerCase()||'',mutoonJson:JSON.stringify(input.mutoon||[])};
   if(extension)await zite.additionalShaykhExtensions.update({id:extension.id,record:extRecord});
   else await zite.additionalShaykhExtensions.create({record:extRecord});
  }
  if(input.action==='issue'){
   const guest=input.id?await zite.additionalShaykhs.findOne({id:input.id}).catch(()=>null):null;
   if(!guest)throw new Error('Select an additional sheikh');
   const known=serialize(guest);
   if(!input.studentName?.trim()||!input.completionDate)throw new Error('Student and completion date required');
   const imam=QURRA.find(q=>q.id===input.qariId);
   if(!imam)throw new Error('اختر قراءة صحيحة');
   const rawis=input.rawi?[input.rawi]:[...imam.rawis];
   if(rawis.some(rawi=>!known.readings.some(r=>r.qariId===imam.id&&r.rawi===rawi)))throw new Error('هذه القراءة أو الرواية غير مضافة للمُجيز');
   const {records:specific}=await zite.additionalShaykhReadingSanads.findAll({filters:{shaykhId:guest.id},limit:2000});
   const {records:all}=await zite.sanadSections.findAll({limit:2000});
   const shared=all.filter(x=>!x.ownerId);
   const intro=shared.find(x=>x.sectionType==='introduction');
   const wording=shared.find(x=>x.title==='كلمات الإجازة'&&x.sectionType==='wording')||shared.find(x=>x.sectionType==='wording');
   const {records:holdings}=await zite.ijazahHoldings.findAll({filters:{ownerId:'guest:'+guest.id},limit:2000});
   // Validate both riwayat before creating either draft.
   const entries=rawis.map(rawi=>{
    const selected=specific.find(x=>x.qariId===imam.id&&x.rawi===rawi&&(x.tariqNumber||'')===input.tariqNumber);
    if(input.tariqNumber&&!selected)throw Error('لم يُحفظ سند هذا الطريق لهذه الرواية');
    const source=holdings.find(x=>x.qariId===imam.id&&x.rawi===rawi)||holdings.find(x=>x.qariId===imam.id&&!x.rawi);
    const chain=selected?.sanadText||known.personalChain;
    const junction=selected?.junction||known.junction;
    if(input.tariqNumber?chain.length<100:!reachesJunction({personalChain:chain,junction}))throw new Error('Sheikh sanad does not reach its junction');
    const assembled=assembleIjazah({tariqNumber:input.tariqNumber,tariqName:selected?.tariqName,qariId:imam.id,rawi,personalChain:chain,junction,
      introductionId:source?.introductionId||intro?.id,wordingId:source?.wordingId||wording?.id},
      all.filter(x=>!x.ownerId||x.ownerId==='guest:'+guest.id).map(x=>({id:x.id,title:x.title||'',sectionType:x.sectionType||'',body:x.body||'',formatting:x.formatting||''})));
    if(assembled.missing.length||!assembled.chain)throw new Error('Incomplete sanad: '+assembled.missing.join('، '));
    return {rawi,assembled,tariqName:selected?.tariqName||'',bookAuthor:selected?.bookAuthor||'',routeSource:selected?.routeSource||''};
   });
   const created:{certificateId:string;sanadId:string;snapshotId:string}[]=[];
   const number=await nextShahadaNumber();
   try{
    for(const [index,{rawi,assembled,tariqName,bookAuthor,routeSource}] of entries.entries()){
     const sanad=await zite.asaneed.create({record:{tariqNumber:input.tariqNumber,tariqName,bookAuthor,routeSource,title:known.name+' — '+rawi+' — سند خاص',
       shaykh:context.user.id,additionalShaykh:known.id,chain:assembled.chain,qiraah:null,certificates:null}});
     const row={certificateId:'',sanadId:sanad.id,snapshotId:''};created.push(row);
     const cert=await zite.certificates.create({record:{
       studentName:input.studentName!.trim(),completionDate:input.completionDate!,
       sanad:sanad.id,shaykh:context.user.id,publicationStatus:'draft',shahadaNumber:number+index,
       hijriDayOffset:input.hijriDayOffset??0,notes:input.notes||'',additionalShaykh:known.id
     }});
     row.certificateId=cert.id;
     await ensureCertificateRegistration(cert.id);
     const snapshot=await zite.certificateSnapshots.create({record:{name:'مسودة '+cert.id,certificateId:cert.id,
       ownerId:context.user.id,chain:assembled.chain,heading:assembled.heading,formatting:'',issuedAt:''}});
     row.snapshotId=snapshot.id;
    }
    createdCertificateId=created[0]?.certificateId;
    // Keep a reusable student list specific to this additional sheikh, shared by both admins.
    const studentName=input.studentName.normalize('NFKC').trim().replace(/\s+/gu,' ');
    try{
     const ownerId='guest:'+known.id;
     const {records:students}=await zite.students.findAll({filters:{ownerId},limit:2000});
     if(!students.some(row=>(row.name||'').normalize('NFKC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('ar')===studentName.toLocaleLowerCase('ar')))
      await zite.students.create({record:{name:studentName,ownerId}});
    }catch{/* Student autocomplete is auxiliary; the draft was already issued. */}
   }catch(e){
    for(const row of [...created].reverse()){
     if(row.snapshotId)await zite.certificateSnapshots.delete({id:row.snapshotId}).catch(()=>{});
     if(row.certificateId)await zite.certificates.delete({id:row.certificateId}).catch(()=>{});
     await zite.asaneed.delete({id:row.sanadId}).catch(()=>{});
    }
    throw e;
   }
  }
  const {records:all}=await zite.additionalShaykhs.findAll({limit:2000});
  return {sheikhs:all.map(serialize),...(createdCertificateId?{createdCertificateId}:{})};
 }
});
