import {sanadKey,resolveSanadContinuation} from './unifiedSanad';
import {QURRA} from './qurra';
import {readingIdentityLink} from './qurraRouteIdentities';
import type {BuilderLibrary,BuilderPerson,BuilderChain} from './bookBuilder';

export type ConsistencyIssue={code:string;severity:'error'|'review'|'info';message:string;personId?:string;branch?:number};
export type ConsistencyEntry={id:string;kind:'route'|'holding'|'reading';label:string;issues:ConsistencyIssue[];status:'error'|'review'|'consistent';pathsChecked:number;pathsMatched:number};
export type LinkedSanadRecord={id:string;kind:string;payload:Record<string,unknown>};
const string=(x:unknown)=>typeof x==='string'?x:'';
const object=(x:unknown):Record<string,unknown>=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
const normalized=(s:string)=>sanadKey(s).replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
const namesFor=(p:BuilderPerson)=>[...new Set([normalized(p.name),...(p.aliases||[]).map(a=>normalized(a.name)).filter(a=>a.length>=5&&a.includes(' '))].filter(Boolean))];
/** Only whole-word name witnesses from the active registry; never fuzzy-merge
 * identities. A lexical match is not evidence of a direct transmission. */
export function nameWitnesses(people:readonly BuilderPerson[]){
 const names=new Map<string,string[]>(),owners=new Map<string,Set<string>>();
 for(const person of people.filter(p=>!p.archived)){
  const keys=namesFor(person);names.set(person.id,keys);
  for(const k of keys){const set=owners.get(k)||new Set<string>();set.add(person.id);owners.set(k,set);}
 }
 return {names,owners};
}
export function orderedNameEvidence(ids:readonly string[],body:string,witnesses:ReturnType<typeof nameWitnesses>){
 const source=' '+normalized(body)+' ';let cursor=0;
 const issues:ConsistencyIssue[]=[];
 for(const id of ids){
  const keys=witnesses.names.get(id)||[];
  const safe=keys.filter(k=>witnesses.owners.get(k)?.size===1);
  const positions=safe.flatMap(k=>{const i=source.indexOf(' '+k+' ',Math.max(0,cursor-1));return i<0||i+1<cursor?[]:[i+1+k.length];});
  if(positions.length){cursor=Math.min(...positions);continue;}
  const has=(k:string)=>source.includes(' '+k+' ');
  const code=safe.some(has)?'name-out-of-order':keys.some(has)?'ambiguous-name':'name-not-found';
  issues.push({code,severity:'review',personId:id,message:code==='name-out-of-order'?'الاسم موجود خارج الموضع المتوقع أو تكرر بلا شاهد مستقل':code==='ambiguous-name'?'اسم مشترك بين هويات؛ يلزم تعيين الراوي':'لم يُعثر على الاسم أو بديل فريد في النص المحدد'});
 }
 return {matched:ids.length-issues.length,issues};
}
export function routeSourceSections(lib:BuilderLibrary,route:BuilderChain){
 const sections=lib.continuationSections||[];
 const book=lib.books.find(b=>b.id===route.book_id&&!b.archived);
 const own=sections.filter(s=>sanadKey(s.title)===sanadKey('CHAIN:'+route.qari_id+':'+route.rawi)&&s.body.trim());
 const shared=book?.title.includes('الشاطبية')?sections.filter(s=>s.title==='من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة'&&s.body.trim()):[];
 return {own,shared};
}
function result(id:string,kind:ConsistencyEntry['kind'],label:string,issues:ConsistencyIssue[],pathsChecked=0,pathsMatched=0):ConsistencyEntry{
 return {id,kind,label,issues,status:issues.some(i=>i.severity==='error')?'error':issues.some(i=>i.severity==='review')?'review':'consistent',pathsChecked,pathsMatched};
}
export function routePaths(lib:BuilderLibrary,route:BuilderChain){
 const book=lib.books.find(b=>b.id===route.book_id&&!b.archived);
 const parent=lib.chains.find(c=>c.id===route.book_chain_id&&!c.archived&&c.kind==='book'&&c.book_id===route.book_id);
 if(!book||!parent)return [];
 return parent.branches.flatMap(a=>route.branches.map(b=>{
  const ids=a.map(n=>n.person_id);
  if(ids.at(-1)!==book.author_id)ids.push(book.author_id);
  return [...ids,...b.map(n=>n.person_id).filter((id,i)=>i!==0||id!==book.author_id)];
 }));
}
export function validateRoute(lib:BuilderLibrary,route:BuilderChain,witnesses=nameWitnesses(lib.people)):ConsistencyEntry{
 const issues:ConsistencyIssue[]=[];
 const add=(code:string,severity:ConsistencyIssue['severity'],message:string)=>issues.push({code,severity,message});
 const book=lib.books.find(b=>b.id===route.book_id&&!b.archived);
 const parent=lib.chains.find(c=>c.id===route.book_chain_id&&!c.archived&&c.kind==='book'&&c.book_id===route.book_id);
 if(!book)add('invalid-book','error','الكتاب مفقود أو مؤرشف');
 if(!parent)add('invalid-parent','error','إسناد الكتاب مفقود أو لا يتبع الكتاب المحدد');
 const q=QURRA.find(q=>q.id===route.qari_id);
 if(!q||!q.rawis.some(r=>sanadKey(r)===sanadKey(route.rawi)))add('invalid-reading','error','القارئ والرواية غير متطابقين');
 const ids=new Set([...(book?[book.author_id]:[]),...(parent?.branches.flat()||[]).map(n=>n.person_id),...route.branches.flat().map(n=>n.person_id)]);
 for(const id of ids){const p=lib.people.find(p=>p.id===id);if(!p||p.archived||!p.name.trim())issues.push({code:'invalid-person',severity:'error',personId:id,message:'هوية راوٍ مفقودة أو مؤرشفة أو بلا اسم'});}
 if(!route.branches.length||!parent?.branches.length)add('missing-branches','review','لا توجد فروع محفوظة كافية للمقارنة');
 // A direct/empty book segment is legitimate; do not infer that it has teachers.
 if(parent&&!parent.confirmed)add('parent-unreviewed','review','إسناد الكتاب غير معتمد');
 if(!route.confirmed)add('route-unreviewed','review','الطريق غير معتمد');
 const sections=lib.continuationSections||[];
 const refs=route.continuation_ids||[];
 if(refs.length){
  if(new Set(refs).size!==refs.length)add('duplicate-continuation','error','مرجع تتمة مكرر');
  const resolved=resolveSanadContinuation(sections,route.qari_id,route.rawi,refs);
  if(resolved.missing.length)add('invalid-continuation','error','مراجع التتمة ناقصة أو غير معتمدة أو تخص رواية أخرى');
 }else if(!route.continuation.trim())add('missing-continuation','review','تتمة السند غير مكتملة');
 else add('legacy-continuation','review','تتمة نصية محفوظة بلا مراجع منظمة؛ لا تستبدل النص');
 const {own,shared}=routeSourceSections(lib,route);
 if(own.length!==1)add('source-selection','review',own.length?'أكثر من مصدر للرواية؛ يلزم تعيين المصدر':'لا يوجد مصدر محدد للرواية');
 else if(!readingIdentityLink(sections,lib.people,route.qari_id,route.rawi))add('reading-identity','review','لم تتعين هوية القارئ والراوي من عبارتي المصدر');
 const paths=routePaths(lib,route);let matched=0,checked=0;
 // A known two-part source is scanned in order, never mixed with unrelated
 // reading texts. This checks lexical coverage only, not branch equivalence.
 if(own.length===1&&shared.length<=1){
  const body=[...shared,...own].map(s=>s.body).join('\n');
  checked=paths.length;
  paths.forEach((ids,branch)=>{const e=orderedNameEvidence(ids,body,witnesses);if(!e.issues.length)matched++;issues.push(...e.issues.map(i=>({...i,branch:branch+1})));});
 }else if(shared.length>1)add('shared-source-ambiguous','review','تعددت مصادر المقطع المشترك');
 return result(route.id,'route',route.title,issues,checked,matched);
}
export function validateLinkedRecord(lib:BuilderLibrary,record:LinkedSanadRecord,witnesses=nameWitnesses(lib.people)):ConsistencyEntry|null{
 const p=record.payload,u=object(p.unifiedSanad),legacy=string(p.builderRouteId),structured=string(u.routeId),routeId=structured||legacy;
 if(!routeId)return null; // Legacy prose without a link is outside this comparison.
 const issues:ConsistencyIssue[]=[];
 const add=(code:string,severity:ConsistencyIssue['severity'],message:string)=>issues.push({code,severity,message});
 if(legacy&&structured&&legacy!==structured)add('conflicting-route-refs','error','مرجع الطريق القديم والمنظم مختلفان');
 const route=lib.chains.find(c=>c.id===routeId&&c.kind==='route'&&!c.archived);
 const kind=record.kind==='ijazahHoldings'?'holding':'reading';
 const label=[string(p.qariId),string(p.rawi),string(p.tariqName)].filter(Boolean).join(' · ');
 if(!route){add('missing-linked-route','error','الطريق المرتبط مفقود أو مؤرشف');return result(record.id,kind,label,issues);}
 if(p.qariId!==route.qari_id||sanadKey(string(p.rawi))!==sanadKey(route.rawi))add('linked-reading-mismatch','error','الرواية المحفوظة لا توافق الطريق المرتبط');
 const revision=structured?u.routeRevision:p.builderRevision;
 if(typeof revision==='number'&&revision!==route.revision)add('snapshot-revision','info','نسخة نصية محفوظة من مراجعة أخرى؛ لا تحديث آلي');
 else if(typeof revision!=='number')add('unknown-snapshot-revision','info','لا يوجد رقم مراجعة محفوظ للمقارنة');
 const paths=routePaths(lib,route),body=string(p.personalChain)||string(p.sanadText);let matched=0;
 if(!body.trim())add('empty-saved-text','error','النص المحفوظ فارغ');
 if(!paths.length)add('linked-path-unavailable','review','لا يوجد مسار منظم متاح للمقارنة');
 for(const [branch,ids] of paths.entries()){
  const e=orderedNameEvidence(ids,body,witnesses);if(!e.issues.length)matched++;
  issues.push(...e.issues.map(i=>({...i,branch:branch+1})));
 }
 // A legacy snapshot can contain only one variant, or additional personal
 // narrators; neither an old revision nor extra text is corruption.
 return result(record.id,kind,label,issues,paths.length,matched);
}
export function auditSanadConsistency(lib:BuilderLibrary,records:readonly LinkedSanadRecord[]=[]){
 const witnesses=nameWitnesses(lib.people);
 const routes=lib.chains.filter(c=>c.kind==='route'&&!c.archived).map(c=>validateRoute(lib,c,witnesses));
 const linked=records.flatMap(r=>{const entry=validateLinkedRecord(lib,r,witnesses);return entry?[entry]:[];});
 return {routes,linked,unlinked:records.length-linked.length};
}
