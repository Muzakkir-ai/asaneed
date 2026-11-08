import {isInheritedPersonalSanad} from '../lib/sharedShaykhSanad';
import {verifiedOnwardSources,type OnwardContext} from '../lib/verifiedOnwardSources';
import CombinedSanadView from './CombinedSanadView';
import {verifiedLegacySanad} from '../lib/verifiedLegacySanad';
import {combinedSanad} from '../lib/combinedSanad';
import {diagramSanadText} from '../lib/diagramSanadText';
import BranchPersonCard from './BranchPersonCard';
import {useEffect,useState} from 'react';
import {additionalShaykhs,additionalReadingSanads,sanadSections} from '../lib/api';
import {arabicDigits} from '../lib/arabicDigits';
import {UBAYDI_BRIDGE_TITLE,resolveBuilderPrefix} from '../lib/builderPrefix';
import {sanadKey} from '../lib/unifiedSanad';
import {preparedSanadText,prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import {recoverSharedBridgePrefix,savedSharedBridgeDiagram,sharedBridgePaths} from '../lib/sharedBridge';
import {preparedSanadGraph} from '../lib/preparedSanadGraph';
import type {BuilderLibrary} from '../lib/bookBuilder';
import {workspaceHeaders} from '../lib/workspaceSelection';

type Path={id:string;label:string;routes:string[][];names:Record<string,string>;routeLabels:string[]};
type SavedChain={savedRoutes?:string[][];reason:string;id:string;label:string;text:string;ids:string[];preparation:ReturnType<typeof prepareSavedSanadPeople>};
type Reading={qariId:string;rawi:string};
const readingKey=(reading:Reading)=>JSON.stringify([reading.qariId,reading.rawi]);
type ShaykhGroup={id:string;name:string;readings:Reading[];rows:(SavedChain&{paths:Path[];reading:string;sourceId:string;alternate:boolean})[]};
function linearNames(source:string){
 const body=source.trim().replace(/[.،؛]+$/u,'');
 if(/[().؛\n]|وقرأ|وأخذ|وهما|وهم|وهو| والشيخ/u.test(body))return [];
 return body.split(/،\s*عن\s+/u).map(part=>part.replace(/^(?:(?:كما أخذته|كما أخذت ذلك)\s+)?عن\s+/u,'').trim());
}
function graphPaths(source:string,endpoint:'ubaydi'|'jazari',ids:string[]=[]){
 const prepared=prepareSavedSanadPeople(source,false,endpoint);
 if(!prepared)return null;
 return pathsFromPreparation(prepared,ids);
}
function pathsFromPreparation(prepared:NonNullable<ReturnType<typeof prepareSavedSanadPeople>>,ids:string[]){
 const graph=preparedSanadGraph(prepared,prepared.tokens.map((token,i)=>({...token,personId:ids.length===prepared.tokens.length?ids[i]:undefined})));
 return graph?{paths:graph.paths.map(path=>path.map(id=>graph.nodes.find(node=>node.id===id)!.name)),suffix:prepared.suffix}:null;
}
function numberedPaths(source:string,ids:string[],preparation:SavedChain['preparation'],savedText:string){
 const saved=preparation?.reviewed&&preparedSanadText(preparation).trim()===savedText.trim()?pathsFromPreparation(preparation,ids):null;
 const prefix=saved||graphPaths(source,'ubaydi',ids);
 const suffix=saved&&source.startsWith(savedText.trim())?saved.suffix+source.slice(savedText.trim().length):prefix?.suffix;
 const tail=suffix?.replace(/^\s*،\s*/u,'').trim()||'';
 const continuation=tail?graphPaths('كما أخذته '+tail,'jazari'):null;
 const endings=sharedBridgePaths(tail)||continuation?.paths||[linearNames(tail)];
 const parallel=/^(.*?)،\s*عن مشايخ؛\s*منهم (.+?)،\s*وهم على (.+?)\s*$/u.exec(source.trim());
 const parallelHead=parallel?linearNames(parallel[1]):[];
 const parallelPaths=parallel&&parallelHead.length?parallel[2].split(/،\s*و/u).map(name=>[...parallelHead,name,parallel[3]]):null;
 const full=graphPaths(source,'jazari');
 const routes=prefix&&tail?prefix.paths.flatMap(path=>endings.map(end=>[...path,...end])):saved?.paths||parallelPaths||full?.paths||[linearNames(source)];
 return routes.filter(names=>names.length&&names.every(name=>name.length>=2&&name.length<=250&&!/[،؛.()]/u.test(name))&&/(?:ابن الجزري|محمد بن محمد (?:بن محمد )?الجزري)$/u.test(sanadKey(names.at(-1)!)))
  .map(names=>[...names].reverse());
}

export default function ShaykhSanadTree(){
 const [groups,setGroups]=useState<ShaykhGroup[]>([]),[shaykhId,setShaykhId]=useState(''),[readingId,setReadingId]=useState(''),[sourceId,setSourceId]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const [{sheikhs},{sections},library]=await Promise.all([additionalShaykhs({action:'list'}),sanadSections({action:'list'}),fetch('/api/book-builder',{headers:workspaceHeaders()}).then(async response=>response.ok?await response.json() as BuilderLibrary:null).catch(()=>null)]);
    const bridges=sections.filter(s=>!s.ownerId&&s.title===UBAYDI_BRIDGE_TITLE);
    const groups=await Promise.all(sheikhs.map(async sheikh=>{
     const sources=[{id:'shared',alternate:false,label:'السند الشخصي',text:sheikh.personalChain,ids:sheikh.personalPersonIds,preparation:sheikh.preparedShared,continuationId:sheikh.continuationId,context:{shaykhId:sheikh.id} as OnwardContext},{id:'kubra',alternate:false,label:'سند شخصي مستقل',text:sheikh.kubraPersonalChain,ids:sheikh.kubraPersonalPersonIds,preparation:null,continuationId:sheikh.kubraContinuationId,context:{shaykhId:sheikh.id} as OnwardContext}];
     if(sources[0].text.trim()===sources[1].text.trim())sources.pop();
     const {sanads}=await additionalReadingSanads({action:'list',shaykhId:sheikh.id});
     const seen=new Set(sources.map(s=>sanadKey(s.text).replace(/[.،؛]+$/u,'')));
     for(const sanad of sanads){
      if(sheikh.sharedSughraSanad&&isInheritedPersonalSanad(sheikh.personalChain,sanad,sheikh.personalPersonIds))continue;
      const text=sanad.unifiedSanad?.prefix||(!sanad.tariqNumber?sanad.sanadText:'');
      const key=sanadKey(text).replace(/[.،؛]+$/u,'');
      if(!key||(!sanad.variantName&&!sanad.unifiedSanad&&!sanad.continuationId&&!sanad.personalPersonIds?.length&&seen.has(key)))continue;
      seen.add(key);
      sources.push({id:sanad.id,alternate:Boolean(sanad.variantName||sanad.tariqNumber),label:[sanad.rawi,sanad.variantName,sanad.tariqName].filter(Boolean).join(' — '),text,ids:sanad.personalPersonIds??[],preparation:sanad.preparedPeople??null,continuationId:sanad.continuationId,context:{qariId:sanad.qariId,rawi:sanad.rawi,shaykhId:sheikh.id}});
     }
     const rows=sources.filter(s=>s.text.trim()).map(s=>{
      const label=sheikh.name+' — '+s.label;
      let names:string[][]=[],text=s.text;
      const savedPreparation=s.preparation??recoverSharedBridgePrefix(s.text,s.ids,bridges);
      try{text=resolveBuilderPrefix(s.text,bridges).text;names=numberedPaths(text,s.ids,savedPreparation,s.text);}catch{/* Incomplete or ambiguous saved chain. */}
      const preparation=savedPreparation||prepareSavedSanadPeople(text);
      const onward=library?verifiedOnwardSources(library,s.context):[];
      const diagram=savedSharedBridgeDiagram(s.text,s.ids,onward,savedPreparation,{id:sheikh.id,name:sheikh.name},s.continuationId??undefined,s.context)?.diagram;
      const id=sheikh.id+':'+s.id;
      const meta={reading:s.context.qariId&&s.context.rawi?readingKey({qariId:s.context.qariId,rawi:s.context.rawi}):'',sourceId:s.id,alternate:s.alternate};
      if(diagram&&combinedSanad(diagram.paths)){
       const title=onward.find(item=>item.source.id===diagram.sourceId)?.source.title;
       const routeLabels=diagram.paths.map(()=>[label,title].filter(Boolean).join(' — '));
       return {...meta,id,label,text,savedRoutes:names.map(route=>[...route,sheikh.name]),ids:s.ids,preparation,paths:[{id,label,routes:diagram.paths,names:diagram.names,routeLabels}],reason:''};
      }
      const witnesses=s.continuationId?onward.filter(item=>item.source.id===s.continuationId):onward;
      const resolved=library&&!s.ids.length?names.flatMap(path=>{
       // A verified root segment remains useful when the personal tail cannot be linked.
       for(let length=path.length;length>=2;length--){
        const match=verifiedLegacySanad(path.slice(0,length),library.people,witnesses);
        if(match)return [{...match,complete:length===path.length}];
       }
       return [];
      }):[];
      const incomplete=resolved.length!==names.length||resolved.some(match=>!match.complete);
      const reason='تعذر ربط هذا السند كاملًا بهويات الرواة والمسارات المعتمدة. النص المحفوظ متاح للمراجعة.';
      if(resolved.length){
       const issuer='shaykh:'+sheikh.id;
       const routes=resolved.flatMap(match=>match.sources.map(()=>match.complete?[...match.ids,issuer]:match.ids));
       const routeLabels=resolved.flatMap(match=>match.sources.map(source=>[label,source.title,match.complete?'':'جزء معتمد'].filter(Boolean).join(' — ')));
       const routeIds=new Set(routes.flat());
       const graphNames=Object.fromEntries(library!.people.filter(person=>routeIds.has(person.id)).map(person=>[person.id,person.display_name||person.name]));
       graphNames[issuer]=sheikh.name;
       if(combinedSanad(routes))return {...meta,id:incomplete?id+':review':id,label,text,savedRoutes:names.map(route=>[...route,sheikh.name]),ids:s.ids,preparation,paths:[{id,label,routes,names:graphNames,routeLabels}],reason:incomplete?reason:''};
      }
      return {...meta,id,label,text,savedRoutes:names.map(route=>[...route,sheikh.name]),ids:s.ids,preparation,paths:[],reason};
     });
     const readings=[...new Map([...sheikh.readings,...sanads].filter(r=>r.qariId&&r.rawi).map(r=>[readingKey(r),{qariId:r.qariId,rawi:r.rawi}])).values()];
     return {id:sheikh.id,name:sheikh.name,readings,rows};
    }));
    if(!cancelled)setGroups(groups);
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'تعذر تحميل أسانيد المشايخ');}
   finally{if(!cancelled)setLoading(false);}
  }
  void load();return()=>{cancelled=true;};
 },[]);
 const shaykh=groups.find(group=>group.id===shaykhId);
 const readingRows=shaykh?.rows.filter(row=>row.reading===readingId)??[];
 const rows=readingId&&shaykh
  ?[...readingRows,...(readingRows.some(row=>!row.alternate)?[]:shaykh.rows.filter(row=>row.sourceId==='shared'))]
  :shaykh?.rows??groups.flatMap(group=>group.rows);
 const sources=rows.filter(row=>row.paths.length);
 const distinctSources=new Set(sources.map(row=>JSON.stringify(row.paths.flatMap(path=>path.routes))));
 const paths=(sourceId?rows.filter(row=>row.id===sourceId):rows).flatMap(row=>row.paths);
 const missing=rows.filter(row=>row.reason);
 const branches=new Map<string,{route:string[];labels:Set<string>}>();
 for(const path of paths){
  path.routes.forEach((route,index)=>{
   const key=JSON.stringify(route);
   const branch=branches.get(key)??{route,labels:new Set<string>()};
   branch.labels.add(path.routeLabels[index]);
   branches.set(key,branch);
  });
 }
 const allRoutes=[...branches.values()].map(branch=>branch.route);
 const routeLabels=[...branches.values()].map(branch=>[...branch.labels].join(' / '));
 const combined=combinedSanad(allRoutes);
 return <section className="space-y-4" aria-label="أسانيد المشايخ" dir="rtl">
  <h3 className="font-bold">أسانيد المشايخ</h3>
  <p className="text-sm text-muted-foreground">يبدأ الترقيم من الإمام ابن الجزري.</p>
  {loading?<p role="status">جارٍ تحميل الأسانيد…</p>:error?<p role="alert">{error}</p>:<>
   {groups.length>0&&<div className="grid gap-3 sm:grid-cols-2">
    <label className="block min-w-0 rounded-lg border p-3 text-sm">اختر الشيخ
     <select className="mt-2 block w-full rounded border bg-background p-2" value={shaykhId} onChange={event=>{setShaykhId(event.target.value);setReadingId('');setSourceId('');}}>
      <option value="">جميع المشايخ</option>{groups.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}
     </select>
    </label>
    {shaykh&&<label className="block min-w-0 rounded-lg border p-3 text-sm">اختر الرواية
     <select className="mt-2 block w-full rounded border bg-background p-2" value={readingId} onChange={event=>{setReadingId(event.target.value);setSourceId('');}}>
      <option value="">جميع الروايات</option>{shaykh.readings.map(reading=><option key={readingKey(reading)} value={readingKey(reading)}>{reading.rawi}</option>)}
     </select>
    </label>}
   </div>}
   {shaykh&&distinctSources.size>1&&<label className="block text-sm">السند الشخصي
    <select className="mt-1 block w-full rounded border bg-background p-2" value={sourceId} onChange={event=>setSourceId(event.target.value)}>
     <option value="">جميع الأسانيد المطابقة</option>{sources.map(row=><option key={row.id} value={row.id}>{row.label.slice(shaykh.name.length+3)}</option>)}
    </select>
   </label>}
   {combined?.rows.length
    ?<CompactShaykhPath key={JSON.stringify([shaykhId,readingId,sourceId])} path={{id:'combined',label:shaykh?.name??'الأسانيد المرتبطة بهويات الرواة',routes:allRoutes,names:Object.assign({},...paths.map(path=>path.names)),routeLabels}}/>
    :<p role="status" className="text-sm text-muted-foreground">{paths.length?'يتعذر جمع هذه الأسانيد في رسم بلا دورات. اختر سندًا محددًا.':'لا يوجد سند مرتبط بهذه الخيارات.'}</p>}
   {missing.length>0&&<details className="rounded-lg border p-3"><summary>أسانيد تحتاج مراجعة قبل الترقيم ({arabicDigits(missing.length)})</summary><ul className="list-disc space-y-1 ps-5">{missing.map(row=><li key={row.id}><details><summary>{row.label}</summary><SavedShaykhChain {...row}/></details></li>)}</ul></details>}
  </>}
 </section>;
}

function CompactShaykhPath({path}:{path:Path}){
 const [selectedRoute,setSelectedRoute]=useState(0);
 const generated=diagramSanadText(path.routes[selectedRoute]??[],path.names);
 return <div className="space-y-3">
  <CombinedSanadView paths={path.routes} routeLabels={path.routeLabels} groupJazariStudents source={path.label} renderPerson={(id,positions)=><BranchPersonCard name={path.names[id]??id} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>}/>
  <details className="rounded-lg border p-3" data-testid="diagram-sanad-text-preview">
   <summary className="cursor-pointer text-sm font-semibold">النص المولّد من الرسم — معاينة فقط</summary>
   <div className="mt-3 space-y-3">
    {path.routes.length>1&&<label className="block max-w-sm text-sm">اختر المسار
     <select aria-label="مسار معاينة نص الرسم" value={selectedRoute} onChange={event=>setSelectedRoute(Number(event.target.value))} className="mt-1 block w-full rounded border bg-background p-2">
      {path.routes.map((_,i)=><option key={i} value={i}>المسار {arabicDigits(i+1)}</option>)}
     </select>
    </label>}
    {generated?<p dir="rtl" className="select-text whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm leading-loose">{generated}</p>
     :<p role="status" className="text-sm text-muted-foreground">تعذر توليد النص: بعض هويات الرواة غير مكتملة، أو في المسار تكرار يحتاج مراجعة.</p>}
    <p className="text-xs text-muted-foreground">هذا النص للقراءة والمقارنة فقط؛ لا يغيّر السند المحفوظ أو نص الشهادة، ولا يستنتج أي اتصال غير موجود في الرسم.</p>
   </div>
  </details>
 </div>;
}

function SavedShaykhChain({text,reason,savedRoutes}:{reason:string;text:string;savedRoutes?:string[][]}){
 const [route,setRoute]=useState(0);
 const saved=savedRoutes?.[route];
 return <div className="mt-3 space-y-3">
  <p className="text-sm text-muted-foreground">{reason}</p>
  {saved&&<>
   <p className="text-sm font-medium">المسار من النص المحفوظ</p>
   {savedRoutes!.length>1&&<select aria-label="مسارات النص المحفوظ" className="rounded border bg-background p-1 text-sm" value={route} onChange={event=>setRoute(Number(event.target.value))}>
    {savedRoutes!.map((_,index)=><option key={index} value={index}>المسار {arabicDigits(index+1)}</option>)}
   </select>}
   <ol className="mx-auto grid max-w-sm gap-2" dir="rtl">
    {saved.map((name,index)=><li key={index}><BranchPersonCard name={name} number={index+1}/></li>)}
   </ol>
  </>}
  <p className="whitespace-pre-wrap leading-loose">{text}</p>
 </div>;
}
