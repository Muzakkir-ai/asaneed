import {arabicSearchKey} from '../lib/arabicSearch';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {buildNarratorDirectory} from '../lib/narratorDirectory';
import {QURRA,displayRawi} from '../lib/qurra';

const reading=z.object({qariId:z.string(),rawi:z.string()});
const profile=z.object({id:z.string(),name:z.string(),teachers:z.array(z.string()),students:z.array(z.string()),readings:z.array(reading),sources:z.array(z.string())});

export default createEndpoint({
 description:'Read-only index of teachers and pupils from the ten-Qiraat chains and Sheikh Zakaullah’s documented sanad',
 authenticated:true,
 inputSchema:z.object({}),
 outputSchema:z.object({people:z.array(profile),links:z.number(),sections:z.number()}),
 execute:async()=>{
  const [{records,hasMore},{records:students},{records:certs},{records:asaneed},users]=await Promise.all([
   zite.sanadSections.findAll({limit:2000}),zite.students.findAll({limit:2000}),
   zite.certificates.findAll({limit:2000}),zite.asaneed.findAll({limit:2000}),
   zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000}),
  ]);
  if(hasMore)throw new Error('مكتبة الأسانيد كبيرة وتحتاج إلى استكمال الفهرسة');
  const shared=records.filter(s=>!s.ownerId && (s.title?.startsWith('CHAIN:') || s.title==='من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة' || s.title==='من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند' || s.title==='إسناد الشيخ ذكاء الله إلى إبراهيم العُبيدي — مرجع مستقل'));
  const extras=await zite.additionalShaykhs.findAll({limit:2000});
  const zaka=extras.records.find(g=>arabicSearchKey(g.name||'').includes('ذكاء الله'));
  const one=(v?:string|string[])=>Array.isArray(v)?v[0]:v;
  const plain=(t:string)=>t.normalize('NFKC').replace(/[\u064b-\u065f\u0670]/gu,'').replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي').replace(/\s+/gu,' ').trim();
  const read=(chain:string)=>{
   const heading=chain.match(/^【بيان القراءة:([^】]+)】/)?.[1]||'';
   return QURRA.flatMap(q=>q.rawis.map(rawi=>({qariId:q.id,rawi,imam:q.imam,label:displayRawi(q.id,rawi)})))
     .filter(x=>heading.includes(x.imam)&&(heading.includes('رواية '+x.label)||heading.includes('رواية '+x.rawi)))
     .map(({qariId,rawi})=>({qariId,rawi}));
  };
  const sourceStudents=zaka?students.filter(s=>s.ownerId==='guest:'+zaka.id||s.ownerId==='bfAc0v80BtnVlcodGAggOgnvr5jRVosm'):[];
  const pupils=sourceStudents.map(s=>{
   const name=plain(s.name||'');const readings=new Map<string,{qariId:string;rawi:string}>();
   for(const c of certs){
    if(c.additionalShaykh!==zaka?.id||plain(c.studentName||'')!==name)continue;
    const chain=asaneed.find(a=>a.id===one(c.sanad))?.chain||'';
    for(const r of read(chain))readings.set(r.qariId+'|'+r.rawi,r);
   }
   return {name:s.name||'',readings:[...readings.values()]};
  });
  return buildNarratorDirectory(shared.map(s=>({id:s.id,title:s.title||'',body:s.body||''})),pupils);
 },
});
