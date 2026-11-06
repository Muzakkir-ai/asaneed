import BranchPersonCard from './BranchPersonCard';
import SanadPathView from './SanadPathView';
import {useEffect,useState} from 'react';
import {additionalShaykhs,additionalReadingSanads,sanadSections} from '../lib/api';
import {arabicDigits} from '../lib/arabicDigits';
import {UBAYDI_BRIDGE_TITLE,resolveBuilderPrefix} from '../lib/builderPrefix';
import {sanadKey} from '../lib/unifiedSanad';
import {preparedSanadText,prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import {linkSharedBridge,linkedBridgeTails,recoverSharedBridgePrefix,sharedBridgePaths} from '../lib/sharedBridge';
import {preparedSanadGraph} from '../lib/preparedSanadGraph';
import PersonalSanadInput from './PersonalSanadInput';
import type {BuilderLibrary} from '../lib/bookBuilder';
import {workspaceHeaders} from '../lib/workspaceSelection';
import {Button} from '@project/components/ui/button';

type Path={id:string;label:string;routes:string[][];graphRoutes?:string[][];graphNames?:Record<string,string>};
type SavedChain={id:string;label:string;text:string;ids:string[];preparation:ReturnType<typeof prepareSavedSanadPeople>};
type Branch={name:string;children:Map<string,Branch>;ends:Path[]};
const rootName='الإمام ابن الجزري';
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
  .map(names=>[rootName,...names.slice(0,-1).reverse()]);
}
function BranchView({branch,depth,selected,onSelect,branchFrom}:{branch:Branch;depth:number;branchFrom?:string;selected?:Path;onSelect:(path:Path)=>void}){
 return <li className="min-w-0 space-y-2">{branchFrom?<span className="block text-xs text-primary">فرع من {branchFrom}</span>:depth>1&&<div aria-hidden="true" className="sanad-graph-gap"><span className="sanad-graph-arrow"/></div>}<BranchPersonCard name={branch.name} number={depth}/>
 {branch.ends.map(path=><Button key={path.id} type="button" size="sm" variant={selected?.id===path.id?'default':'outline'} onClick={()=>onSelect(path)}>{path.label}</Button>)}
 {branch.children.size>0&&<ul className="min-w-0 space-y-2">{depth===1?<li className="text-sm font-semibold text-primary">أصحاب الجزري</li>:branch.children.size>1&&<li className="text-xs font-medium text-primary">↳ {arabicDigits(branch.children.size)} فروع</li>}{[...branch.children.values()].map(child=><BranchView key={child.name} branch={child} depth={depth+1} branchFrom={depth>1&&branch.children.size>1?branch.name:undefined} selected={selected} onSelect={onSelect}/>)}</ul>}
 </li>;
}
export default function ShaykhSanadTree(){
 const [paths,setPaths]=useState<Path[]>([]),[missing,setMissing]=useState<SavedChain[]>([]),[selectedId,setSelectedId]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const [{sheikhs},{sections},library]=await Promise.all([additionalShaykhs({action:'list'}),sanadSections({action:'list'}),fetch('/api/book-builder',{headers:workspaceHeaders()}).then(async response=>response.ok?await response.json() as BuilderLibrary:null).catch(()=>null)]);
    const bridges=sections.filter(s=>!s.ownerId&&s.title===UBAYDI_BRIDGE_TITLE);
    const linked=library?bridges.map(bridge=>library.sharedBridgeGraphs?.find(graph=>graph.source.id===bridge.id&&graph.source.body===bridge.body)??linkSharedBridge(bridge,library.people)).filter(bridge=>bridge!==null):[];
    const groups=await Promise.all(sheikhs.map(async sheikh=>{
     const sources=[{id:'shared',label:'السند الشخصي',text:sheikh.personalChain,ids:sheikh.personalPersonIds,preparation:sheikh.preparedShared},{id:'kubra',label:'سند شخصي مستقل',text:sheikh.kubraPersonalChain,ids:sheikh.kubraPersonalPersonIds,preparation:null}];
     if(sources[0].text.trim()===sources[1].text.trim())sources.pop();
     const {sanads}=await additionalReadingSanads({action:'list',shaykhId:sheikh.id});
     const seen=new Set(sources.map(s=>sanadKey(s.text).replace(/[.،؛]+$/u,'')));
     for(const sanad of sanads){
      const text=sanad.unifiedSanad?.prefix||(!sanad.tariqNumber?sanad.sanadText:'');
      const key=sanadKey(text).replace(/[.،؛]+$/u,'');
      if(!key||seen.has(key))continue;
      seen.add(key);
      sources.push({id:sanad.id,label:[sanad.rawi,sanad.variantName,sanad.tariqName].filter(Boolean).join(' — '),text,ids:sanad.personalPersonIds??[],preparation:sanad.preparedPeople??null});
     }
     return sources.filter(s=>s.text.trim()).map(s=>{
      const label=sheikh.name+' — '+s.label;
      let names:string[][]=[],text=s.text;
      const savedPreparation=s.preparation??recoverSharedBridgePrefix(s.text,s.ids,bridges);
      try{text=resolveBuilderPrefix(s.text,bridges).text;names=numberedPaths(text,s.ids,savedPreparation,s.text);}catch{/* Incomplete or ambiguous saved chain. */}
      const preparation=savedPreparation||prepareSavedSanadPeople(text);
      if(savedPreparation?.reviewed&&preparedSanadText(savedPreparation).trim()===s.text.trim()&&s.ids.length===savedPreparation.tokens.length){
       const graph=preparedSanadGraph(savedPreparation,savedPreparation.tokens.map((token,i)=>({...token,personId:s.ids[i]})));
       const tail=savedPreparation.suffix.replace(/^\s*،\s*/u,'').trim();
       const matches=linked.map(bridge=>linkedBridgeTails(bridge,tail,s.ids.at(-1)!)).filter(tails=>tails!==null);
       if(graph&&matches.length===1){
        const tails=matches[0];
        const graphNames=Object.fromEntries([...tails.flat(),...graph.nodes].map(node=>[node.id,node.name]));
        const issuerKey='shaykh:'+sheikh.id;
        graphNames[issuerKey]=sheikh.name;
        const graphRoutes=graph.paths.flatMap(path=>tails.map(end=>[...path,...end.map(node=>node.id)].reverse().concat(issuerKey)));
        const paths=[{id:sheikh.id+':'+s.id,label,routes:graphRoutes.map(route=>route.map(id=>graphNames[id])),graphRoutes,graphNames}];
        return {id:sheikh.id+':'+s.id,label,text,ids:s.ids,preparation,paths};
       }
      }
      const grouped=new Map<string,{students:Set<string>;rest:string[]}>();
      for(const [,student,...rest] of names){
       const key=JSON.stringify(rest);
       const group=grouped.get(key)??{students:new Set<string>(),rest};
       if(student)group.students.add(student);
       grouped.set(key,group);
      }
      const personalBranches=new Map<string,string[][]>();
      for(const {students,rest} of grouped.values()){
       const firstLevel=students.size>1?['أصحاب الجزري — '+[...students].join('، ')]:[...students];
       const route=[rootName,...firstLevel,...rest,sheikh.name];
       const meetingName=savedPreparation?.reviewed?savedPreparation.tokens.at(-1)?.name:undefined;
       const junction=route.findIndex(name=>meetingName?sanadKey(name)===sanadKey(meetingName):/ابراهيم العبيدي$/u.test(sanadKey(name)));
       const key=JSON.stringify(junction<0?route:route.slice(junction));
       const routes=personalBranches.get(key)??[];
       routes.push(route);
       personalBranches.set(key,routes);
      }
      const paths=[...personalBranches.values()].map((routes,i)=>({
       id:sheikh.id+':'+s.id+':'+i,
       label:label+(personalBranches.size>1?' — فرع '+arabicDigits(i+1):''),
       routes,
      }));
      return {id:sheikh.id+':'+s.id,label,text,ids:s.ids,preparation,paths};
     });
    }));
    if(!cancelled){setPaths(groups.flatMap(group=>group.flatMap(row=>row.paths)));setMissing(groups.flatMap(group=>group.filter(row=>!row.paths.length)));}
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'تعذر تحميل أسانيد المشايخ');}
   finally{if(!cancelled)setLoading(false);}
  }
  void load();return()=>{cancelled=true;};
 },[]);
 const selected=paths.find(path=>path.id===selectedId);
 const selectedSource=missing.find(source=>source.id===selectedId);
 const root:Branch={name:rootName,children:new Map(),ends:[]};
 for(const path of selected?[]:paths)for(const route of path.routes){
  let branch=root;
  for(const name of route.slice(1)){
   let child=branch.children.get(name);
   if(!child){child={name,children:new Map(),ends:[]};branch.children.set(name,child);}
   branch=child;
  }
  if(!branch.ends.some(end=>end.id===path.id))branch.ends.push(path);
 }
 return <section className="space-y-4" aria-label="أسانيد المشايخ">
  <h3 className="font-bold">أسانيد المشايخ</h3>
  <p className="text-sm text-muted-foreground">يبدأ الترقيم من الإمام ابن الجزري. اختر سندًا شخصيًا لعرض رواته حتى الشيخ.</p>
  {loading?<p role="status">جارٍ تحميل الأسانيد…</p>:error?<p role="alert">{error}</p>:<>
   {paths.length+missing.length>0&&<label className="block text-sm">الشيخ والسند الشخصي<select className="mt-1 block w-full rounded-lg border bg-background p-2" value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value="">عرض جميع الأسانيد الشخصية</option>{paths.map(path=><option key={path.id} value={path.id}>{path.label} · {[...new Set(path.routes.map(route=>route.length))].sort((a,b)=>a-b).map(arabicDigits).join(' / ')}</option>)}{missing.map(source=><option key={source.id} value={source.id}>{source.label} · يحتاج مراجعة قبل الترقيم</option>)}</select></label>}
   {selectedSource?<SavedShaykhChain key={selectedSource.id} {...selectedSource}/>:selected?<SanadPathView key={selected.id} paths={selected.graphRoutes??selected.routes} renderPerson={(name,positions)=><BranchPersonCard name={selected.graphNames?.[name]??name} number={positions[0]} badgeLabels={positions.map(arabicDigits)}/>}/>:paths.length>0?<ul className="rounded-xl border bg-card p-3"><BranchView branch={root} depth={1} onSelect={path=>setSelectedId(path.id)}/></ul>:<p>تظهر الأسانيد أدناه كما حُفظت في ملفات المشايخ.</p>}
   {!selectedSource&&missing.length>0&&<details className="rounded-lg border p-3"><summary>أسانيد تحتاج مراجعة قبل الترقيم ({arabicDigits(missing.length)})</summary><ul className="list-disc space-y-1 ps-5">{missing.map(({label,text,ids,preparation},i)=><li key={i}><details><summary>{label}</summary><SavedShaykhChain text={text} ids={ids} preparation={preparation}/></details></li>)}</ul></details>}
  </>}
 </section>;
}

function SavedShaykhChain({text,ids,preparation}:{text:string;ids:string[];preparation:ReturnType<typeof prepareSavedSanadPeople>}){
 return <div className="mt-3 space-y-3">
  {(ids.length>0||preparation)&&<PersonalSanadInput value={text} personIds={ids} preparation={preparation} readOnly onApply={()=>{}}/>}
  <p className="whitespace-pre-wrap leading-loose">{text}</p>
 </div>;
}
