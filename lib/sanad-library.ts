import {prepareSavedSanadPeople} from '../legacy/lib/preparedSanadPeople';
import {preparedSanadGraph} from '../legacy/lib/preparedSanadGraph';
import type {ReviewedSharedBridge} from '../legacy/lib/sharedBridge';
import {linkedBridgeTails,reviewedSharedBridge} from '../legacy/lib/sharedBridge';
import type {SupabaseClient} from '@supabase/supabase-js';
import {QURRA} from '../legacy/lib/qurra';
import {buildNarratorDirectory} from '../legacy/lib/narratorDirectory';
import {UBAYDI_BRIDGE_TITLE,PERSONAL_BRIDGE_TITLE,savedPersonalMeetingPoints,validatePersonalBridge} from '../legacy/lib/builderPrefix';
import type {BuilderLibrary} from '../legacy/lib/bookBuilder';
import {resolveSanadContinuation,sanadKey,type ContinuationSection} from '../legacy/lib/unifiedSanad';
function check<T>(r:{data:T;error:{message:string}|null}):T{if(r.error)throw Error(r.error.message);return r.data;}
export async function loadBuilderLibrary(client:SupabaseClient,prefixOwnerId?:string):Promise<BuilderLibrary>{
 async function all(table:string){const rows:any[]=[];for(let n=0;;n+=1000){const page=check(await client.from(table).select('*').range(n,n+999))||[];rows.push(...page);if(page.length<1000)break;}return rows;}
 const [people,books,chains,nodes,sections,continuationSchema,personalHoldings,reviewedReadings]=await Promise.all([all('builder_people'),all('builder_books'),all('builder_chains'),all('builder_nodes'),client.from('workspace_records').select('id,payload').eq('kind','sanadSections'),client.from('builder_chains').select('continuation_ids').limit(0),prefixOwnerId?client.from('workspace_records').select('id,payload').eq('kind','ijazahHoldings').eq('payload->>ownerId',prefixOwnerId):Promise.resolve({data:[],error:null}),client.from('workspace_records').select('id,payload').eq('kind','additionalShaykhReadingSanads').eq('payload->>personalPeopleReviewed','true')]);
 const text=(check(sections)||[]).map(s=>s.payload as Record<string,string>).filter(s=>!s.ownerId);
 const continuationSections:ContinuationSection[]=(check(sections)||[]).filter(s=>!s.payload.ownerId).map(s=>({id:s.id,...s.payload}));
 const bridgeAnchors=people.filter(person=>!person.archived&&sanadKey(person.name)===sanadKey('إبراهيم العُبيدي'));
 const sharedBridgeGraphs=(check(sections)||[]).filter(s=>!s.payload.ownerId&&s.payload.title===UBAYDI_BRIDGE_TITLE).map(s=>reviewedSharedBridge({id:s.id,title:s.payload.title,body:s.payload.body||''},s.payload.sharedBridgeReview,people)).filter(graph=>graph!==null).map(graph=>{
  if(bridgeAnchors.length!==1)return graph;
  const {id,name}=bridgeAnchors[0];
  return {...graph,routes:graph.routes.map(route=>[{id,name},...route])};
 });
 const activeIds=new Set(people.filter(person=>!person.archived).map(person=>person.id));
 const jazariIds=new Set(sharedBridgeGraphs.flatMap(graph=>graph.routes.map(path=>path.at(-1)?.id)));
 const reviewedPersonalGraphs:ReviewedSharedBridge[]=(check(reviewedReadings)||[]).flatMap(({id,payload})=>{
  const ids=payload.personalPersonIds as string[]|undefined;
  if(payload.tariqNumber||payload.unifiedSanad||!payload.shaykhId||!ids?.length||!jazariIds.has(ids.at(-1))||ids.some(personId=>!activeIds.has(personId)))return [];
  const source=prepareSavedSanadPeople(payload.sanadText||'',true,'end');
  if(!source||source.tokens.length!==ids.length)return [];
  const graph=preparedSanadGraph(source,source.tokens.map((token,i)=>({...token,personId:ids[i]})));
  if(!graph)return [];
  const names=new Map(graph.nodes.map(node=>[node.id,node.name]));
  return [{source:{id,body:payload.sanadText,title:payload.variantName||payload.name,kind:'personal' as const,shaykhId:payload.shaykhId,qariId:payload.qariId,rawi:payload.rawi},routes:graph.paths.map(path=>path.map(personId=>({id:personId,name:names.get(personId)!}))),unresolved:[]}];
 });
 const continuations:Record<string,string>={};for(const q of QURRA)for(const rawi of q.rawis){const resolved=resolveSanadContinuation(continuationSections,q.id,rawi);if(!resolved.missing.length)continuations[q.id+'|'+rawi]=resolved.text;}
 for(const chain of chains){if(chain.continuation_ids?.length){const resolved=resolveSanadContinuation(continuationSections,chain.qari_id,chain.rawi,chain.continuation_ids);chain.continuation=resolved.text;if(resolved.missing.length)chain.confirmed=false;}}

 const quranDirectory=buildNarratorDirectory((check(sections)||[]).filter(s=>!s.payload.ownerId).map(s=>({id:s.id,title:s.payload.title||'',body:s.payload.body||''})));
 const quranMeetingPeople=quranDirectory.people.filter(p=>p.readings.length>0&&p.id!=='prophet').map(p=>({id:p.id,name:p.name,sources:p.sources}));
 const quranRoutes=chains.filter(c=>c.kind==='route'&&c.confirmed&&!c.archived&&c.qari_id);
 const quranChainIds=new Set(quranRoutes.flatMap(c=>[c.id,c.book_chain_id]).filter(Boolean));
 const quranPersonIds=new Set(nodes.filter(n=>quranChainIds.has(n.chain_id)).map(n=>n.person_id));
 for(const book of books.filter(b=>!b.archived&&quranRoutes.some(c=>c.book_id===b.id)))quranPersonIds.add(book.author_id);
 for(const person of people.filter(p=>!p.archived&&quranPersonIds.has(p.id))){if(!quranMeetingPeople.some(p=>p.name===person.name))quranMeetingPeople.push({id:person.id,name:person.name,sources:chains.filter(c=>quranChainIds.has(c.id)&&nodes.some(n=>n.chain_id===c.id&&n.person_id===person.id)).map(c=>c.title)});}
 // Book branches are stored from Ibn al-Jazari toward the author. Follow each
 // saved branch in reverse without joining paths across different sources.
 const activePeople=new Map<string,string>(people.filter(p=>!p.archived).map(p=>[p.id,p.name]));
 const bookMeetingPoints=new Map<string,{id:string;title:string;anchorName:string;body:string}>();
 for(const chain of chains.filter(c=>c.kind==='book'&&!c.archived&&quranChainIds.has(c.id))){
  const book=books.find(b=>b.id===chain.book_id&&!b.archived);if(!book)continue;
  const branches=new Map<number,typeof nodes>();
  for(const node of nodes.filter(n=>n.chain_id===chain.id)){
   const branch=branches.get(node.branch)||[];branch.push(node);branches.set(node.branch,branch);
  }
  for(const [branch,entries] of branches){
   const ids=entries.sort((a,b)=>a.position-b.position).map(n=>n.person_id);
   if(ids.at(-1)!==book.author_id)ids.push(book.author_id);
   if(new Set(ids).size!==ids.length||ids.some(id=>!activePeople.has(id)))continue;
   const names=ids.map(id=>activePeople.get(id)!);
   names.forEach((anchorName,i)=>{
    const body='عن '+[...names.slice(0,i).reverse(),'الإمام ابن الجزري'].join('، عن ');
    try{validatePersonalBridge(anchorName,body);}catch{return;}
    if(!bookMeetingPoints.has(ids[i]+'|'+body))bookMeetingPoints.set(ids[i]+'|'+body,{id:`book:${chain.id}:${branch}:${i}`,title:book.title+' — '+chain.title,anchorName,body});
   });
  }
 }
 const sharedBridgeMeetingPoints=sharedBridgeGraphs.flatMap(graph=>{
  const source=graph.source.body.trim();
  return [...source.matchAll(/،\s*(?=عن\s)/gu)].flatMap(boundary=>{
   const body=source.slice(boundary.index+boundary[0].length);
   const anchorIds=[...new Set(graph.routes.flat().map(node=>node.id))].filter(id=>linkedBridgeTails(graph,body,id));
   if(anchorIds.length!==1)return [];
   const anchorName=activePeople.get(anchorIds[0]);
   if(!anchorName)return [];
   try{validatePersonalBridge(anchorName,body);}catch{return [];}
   return [{id:'shared-bridge:'+graph.source.id+':'+boundary.index,title:UBAYDI_BRIDGE_TITLE,anchorName,body}];
  });
 });
 const suggestions=[...new Set(text.filter(s=>s.title?.startsWith('CHAIN:')).flatMap(s=>(s.body||'').split(/(?:^|[،.])\s*عن\s+/u)).map(s=>s.trim().replace(/[،.]+$/u,'')).filter(s=>s.length>=8&&s.length<180&&!/[\n؛]|وقرأ|وهم|وهما|صاحب القراءة|صاحب الرواية/u.test(s)))];
 return {reviewedPersonalGraphs,sharedBridgeGraphs,quranMeetingPeople,unificationReady:!continuationSchema.error,continuationSections,prefixContinuations:[...(check(sections)||[]).filter(s=>!s.payload.ownerId&&s.payload.title===UBAYDI_BRIDGE_TITLE||prefixOwnerId&&s.payload.ownerId===prefixOwnerId&&s.payload.sectionType==='personal'&&s.payload.title?.startsWith(PERSONAL_BRIDGE_TITLE)).map(s=>({id:s.id,title:s.payload.title,body:s.payload.body||'',...(s.payload.title.startsWith(PERSONAL_BRIDGE_TITLE)?{anchorName:s.payload.title.slice(PERSONAL_BRIDGE_TITLE.length)}:{})})),...sharedBridgeMeetingPoints,...bookMeetingPoints.values(),...savedPersonalMeetingPoints((check(personalHoldings)||[]).map(h=>({id:h.id,unifiedSanad:h.payload.unifiedSanad||(h.payload.personalPersonIds?.length?{prefix:h.payload.personalChain,prefixPersonIds:h.payload.personalPersonIds}:null)})),people)],people,books,chains:chains.map(c=>({...c,branches:[...new Set<number>(nodes.filter(n=>n.chain_id===c.id).map(n=>n.branch))].sort((a,b)=>a-b).map(b=>nodes.filter(n=>n.chain_id===c.id&&n.branch===b).sort((a,b)=>a.position-b.position).map(n=>({person_id:n.person_id,route_source:n.route_source,source_level:n.source_level}))),...(!nodes.some(n=>n.chain_id===c.id)?{branches:[[]]}:{})})),suggestions:[...new Set([...suggestions,...quranDirectory.people.map(p=>p.name)])],continuations};
}
