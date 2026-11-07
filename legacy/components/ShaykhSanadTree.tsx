import {isInheritedPersonalSanad} from '../lib/sharedShaykhSanad';
import {verifiedOnwardSources,type OnwardContext} from '../lib/verifiedOnwardSources';
import CombinedSanadView from './CombinedSanadView';
import {verifiedLegacySanad} from '../lib/verifiedLegacySanad';
import {combinedSanad} from '../lib/combinedSanad';
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
type SavedChain={reason:string;id:string;label:string;text:string;ids:string[];preparation:ReturnType<typeof prepareSavedSanadPeople>};
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
 const [paths,setPaths]=useState<Path[]>([]),[missing,setMissing]=useState<SavedChain[]>([]),[selectedId,setSelectedId]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const [{sheikhs},{sections},library]=await Promise.all([additionalShaykhs({action:'list'}),sanadSections({action:'list'}),fetch('/api/book-builder',{headers:workspaceHeaders()}).then(async response=>response.ok?await response.json() as BuilderLibrary:null).catch(()=>null)]);
    const bridges=sections.filter(s=>!s.ownerId&&s.title===UBAYDI_BRIDGE_TITLE);
    const groups=await Promise.all(sheikhs.map(async sheikh=>{
     const sources=[{id:'shared',label:'السند الشخصي',text:sheikh.personalChain,ids:sheikh.personalPersonIds,preparation:sheikh.preparedShared,continuationId:sheikh.continuationId,context:{shaykhId:sheikh.id} as OnwardContext},{id:'kubra',label:'سند شخصي مستقل',text:sheikh.kubraPersonalChain,ids:sheikh.kubraPersonalPersonIds,preparation:null,continuationId:sheikh.kubraContinuationId,context:{shaykhId:sheikh.id} as OnwardContext}];
     if(sources[0].text.trim()===sources[1].text.trim())sources.pop();
     const {sanads}=await additionalReadingSanads({action:'list',shaykhId:sheikh.id});
     const seen=new Set(sources.map(s=>sanadKey(s.text).replace(/[.،؛]+$/u,'')));
     for(const sanad of sanads){
      if(sheikh.sharedSughraSanad&&isInheritedPersonalSanad(sheikh.personalChain,sanad,sheikh.personalPersonIds))continue;
      const text=sanad.unifiedSanad?.prefix||(!sanad.tariqNumber?sanad.sanadText:'');
      const key=sanadKey(text).replace(/[.،؛]+$/u,'');
      if(!key||(!sanad.variantName&&!sanad.unifiedSanad&&!sanad.continuationId&&!sanad.personalPersonIds?.length&&seen.has(key)))continue;
      seen.add(key);
      sources.push({id:sanad.id,label:[sanad.rawi,sanad.variantName,sanad.tariqName].filter(Boolean).join(' — '),text,ids:sanad.personalPersonIds??[],preparation:sanad.preparedPeople??null,continuationId:sanad.continuationId,context:{qariId:sanad.qariId,rawi:sanad.rawi,shaykhId:sheikh.id}});
     }
     return sources.filter(s=>s.text.trim()).map(s=>{
      const label=sheikh.name+' — '+s.label;
      let names:string[][]=[],text=s.text;
      const savedPreparation=s.preparation??recoverSharedBridgePrefix(s.text,s.ids,bridges);
      try{text=resolveBuilderPrefix(s.text,bridges).text;names=numberedPaths(text,s.ids,savedPreparation,s.text);}catch{/* Incomplete or ambiguous saved chain. */}
      const preparation=savedPreparation||prepareSavedSanadPeople(text);
      const onward=library?verifiedOnwardSources(library,s.context):[];
      const diagram=savedSharedBridgeDiagram(s.text,s.ids,onward,savedPreparation,{id:sheikh.id,name:sheikh.name},s.continuationId??undefined,s.context)?.diagram;
      const id=sheikh.id+':'+s.id;
      if(diagram&&combinedSanad(diagram.paths)){
       const title=onward.find(item=>item.source.id===diagram.sourceId)?.source.title;
       const routeLabels=diagram.paths.map(()=>[label,title].filter(Boolean).join(' — '));
       return {id,label,text,ids:s.ids,preparation,paths:[{id,label,routes:diagram.paths,names:diagram.names,routeLabels}],reason:''};
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
       if(combinedSanad(routes))return {id:incomplete?id+':review':id,label,text,ids:s.ids,preparation,paths:[{id,label,routes,names:graphNames,routeLabels}],reason:incomplete?reason:''};
      }
      return {id,label,text,ids:s.ids,preparation,paths:[],reason};
     });
    }));
    if(!cancelled){setPaths(groups.flatMap(group=>group.flatMap(row=>row.paths)));setMissing(groups.flatMap(group=>group.filter(row=>row.reason)));}
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'تعذر تحميل أسانيد المشايخ');}
   finally{if(!cancelled)setLoading(false);}
  }
  void load();return()=>{cancelled=true;};
 },[]);
 const selected=paths.find(path=>path.id===selectedId);
 const selectedSource=missing.find(source=>source.id===selectedId);
 const allRoutes=paths.flatMap(path=>path.routes);
 const combined=combinedSanad(allRoutes);
 return <section className="space-y-4" aria-label="أسانيد المشايخ">
  <h3 className="font-bold">أسانيد المشايخ</h3>
  <p className="text-sm text-muted-foreground">يبدأ الترقيم من الإمام ابن الجزري. اختر سندًا شخصيًا لعرض رواته حتى الشيخ.</p>
  {loading?<p role="status">جارٍ تحميل الأسانيد…</p>:error?<p role="alert">{error}</p>:<>
   {paths.length+missing.length>0&&<label className="block text-sm">الشيخ والسند الشخصي<select className="mt-1 block w-full rounded-lg border bg-background p-2" value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value="">عرض جميع الأسانيد الشخصية</option>{paths.map(path=><option key={path.id} value={path.id}>{path.label} · {[...new Set(path.routes.map(route=>route.length))].sort((a,b)=>a-b).map(arabicDigits).join(' / ')}</option>)}{missing.map(source=><option key={source.id} value={source.id}>{source.label} · يحتاج مراجعة قبل الترقيم</option>)}</select></label>}
   {selectedSource?<SavedShaykhChain key={selectedSource.id} {...selectedSource}/>:selected?<CompactShaykhPath key={selected.id} path={selected}/>:combined?.rows.length
    ?<CompactShaykhPath key="all" path={{id:'all',label:'الأسانيد المعتمدة',routes:allRoutes,names:Object.assign({},...paths.map(path=>path.names)),routeLabels:paths.flatMap(path=>path.routeLabels)}}/>
    :paths.length>0&&<p role="status" className="text-sm text-muted-foreground">يتعذر عرض المسارات معًا في رسم بلا دورات. اختر سندًا من القائمة.</p>}
   {!selectedSource&&missing.length>0&&<details className="rounded-lg border p-3"><summary>أسانيد تحتاج مراجعة قبل الترقيم ({arabicDigits(missing.length)})</summary><ul className="list-disc space-y-1 ps-5">{missing.map(({label,text,reason},i)=><li key={i}><details><summary>{label}</summary><SavedShaykhChain reason={reason} text={text}/></details></li>)}</ul></details>}
  </>}
 </section>;
}

function CompactShaykhPath({path}:{path:Path}){
 return <CombinedSanadView paths={path.routes} routeLabels={path.routeLabels} groupJazariStudents source={path.label} renderPerson={(id,positions)=><BranchPersonCard name={path.names[id]??id} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>}/>;
}

function SavedShaykhChain({text,reason}:{reason:string;text:string}){
 return <div className="mt-3 space-y-3">
  <p className="text-sm text-muted-foreground">{reason}</p>
  <p className="whitespace-pre-wrap leading-loose">{text}</p>
 </div>;
}
