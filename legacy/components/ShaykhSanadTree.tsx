import {useEffect,useState} from 'react';
import {additionalShaykhs,additionalReadingSanads,sanadSections} from '../lib/api';
import {arabicDigits} from '../lib/arabicDigits';
import {UBAYDI_BRIDGE_TITLE,resolveBuilderPrefix} from '../lib/builderPrefix';
import {sanadKey} from '../lib/unifiedSanad';
import {prepareSavedSanadPeople} from '../lib/preparedSanadPeople';
import {preparedSanadGraph} from '../lib/preparedSanadGraph';
import {Button} from '@project/components/ui/button';

type Path={id:string;label:string;names:string[]};
type Branch={name:string;children:Map<string,Branch>;ends:Path[]};
const rootName='الإمام ابن الجزري';
function linearNames(source:string){
 const body=source.trim().replace(/[.،؛]+$/u,'');
 if(/[().؛\n]|وقرأ|وأخذ|وهما|وهم|وهو| والشيخ/u.test(body))return [];
 return body.split(/،\s*عن\s+/u).map(part=>part.replace(/^(?:(?:كما أخذته|كما أخذت ذلك)\s+)?عن\s+/u,'').trim());
}
function numberedPaths(source:string){
 const prepared=prepareSavedSanadPeople(source);
 const graph=prepared&&preparedSanadGraph(prepared,prepared.tokens);
 const tail=prepared?linearNames(prepared.suffix.replace(/^\s*،\s*/u,'')):[];
 const routes=graph&&tail.length?graph.paths.map(path=>[...path.map(id=>graph.nodes.find(node=>node.id===id)!.name),...tail]):[linearNames(source)];
 return routes.filter(names=>names.length&&names.every(name=>name.length>=2&&name.length<=250)&&/(?:ابن الجزري|محمد بن محمد (?:بن محمد )?الجزري)$/u.test(sanadKey(names.at(-1)!)))
  .map(names=>[rootName,...names.slice(0,-1).reverse()]);
}
function BranchView({branch,depth,selected,onSelect}:{branch:Branch;depth:number;selected?:Path;onSelect:(path:Path)=>void}){
 return <li className="space-y-2"><span className={'inline-block rounded-lg border px-3 py-1 '+(selected?.names[depth-1]===branch.name?'border-primary bg-primary/10':'')}>{arabicDigits(depth)} · {branch.name}</span>
 {branch.ends.map(path=><Button key={path.id} type="button" size="sm" variant={selected?.id===path.id?'default':'outline'} onClick={()=>onSelect(path)}>{path.label}</Button>)}
 {branch.children.size>0&&<ul className="ms-3 space-y-2 border-s border-primary/30 ps-3">{[...branch.children.values()].map(child=><BranchView key={child.name} branch={child} depth={depth+1} selected={selected} onSelect={onSelect}/>)}</ul>}
 </li>;
}
export default function ShaykhSanadTree(){
 const [paths,setPaths]=useState<Path[]>([]),[missing,setMissing]=useState<string[]>([]),[selected,setSelected]=useState<Path>(),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const [{sheikhs},{sections}]=await Promise.all([additionalShaykhs({action:'list'}),sanadSections({action:'list'})]);
    const bridges=sections.filter(s=>!s.ownerId&&s.title===UBAYDI_BRIDGE_TITLE);
    const groups=await Promise.all(sheikhs.map(async sheikh=>{
     const {sanads}=await additionalReadingSanads({action:'list',shaykhId:sheikh.id});
     const sources=[{id:'shared',label:'السند المشترك',text:sheikh.personalChain},{id:'kubra',label:'سند الكبرى',text:sheikh.kubraPersonalChain},...sanads.map(s=>({id:s.id,label:[s.rawi,s.tariqName,s.variantName].filter(Boolean).join(' — '),text:s.unifiedSanad?.prefix||s.sanadText}))];
     return sources.filter(s=>s.text.trim()).map(s=>{
      const label=sheikh.name+' — '+s.label;
      let names:string[][]=[];
      try{names=numberedPaths(resolveBuilderPrefix(s.text,bridges).text);}catch{/* Incomplete or ambiguous saved chain. */}
      return {label,paths:names.map((route,i)=>({id:sheikh.id+':'+s.id+':'+i,label:label+(names.length>1?' — فرع '+arabicDigits(i+1):''),names:[...route,sheikh.name]}))};
     });
    }));
    if(!cancelled){setPaths(groups.flatMap(group=>group.flatMap(row=>row.paths)));setMissing(groups.flatMap(group=>group.filter(row=>!row.paths.length).map(row=>row.label)));}
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
  <p className="text-sm text-muted-foreground">يبدأ الترقيم من الإمام ابن الجزري. اختر طريقًا لعرض سنده وعدد رواته.</p>
  {loading?<p role="status">جارٍ تحميل الأسانيد…</p>:error?<p role="alert">{error}</p>:<>
   {paths.length>0?<><label className="block text-sm">الشيخ والطريق<select className="mt-1 block w-full rounded-lg border bg-background p-2" value={selected?.id||''} onChange={e=>setSelected(paths.find(path=>path.id===e.target.value))}><option value="">عرض جميع الطرق</option>{paths.map(path=><option key={path.id} value={path.id}>{path.label} · {arabicDigits(path.names.length)}</option>)}</select></label>
    <ul className="rounded-xl border bg-card p-3"><BranchView branch={root} depth={1} selected={selected} onSelect={setSelected}/></ul></>:<p>لا توجد أسانيد قابلة للعرض بعد.</p>}
   {missing.length>0&&<details className="rounded-lg border p-3"><summary>أسانيد تحتاج مراجعة قبل الترقيم ({arabicDigits(missing.length)})</summary><ul className="list-disc space-y-1 ps-5">{missing.map((label,i)=><li key={i}>{label}</li>)}</ul></details>}
  </>}
 </section>;
}
