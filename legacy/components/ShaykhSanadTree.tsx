import {useEffect,useState} from 'react';
import {additionalShaykhs,sanadSections} from '../lib/api';
import {arabicDigits} from '../lib/arabicDigits';
import {UBAYDI_BRIDGE_TITLE,resolveBuilderPrefix} from '../lib/builderPrefix';
import {sanadKey} from '../lib/unifiedSanad';
import {prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import {preparedSanadGraph} from '../lib/preparedSanadGraph';
import PersonalSanadInput from './PersonalSanadInput';
import {Button} from '@project/components/ui/button';

type Path={id:string;label:string;names:string[]};
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
 const graph=preparedSanadGraph(prepared,prepared.tokens.map((token,i)=>({...token,personId:ids.length===prepared.tokens.length?ids[i]:undefined})));
 return graph?{paths:graph.paths.map(path=>path.map(id=>graph.nodes.find(node=>node.id===id)!.name)),suffix:prepared.suffix}:null;
}
/** The shared Ubaydi text explicitly names its split and its parallel teachers. */
function sharedBridgePaths(source:string){
 const match=/^(.*?)\s*\(ح\)\.\s*وقرأ (.+?) أيضًا على (.+?)،\s*عن مشايخ؛\s*منهم (.+?)،\s*وهم على (.+?)\s*$/u.exec(source.trim());
 if(!match)return null;
 const [,first,origin,second,teachers,end]=match;
 const main=linearNames(first);
 const pivot=main.findIndex(name=>sanadKey(name)===sanadKey(origin));
 if(pivot<0)return null;
 const rest=linearNames(second);
 const parallel=teachers.split(/،\s*و/u);
 if(!rest.length||parallel.length<2)return null;
 return [[...main,end],...parallel.map(teacher=>[...main.slice(0,pivot+1),...rest,teacher,end])];
}
function numberedPaths(source:string,ids:string[]){
 const prefix=graphPaths(source,'ubaydi',ids);
 const tail=prefix?.suffix.replace(/^\s*،\s*/u,'').trim()||'';
 const continuation=tail?graphPaths('كما أخذته '+tail,'jazari'):null;
 const endings=sharedBridgePaths(tail)||continuation?.paths||[linearNames(tail)];
 const full=graphPaths(source,'jazari');
 const routes=prefix&&tail?prefix.paths.flatMap(path=>endings.map(end=>[...path,...end])):full?.paths||[linearNames(source)];
 return routes.filter(names=>names.length&&names.every(name=>name.length>=2&&name.length<=250&&!/[،؛.()]/u.test(name))&&/(?:ابن الجزري|محمد بن محمد (?:بن محمد )?الجزري)$/u.test(sanadKey(names.at(-1)!)))
  .map(names=>[rootName,...names.slice(0,-1).reverse()]);
}
function BranchView({branch,depth,selected,onSelect,branchFrom}:{branch:Branch;depth:number;branchFrom?:string;selected?:Path;onSelect:(path:Path)=>void}){
 return <li className="min-w-0 space-y-2">{branchFrom?<span className="block text-xs text-primary">فرع من {branchFrom}</span>:depth>1&&<span aria-hidden="true" className="block text-center text-primary">↓</span>}<span className={'block w-full break-words rounded-lg border px-3 py-1 '+(selected?.names[depth-1]===branch.name?'border-primary bg-primary/10':'')}>{arabicDigits(depth)} · {branch.name}</span>
 {branch.ends.map(path=><Button key={path.id} type="button" size="sm" variant={selected?.id===path.id?'default':'outline'} onClick={()=>onSelect(path)}>{path.label}</Button>)}
 {branch.children.size>0&&<ul className="min-w-0 space-y-2">{branch.children.size>1&&<li className="text-xs font-medium text-primary">↳ {arabicDigits(branch.children.size)} فروع</li>}{[...branch.children.values()].map(child=><BranchView key={child.name} branch={child} depth={depth+1} branchFrom={branch.children.size>1?branch.name:undefined} selected={selected} onSelect={onSelect}/>)}</ul>}
 </li>;
}
export default function ShaykhSanadTree(){
 const [paths,setPaths]=useState<Path[]>([]),[missing,setMissing]=useState<{label:string;text:string;ids:string[];preparation:ReturnType<typeof prepareSavedSanadPeople>}[]>([]),[selected,setSelected]=useState<Path>(),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const [{sheikhs},{sections}]=await Promise.all([additionalShaykhs({action:'list'}),sanadSections({action:'list'})]);
    const bridges=sections.filter(s=>!s.ownerId&&s.title===UBAYDI_BRIDGE_TITLE);
    const groups=sheikhs.map(sheikh=>{
     const sources=[{id:'shared',label:'السند الشخصي',text:sheikh.personalChain,ids:sheikh.personalPersonIds,preparation:sheikh.preparedShared},{id:'kubra',label:'سند شخصي مستقل',text:sheikh.kubraPersonalChain,ids:sheikh.kubraPersonalPersonIds,preparation:null}];
     if(sources[0].text.trim()===sources[1].text.trim())sources.pop();
     return sources.filter(s=>s.text.trim()).map(s=>{
      const label=sheikh.name+' — '+s.label;
      let names:string[][]=[],text=s.text;
      try{text=resolveBuilderPrefix(s.text,bridges).text;names=numberedPaths(text,s.ids);}catch{/* Incomplete or ambiguous saved chain. */}
      const preparation=s.preparation||prepareSavedSanadPeople(text);
      return {label,text,ids:s.ids,preparation,paths:names.map((route,i)=>({id:sheikh.id+':'+s.id+':'+i,label:label+(names.length>1?' — فرع '+arabicDigits(i+1):''),names:[...route,sheikh.name]}))};
     });
    });
    if(!cancelled){setPaths(groups.flatMap(group=>group.flatMap(row=>row.paths)));setMissing(groups.flatMap(group=>group.filter(row=>!row.paths.length)));}
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'تعذر تحميل أسانيد المشايخ');}
   finally{if(!cancelled)setLoading(false);}
  }
  void load();return()=>{cancelled=true;};
 },[]);
 const root:Branch={name:rootName,children:new Map(),ends:[]};
 for(const path of selected?[selected]:paths){
  let branch=root;
  for(const name of path.names.slice(1)){
   let child=branch.children.get(name);
   if(!child){child={name,children:new Map(),ends:[]};branch.children.set(name,child);}
   branch=child;
  }
  branch.ends.push(path);
 }
 return <section className="space-y-4" aria-label="أسانيد المشايخ">
  <h3 className="font-bold">أسانيد المشايخ</h3>
  <p className="text-sm text-muted-foreground">يبدأ الترقيم من الإمام ابن الجزري. اختر سندًا شخصيًا لعرض رواته حتى الشيخ.</p>
  {loading?<p role="status">جارٍ تحميل الأسانيد…</p>:error?<p role="alert">{error}</p>:<>
   {paths.length>0?<><label className="block text-sm">الشيخ والسند الشخصي<select className="mt-1 block w-full rounded-lg border bg-background p-2" value={selected?.id||''} onChange={e=>setSelected(paths.find(path=>path.id===e.target.value))}><option value="">عرض جميع الأسانيد الشخصية</option>{paths.map(path=><option key={path.id} value={path.id}>{path.label} · {arabicDigits(path.names.length)}</option>)}</select></label>
    <ul className="rounded-xl border bg-card p-3"><BranchView branch={root} depth={1} selected={selected} onSelect={setSelected}/></ul></>:<p>تظهر الأسانيد أدناه كما حُفظت في ملفات المشايخ.</p>}
   {missing.length>0&&<details className="rounded-lg border p-3"><summary>أسانيد تحتاج مراجعة قبل الترقيم ({arabicDigits(missing.length)})</summary><ul className="list-disc space-y-1 ps-5">{missing.map(({label,text,ids,preparation},i)=><li key={i}><details><summary>{label}</summary><SavedShaykhChain text={text} ids={ids} preparation={preparation}/></details></li>)}</ul></details>}
  </>}
 </section>;
}

function SavedShaykhChain({text,ids,preparation}:{text:string;ids:string[];preparation:ReturnType<typeof prepareSavedSanadPeople>}){
 return <div className="mt-3 space-y-3">
  {(ids.length>0||preparation)&&<PersonalSanadInput value={text} personIds={ids} preparation={preparation} readOnly onApply={()=>{}}/>}
  <p className="whitespace-pre-wrap leading-loose">{text}</p>
 </div>;
}
