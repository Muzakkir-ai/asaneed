import {renderBranchedSanad,sanadSubjectName} from './branchedSanad';
import {cleanSanadPunctuation,cleanSanadPartStart} from './sanadPunctuation';
import {reachesJunction} from './personalSanadValidation';
import type {BuilderBook,BuilderChain,BuilderPerson} from './bookBuilder';

export const sanadKey=(s:string)=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640\u06d6-\u06ed]/gu,'').replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي').replace(/\s+/gu,' ').trim();
export type ContinuationKind='rawi'|'qari'|'prophet';
export type ContinuationMetadata={version:1;kind:ContinuationKind;qariId:string;rawi?:string;variant:string;status:'draft'|'approved';reviewedBy?:string;reviewedAt?:string};
export type ContinuationSection={id:string;title:string;body:string;formatting?:string;continuation?:ContinuationMetadata};
export type ContinuationResolution={text:string;sectionIds:string[];sections:ContinuationSection[];missing:string[]};

/** Only explicit reviewed metadata selects a continuation. CHAIN prose is never split here. */
export function resolveSanadContinuation(sections:ContinuationSection[],qariId:string,rawi:string,selectedIds?:string[]):ContinuationResolution{
 const selected=selectedIds?new Set(selectedIds):null;
 const parts:ContinuationSection[]=[],missing:string[]=[];
 for(const kind of ['rawi','qari','prophet'] as const){
  const candidates=sections.filter(s=>s.body.trim()&&s.continuation?.version===1&&s.continuation.status==='approved'&&s.continuation.kind===kind&&s.continuation.qariId===qariId&&(kind!=='rawi'||s.continuation.rawi===rawi)&&(!selected||selected.has(s.id)));
  if(candidates.length!==1)missing.push(candidates.length?'اختر فرع التتمة: '+kind:'التتمة المعتمدة غير مكتملة: '+kind);
  else parts.push(candidates[0]);
 }
 if(selected&&[...selected].some(id=>!parts.some(s=>s.id===id)))missing.push('مرجع تتمة غير متاح أو غير معتمد');
 return {text:missing.length?'':composeSanadSegments(parts.map(p=>p.body)),sectionIds:parts.map(p=>p.id),sections:parts,missing};
}

/** Compatibility input retains scholarly text, including legitimate repeated names. */
export function composeSanadSegments(parts:string[]){
 const cleanEnd=(s:string)=>s.trim().replace(/[.،؛\s]+$/u,'');
 return cleanSanadPunctuation(parts.map(cleanSanadPartStart).filter(Boolean).map((part,i,all)=>i===all.length-1?part.trim():cleanEnd(part)+(i===all.length-2?'.':'،')).join(' '));
}

/** Author identity joins are explicit IDs, never a global repeated-name replacement. */
export function composeStructuredSanad(book:BuilderBook,parent:BuilderChain,route:BuilderChain,people:BuilderPerson[],prefix=''){
 const person=(id:string)=>{const p=people.find(p=>p.id===id);if(!p?.name.trim())throw Error('أكمل اسم الراوي');return p.name;};
 const author=person(book.author_id),paths:string[][]=[];
 for(const a of parent.branches)for(const b of route.branches){
  const left=a.map(n=>n.person_id),right=b.map(n=>n.person_id);
  if(left[left.length-1]===book.author_id)left.pop();
  if(right[0]===book.author_id)right.shift();
  const ids=[...left,book.author_id,...right];
  if(ids[0]===book.author_id&&/محمد بن محمد.*الجزري/u.test(sanadKey(author))&&reachesJunction({personalChain:prefix,junction:'jazari'}))ids.shift();
  paths.push(ids);
 }
 const subject=(id:string)=>sanadSubjectName(people.find(p=>p.id===id)?.display_name.trim()||person(id));
 return {text:cleanSanadPunctuation(renderBranchedSanad(paths,person,subject,prefix,route.continuation)),author,sources:[...new Set(route.branches.flatMap(b=>b.filter(n=>n.route_source).map(n=>person(n.person_id))))]};
}

export type ChainComparison={routeId:string;sourceIds:string[];status:'match'|'review'|'incomplete';paths:{names:string[];matched:string[];missing:string[]}[];additional:string[];sourceText:string;structuredText:string;notes:string[]};
/** Read-only evidence. Agreement of database text is not historical authentication. */
export function compareStructuredRoute(book:BuilderBook,parent:BuilderChain,route:BuilderChain,people:BuilderPerson[],sources:ContinuationSection[]):ChainComparison{
 const names=new Map(people.map(p=>[p.id,p.name]));
 const paths=parent.branches.flatMap(a=>route.branches.map(b=>{
  const ids=[...a.map(n=>n.person_id)];if(ids[ids.length-1]!==book.author_id)ids.push(book.author_id);
  ids.push(...b.map(n=>n.person_id).filter((id,i)=>i!==0||id!==book.author_id));
  const ns=ids.map(id=>names.get(id)||'');
  const normalized=sanadKey(sources.map(s=>s.body).join(' '));let offset=0;
  const matched:string[]=[],missing:string[]=[];
  for(const name of ns){const key=sanadKey(name);const at=key?normalized.indexOf(key,offset):-1;if(at<0)missing.push(name||'هوية غير متاحة');else{matched.push(name);offset=at+key.length;}}
  return {names:ns,matched,missing};
 }));
 const incomplete=!sources.length||!parent.branches.length||!route.branches.length||!route.continuation.trim();
 const status=incomplete?'incomplete':paths.every(p=>!p.missing.length)?'match':'review';
 const sourceText=sources.map(s=>s.body).join('\n\n'),pathNames=new Set(paths.flatMap(p=>p.names).map(sanadKey));
 const additional=[...new Set(people.filter(p=>!pathNames.has(sanadKey(p.name))&&sanadKey(sourceText).includes(sanadKey(p.name))).map(p=>p.name))];
 return {routeId:route.id,sourceIds:sources.map(s=>s.id),status,paths,additional,sourceText,structuredText:composeStructuredSanad(book,parent,route,people).text,notes:['المطابقة بين السجلات ليست توثيقًا تاريخيًا.','الأسماء الإضافية من الهويات المحفوظة فقط؛ راجع بقية نص المصدر والفروع يدويًا.',...(!route.confirmed?['الطريق غير معتمد.']:[])]};
}

/** Preparation only. Exact equality and an explicit personal boundary are required.
 * The caller retains before/after privately and applies nothing without approval. */
export function planHoldingReference(holding:{id:string;ownerId:string;qariId:string;rawi?:string;personalChain:string;[key:string]:unknown},book:BuilderBook,parent:BuilderChain,route:BuilderChain,people:BuilderPerson[],personalPrefix:string){
 const before=JSON.parse(JSON.stringify(holding));
 if(!route.confirmed||route.archived||holding.qariId!==route.qari_id||holding.rawi!==route.rawi||!reachesJunction({personalChain:personalPrefix,junction:'jazari'}))return {status:'review' as const,reason:'تحتاج هوية الطريق وحدود السند الشخصي إلى مراجعة',before,after:null};
 const assembled=composeStructuredSanad(book,parent,route,people,personalPrefix).text;
 if(assembled!==holding.personalChain)return {status:'review' as const,reason:'النص المعاد تركيبه لا يساوي النص الأصلي حرفيًا؛ لا تحويل آلي',before,after:null};
 return {status:'ready' as const,reason:'مطابقة حرفية؛ التحويل يتطلب اعتمادًا منفصلًا',before,after:{...before,unifiedSanad:{version:1,routeId:route.id,routeRevision:route.revision,prefix:personalPrefix,continuationIds:route.continuation_ids||[]}},mapping:{originalId:holding.id,ownerId:holding.ownerId,routeId:route.id,routeRevision:route.revision,parentId:parent.id,parentRevision:parent.revision}};
}
