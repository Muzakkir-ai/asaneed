import {automaticSharedBridgeId,composeReferencedPersonalSanad,personalSanadEndsAtSavedNarrator} from '../lib/sharedBridge';
import {guestKubraRoutes,usesLibraryKubra} from '../lib/guestKubra';
import {loadBuilderLibrary} from '../../lib/sanad-library';
import {resolveBuilderPrefix} from '../lib/builderPrefix';
import {builderPreview} from '../lib/bookBuilder';
import {usesSharedSughra} from '../lib/sharedShaykhSanad';
import {prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import {context as requestContext} from '../compat/context';
import {ensureCertificateRegistration} from '../lib/certificateRegistration';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';
import {QURRA} from '../lib/qurra';
import {assembleHoldingIjazah} from '../lib/assembleHoldingIjazah';
import {reachesJunction} from '../lib/personalSanadValidation';
import {nextShahadaNumber} from '../lib/shahadaSequence';

const choice=z.object({qariId:z.string(),rawi:z.string()});
const matn=z.object({id:z.string().uuid().optional(),catalogId:z.string().uuid().optional(),name:z.string().trim().min(1).max(200),category:z.string().trim().min(1).max(120),sanadText:z.string().min(1).max(60000).refine(v=>!!v.trim(),'Complete sanad required'),wordingText:z.string().max(30000).default(''),introductionId:z.string().default(''),conclusionId:z.string().default(''),sanadFormatting:z.string().default('')});
const kubraSanadMode=z.enum(['shared','separate','individual']);
const shaykh=z.object({continuationId:z.string().uuid().nullable().optional(),kubraContinuationId:z.string().uuid().nullable().optional(),kubraSanadMode:kubraSanadMode.default('shared'),individualSughra:z.boolean().default(false),kubraPersonalChain:z.string().default(''),kubraPersonalPersonIds:z.array(z.string()).default([]),kubraJunction:z.enum(['ubaydi','jazari']).default('ubaydi'),libraryKubra:z.boolean().default(false),variants:z.array(choice.extend({id:z.string(),name:z.string()})).default([]),sharedSughraSanad:z.boolean().default(false),personalPersonIds:z.array(z.string()).default([]),preparedShared:z.object({version:z.literal(1),tokens:z.array(z.object({before:z.string(),name:z.string()})),suffix:z.string(),reviewed:z.boolean()}).nullable().optional(),
 id:z.string(),name:z.string(),qualification:z.string(),teachingRole:z.string(),
 madrasaName:z.string(),madrasaPlace:z.string(),personalChain:z.string(),
 routes:z.array(z.object({qariId:z.string(),rawi:z.string(),tariqNumber:z.string(),tariqName:z.string(),automatic:z.boolean().optional()})),junction:z.enum(['ubaydi','jazari']),readings:z.array(choice),email:z.string(),mutoon:z.array(matn),
});
export default createEndpoint({
 description:'Shared extra sheikh profiles and administrator-supervised sanad drafts',
 authenticated:true,
 inputSchema:z.object({
   action:z.enum(['list','save','saveShared','issue']).default('list'),continuationId:z.string().uuid().nullable().optional(),id:z.string().optional(),
   name:z.string().optional(),qualification:z.string().optional(),teachingRole:z.string().optional(),
   madrasaName:z.string().optional(),madrasaPlace:z.string().optional(),
   libraryKubra:z.boolean().optional(),kubraSanadMode:kubraSanadMode.optional(),individualSughra:z.boolean().optional(),sanadScope:z.enum(['sughra','kubra']).optional(),personalSanadId:z.string().uuid().optional(),sharedSughraSanad:z.boolean().optional(),personalPersonIds:z.array(z.string().uuid()).max(100).optional(),personalChain:z.string().optional(),junction:z.enum(['ubaydi','jazari']).optional(),
   readings:z.array(choice).optional(),email:z.string().email().or(z.literal('')).optional(),mutoon:z.array(matn).max(100).optional(),
   tariqNumber:z.string().regex(/^[0-9]{2,4}$/).or(z.literal('')).default(''),qariId:z.string().optional(),rawi:z.string().optional(),studentName:z.string().optional(),
   completionDate:z.string().optional(),hijriDayOffset:z.number().int().min(-2).max(2).optional(),notes:z.string().max(10000).optional(),
 }),
 outputSchema:z.object({sheikhs:z.array(shaykh),createdCertificateId:z.string().optional()}),
 execute:async({input,context})=>{
  if(!(await isAppAdmin(context.user.email)))throw new Error('Permission denied');
  let {records:extensions}=await zite.additionalShaykhExtensions.findAll({limit:2000});
  const extensionFor=(id:string)=>extensions.find(e=>e.shaykhId===id);
  const {records:routeRecords}=await zite.additionalShaykhReadingSanads.findAll({limit:2000});
  const {records:profiles}=await zite.additionalShaykhs.findAll({limit:2000});
  const library=(input.libraryKubra===true||profiles.some(usesLibraryKubra))?await loadBuilderLibrary(requestContext().client):null;
  const automatic=library?guestKubraRoutes(library):[];
  const automaticChoices=automatic.map(({qariId,rawi,tariqNumber,tariqName,automatic})=>({qariId,rawi,tariqNumber,tariqName,automatic}));
  const serialize=(x:any)=>{
    let readings: {qariId:string;rawi:string}[]=[];
    try{readings=JSON.parse(x.readingsJson||'[]');}catch{}
    const extension=extensionFor(x.id);let mutoon: z.infer<typeof matn>[]=[];try{mutoon=matn.array().parse(JSON.parse(extension?.mutoonJson||'[]'));}catch{}
    const libraryKubra=usesLibraryKubra(x);
    const variants=routeRecords.filter(r=>r.shaykhId===x.id&&r.variantName).map(r=>({id:r.id,qariId:r.qariId||'',rawi:r.rawi||'',name:r.variantName!}));
    return {continuationId:x.continuationId,kubraContinuationId:x.kubraContinuationId,libraryKubra,variants,kubraSanadMode:x.kubraSanadMode,individualSughra:x.individualSughra,kubraPersonalChain:x.kubraPersonalChain,kubraPersonalPersonIds:x.kubraPersonalPersonIds,kubraJunction:x.kubraJunction,sharedSughraSanad:usesSharedSughra(x),personalPersonIds:x.personalPersonIds||[],preparedShared:x.prepareSharedNarratorBoxes?prepareSavedSanadPeople(x.personalChain||'',x.sharedPeopleReviewed===true):null,routes:[...(libraryKubra?automaticChoices:[]),...routeRecords.filter(r=>r.shaykhId===x.id&&r.tariqNumber&&r.tariqName).map(r=>({qariId:r.qariId||'',rawi:r.rawi||'',tariqNumber:r.tariqNumber||'',tariqName:r.tariqName||''})).filter(r=>!libraryKubra||!automatic.some(a=>a.tariqNumber===r.tariqNumber&&a.rawi===r.rawi&&a.qariId===r.qariId))],id:x.id,email:extension?.email||'',mutoon,name:x.name||'',qualification:x.qualification||'',teachingRole:x.teachingRole||'',
      madrasaName:x.madrasaName||'',madrasaPlace:x.madrasaPlace||'',personalChain:x.personalChain||'',
      junction:(x.junction==='jazari'?'jazari':'ubaydi') as 'ubaydi'|'jazari',readings};
  };
  let createdCertificateId: string|undefined;
  if(input.action==='saveShared'){
   if(!input.id)throw Error('اختر الشيخ أولًا');
   const existing=await zite.additionalShaykhs.findOne({id:input.id});
   const personalChain=(input.personalChain||'').trim(),junction=input.junction||'ubaydi';
   const savedRef=input.sanadScope==='kubra'?existing.kubraContinuationId:existing.continuationId;
   const continuationId=input.continuationId===undefined?savedRef:input.continuationId;
   if(continuationId){
    const reviewed=library??await loadBuilderLibrary(requestContext().client);
    composeReferencedPersonalSanad(personalChain,input.personalPersonIds??[],reviewed.sharedBridgeGraphs??[],continuationId);
   }
   if(!input.personalPersonIds?.length||(!continuationId&&(input.continuationId===null?!personalSanadEndsAtSavedNarrator(personalChain,input.personalPersonIds??[]):!reachesJunction({personalChain,junction})))||personalChain.length>30000)throw Error('اعتمد الرواة ونقطة الالتقاء قبل حفظ السند المشترك');
   await zite.additionalShaykhs.update({id:existing.id,record:input.sanadScope==='kubra'?{kubraContinuationId:continuationId,kubraPersonalChain:personalChain,kubraJunction:junction,kubraPersonalPersonIds:input.personalPersonIds}:{continuationId,personalChain,junction,personalPersonIds:input.personalPersonIds,prepareSharedNarratorBoxes:!!prepareSavedSanadPeople(personalChain,true),...(input.sharedSughraSanad===undefined?{}:{sharedSughraSanad:input.sharedSughraSanad}),sharedPeopleReviewed:true}});
  }

  if(input.action==='save'){
   const existing=input.id?await zite.additionalShaykhs.findOne({id:input.id}).catch(()=>null):null;
   const name=(input.name||'').trim(),personalChain=(input.personalChain??existing?.personalChain??'').trim();
   const readings=input.readings||[];
   if(name.length<3||name.length>220)throw new Error('Enter a valid sheikh name');
   if(existing?.continuationId!==undefined&&personalChain!==existing.personalChain)throw Error('حرر السند المرتبط بالتتمة من محرر السند الشخصي');
   if(existing?.continuationId===undefined&&personalChain&&(personalChain.length<25||personalChain.length>30000||!reachesJunction({personalChain,junction:input.junction||existing?.junction||'ubaydi'})))throw new Error('The general sanad must reach Ibn al-Jazari or Ibrahim al-Ubaydi');
   if(!readings.length&&!input.mutoon?.length&&!(input.libraryKubra??(existing&&usesLibraryKubra(existing))))throw new Error('Add a qiraat riwayah or a matn');
   if(readings.some(r=>!QURRA.some(q=>q.id===r.qariId&&q.rawis.some(v=>v===r.rawi))))throw new Error('Choose the ijazah riwayat');
   if(input.id&&!existing)throw new Error('Unknown sheikh');
   const previousMutoon=existing?serialize(existing).mutoon:[];
   const mutoon=(input.mutoon??previousMutoon).map(m=>({...m,id:m.id||crypto.randomUUID()}));
   if(new Set(mutoon.map(m=>m.id)).size!==mutoon.length)throw Error('Duplicate matn identity');
   const catalogIds=[...new Set(mutoon.flatMap(item=>item.catalogId?[item.catalogId]:[]))];
   if(catalogIds.length){
    const {data,error}=await requestContext().client.from('matn_catalog')
      .select('id,title,category').in('id',catalogIds).eq('status','published');
    if(error)throw error;
    for(const item of mutoon){
     if(!item.catalogId)continue;
     const match=data?.find(row=>row.id===item.catalogId);
     if(!match)throw Error('اختر متنًا منشورًا');
     item.name=match.title;
     item.category=match.category;
    }
   }
   const record={
    ...(input.kubraSanadMode===undefined?{}:{kubraSanadMode:input.kubraSanadMode}),
    ...(input.individualSughra===undefined?{}:{individualSughra:input.individualSughra}),
    ...(input.sharedSughraSanad===undefined?{}:{sharedSughraSanad:input.sharedSughraSanad}),
    ...(input.libraryKubra===undefined?{}:{libraryKubra:input.libraryKubra}),name,qualification:input.qualification?.trim()||'',teachingRole:input.teachingRole?.trim()||'',
    madrasaName:input.madrasaName?.trim()||'',madrasaPlace:input.madrasaPlace?.trim()||'',
    readingsJson:JSON.stringify([...new Map(readings.map(x=>[x.qariId+'|'+x.rawi,x])).values()]),
    personalChain,junction:input.junction||existing?.junction||'ubaydi',createdBy:existing?.createdBy||context.user.id};
   const saved=existing?await zite.additionalShaykhs.update({id:existing.id,record}):await zite.additionalShaykhs.create({record});
   const extension=extensionFor(saved.id);const extRecord={name:name,shaykhId:saved.id,email:input.email?.trim().toLowerCase()||'',mutoonJson:JSON.stringify(mutoon)};
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
   const catalogRoute=known.libraryKubra?automatic.find(r=>r.tariqNumber===input.tariqNumber&&r.qariId===imam.id&&r.rawi===input.rawi):undefined;
   if(!catalogRoute&&rawis.some(rawi=>!known.readings.some(r=>r.qariId===imam.id&&r.rawi===rawi)))throw new Error('هذه القراءة أو الرواية غير مضافة للمُجيز');
   const {records:specific}=await zite.additionalShaykhReadingSanads.findAll({filters:{shaykhId:guest.id},limit:2000});
   const {records:all}=await zite.sanadSections.findAll({limit:2000});
   const shared=all.filter(x=>!x.ownerId);
   const intro=shared.find(x=>x.sectionType==='introduction');
   const wording=shared.find(x=>x.title==='كلمات الإجازة'&&x.sectionType==='wording')||shared.find(x=>x.sectionType==='wording');
   const {records:holdings}=await zite.ijazahHoldings.findAll({filters:{ownerId:'guest:'+guest.id},limit:2000});
   // Validate both riwayat before creating either draft.
   const entries=await Promise.all(rawis.map(async rawi=>{
    const variant=input.personalSanadId?specific.find(r=>r.shaykhId===guest.id&&r.id===input.personalSanadId&&r.variantName&&r.qariId===imam.id&&r.rawi===rawi&&!r.tariqNumber):undefined;
    if(input.personalSanadId&&!variant)throw Error('اختر سندًا شخصيًا محفوظًا لهذه الرواية');
    if(variant&&input.tariqNumber&&!catalogRoute)throw Error('السند البديل متاح للرواية أو لطريق مرتبط بالمكتبة');
    const useShared=!variant&&usesSharedSughra(known,input.tariqNumber);
    const selected=specific.find(x=>!x.variantName&&x.qariId===imam.id&&x.rawi===rawi&&(x.tariqNumber||'')===input.tariqNumber);
    if(input.tariqNumber&&!selected&&!catalogRoute)throw Error('لم يُحفظ سند هذا الطريق لهذه الرواية');
    const source=holdings.find(x=>x.qariId===imam.id&&x.rawi===rawi)||holdings.find(x=>x.qariId===imam.id&&!x.rawi);
    const kubraChain=known.kubraSanadMode==='separate'?known.kubraPersonalChain:known.personalChain;
    if(!variant&&catalogRoute&&(known.kubraSanadMode==='individual'||(known.kubraSanadMode==='separate'&&!kubraChain)))throw Error('اختر سندًا شخصيًا لهذه الرواية من الكبرى أو احفظ سند الكبرى المشترك في ملف الشيخ');
    if(!variant&&!input.tariqNumber&&known.individualSughra&&!selected?.sanadText)throw Error('احفظ سندًا شخصيًا لهذه الرواية أو اختر سندًا محفوظًا عند الإصدار');
    const composePersonal=async(text:string,ids:string[],reference?:string|null)=>{
     if(!reference&&(!ids.length||reachesJunction({personalChain:text,junction:'jazari'})||(reference===undefined&&reachesJunction({personalChain:text,junction:'ubaydi'}))))return text;
     const reviewed=library??await loadBuilderLibrary(requestContext().client);
     const bridges=reviewed.sharedBridgeGraphs??[];
     const selectedReference=reference||automaticSharedBridgeId(text,ids,bridges);
     if(!selectedReference)throw Error('اختر تتمة مشتركة معتمدة عند نقطة الالتقاء');
     return composeReferencedPersonalSanad(text,ids,bridges,selectedReference);
    };
    const kubraSeparate=known.kubraSanadMode==='separate';
    const catalogPersonal=catalogRoute?await composePersonal(variant?.sanadText||kubraChain,variant?.personalPersonIds??(kubraSeparate?known.kubraPersonalPersonIds:known.personalPersonIds),variant?variant.continuationId:kubraSeparate?known.kubraContinuationId:known.continuationId):'';
    const prefix=catalogRoute?resolveBuilderPrefix(catalogPersonal,library!.prefixContinuations).text:'';
    const preview=catalogRoute?builderPreview(catalogRoute.book,catalogRoute.parent,catalogRoute.route,library!.people,prefix):undefined;
    const personal=variant??(!useShared&&selected?.sanadText?selected:null);
    const savedChain=personal?.sanadText||known.personalChain;
    const chain=preview?.text||(input.tariqNumber?savedChain:await composePersonal(savedChain,personal?.personalPersonIds??known.personalPersonIds,personal?personal.continuationId:known.continuationId));
    const joinedPersonal=!preview&&chain!==savedChain;
    const junction=catalogRoute||joinedPersonal?'jazari':variant?.junction||(useShared?known.junction:selected?.junction||known.junction);
    if(input.tariqNumber?chain.length<100:!reachesJunction({personalChain:chain,junction}))throw new Error('Sheikh sanad does not reach its junction');
    const assemblyHolding={unifiedSanad:catalogRoute?{version:1,routeId:catalogRoute.route.id,prefix}:useShared||variant||joinedPersonal?undefined:selected?(selected.unifiedSanad||undefined):(source?.unifiedSanad||undefined),tariqNumber:input.tariqNumber,tariqName:catalogRoute?.tariqName||selected?.tariqName,qariId:imam.id,rawi,personalChain:chain,junction,
      introductionId:source?.introductionId||intro?.id,wordingId:source?.wordingId||wording?.id};
    const assembled=await assembleHoldingIjazah(assemblyHolding,
      all.filter(x=>!x.ownerId||x.ownerId==='guest:'+guest.id).map(x=>({id:x.id,title:x.title||'',sectionType:x.sectionType||'',body:x.body||'',formatting:x.formatting||''})),catalogRoute?library??undefined:undefined);
    if(assembled.missing.length||!assembled.chain)throw new Error('Incomplete sanad: '+assembled.missing.join('، '));
    return {rawi,assembled,unifiedHolding:assemblyHolding.unifiedSanad?assemblyHolding:undefined,tariqName:catalogRoute?.tariqName||selected?.tariqName||'',bookAuthor:preview?.author||selected?.bookAuthor||'',routeSource:preview?.sources.join('، ')||selected?.routeSource||''};
   }));
   const created:{certificateId:string;sanadId:string;snapshotId:string}[]=[];
   const number=await nextShahadaNumber();
   try{
    for(const [index,{rawi,assembled,unifiedHolding,tariqName,bookAuthor,routeSource}] of entries.entries()){
     const sanad=await zite.asaneed.create({record:{unifiedHolding,tariqNumber:input.tariqNumber,tariqName,bookAuthor,routeSource,title:known.name+' — '+rawi+' — سند خاص',
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
  if(input.action==='save')extensions=(await zite.additionalShaykhExtensions.findAll({limit:2000})).records;
  const {records:all}=await zite.additionalShaykhs.findAll({limit:2000});
  return {sheikhs:all.map(serialize),...(createdCertificateId?{createdCertificateId}:{})};
 }
});
