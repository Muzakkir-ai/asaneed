import {useMemo,useState} from 'react';
import {ArrowDown,Plus,GitFork,ChevronDown,ChevronUp} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import BranchPersonCard from './BranchPersonCard';
import ChainNarratorRow from './ChainNarratorRow';
import {sanadPathLayout,type SanadPathBlock} from '../lib/sanadPathLayout';
import {observedLinks} from '../lib/narratorSelection';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';
type Node={editorKey?:string;name:string;source:boolean;personId?:string;sourceLevel?:'upper'|'branch'|null};
type Ref={branch:number;index:number};
export type ConnectedChainProps={branches:Node[][];onChange:(v:Node[][])=>void;lib:BuilderLibrary;onCreate:(name:string,alias:string,distinct:boolean)=>Promise<BuilderPerson>;onShortName?:(id:string,value:string)=>Promise<void>;startId?:string;endId?:string;start:string;end:string;roles?:boolean};
export default function ConnectedChainEditor({branches,onChange,lib,onCreate,onShortName,startId,endId,start,end,roles=false}:ConnectedChainProps){
 const [folded,setFolded]=useState(false);
 const links=useMemo(()=>observedLinks(lib),[lib]);
 const refs=new Map<string,Ref[]>(),values=new Map<string,Node>();
 const paths=branches.map((branch,b)=>['@start',...branch.map((n,i)=>{
  const key=n.personId?'person:'+n.personId:'draft:'+(n.editorKey||b+':'+i);
  refs.set(key,[...(refs.get(key)||[]),{branch:b,index:i}]);values.set(key,{...n,source:n.source||values.get(key)?.source||false});return key;
 }),'@end']);
 const layout=sanadPathLayout(paths);
 const blank=():Node=>({editorKey:crypto.randomUUID(),name:'',source:false});
 const commit=(transform:(nodes:Node[],branch:number)=>Node[])=>onChange(branches.map(transform));
 const selected=(key:string,b:number)=>(refs.get(key)||[]).find(r=>r.branch===b);
 const update=(key:string,node:Node)=>commit((nodes,b)=>nodes.map((n,i)=>selected(key,b)?.index===i?{...node,editorKey:n.editorKey}:n));
 const insert=(key:string)=>{const added=blank();commit((nodes,b)=>{const index=key==='@start'?-1:selected(key,b)?.index;if(index===undefined)return nodes;return [...nodes.slice(0,index+1),{...added},...nodes.slice(index+1)];});};
 const parallel=(key:string)=>{const added=blank();const extra=(refs.get(key)||[]).map(r=>branches[r.branch].map((n,i)=>i===r.index?{...added}:{...n,editorKey:crypto.randomUUID()}));onChange([...branches,...extra]);};
 const renderPerson=(key:string)=>{
  if(key==='@start'||key==='@end')return <BranchPersonCard name={key==='@start'?start.replace(/^صاحب الكتاب:\s*/u,''):end.replace(/^(?:الراوي|صاحب الرواية|صاحب الكتاب):\s*/u,'')} label={key==='@start'?(roles?'صاحب الكتاب':'بداية السند'):(roles?'صاحب الرواية':'صاحب الكتاب')} number={key==='@start'?1:Math.max(...branches.map(b=>b.length))+2}/>;
  const node=values.get(key)!,positions=refs.get(key)!,first=positions[0],nodes=branches[first.branch],previous=first.index?nodes[first.index-1]?.personId:startId,next=nodes[first.index+1]?.personId||endId;
  if(folded)return roles&&node.source?<BranchPersonCard name={node.name||'اختر الراوي'} label="صاحب الطريق" number={first.index+2}/>:null;
  const connected=!!node.personId&&links.some(l=>l.from===previous&&l.to===node.personId||l.from===node.personId&&l.to===next);
  return <div className="min-w-0"><ChainNarratorRow node={node} index={first.index} count={nodes.length} number={first.index+2} lib={lib} previous={previous} next={next} roles={roles} connected={connected} onCreate={onCreate} onShortName={onShortName} onChange={n=>update(key,n)} onRemove={()=>commit((row,b)=>row.filter((_,i)=>selected(key,b)?.index!==i))} onMove={direction=>commit((row,b)=>{const index=selected(key,b)?.index;if(index===undefined||!row[index+direction])return row;const moved=[...row];[moved[index],moved[index+direction]]=[moved[index+direction],moved[index]];return moved;})} onParallel={()=>parallel(key)}/></div>;
 };
 const connector=(key?:string)=><div className="relative flex h-9 items-center justify-center text-muted-foreground"><ArrowDown aria-hidden="true" className="h-4 w-4"/>{key&&<Button type="button" variant="outline" size="sm" className="absolute left-0 h-7 w-7 rounded-full p-0" aria-label="إضافة راوٍ في هذه الوصلة" onClick={()=>insert(key)}><Plus className="h-3 w-3"/></Button>}</div>;
 const renderBlocks=(blocks:SanadPathBlock[]):React.ReactNode=>blocks.map((block,i)=>block.kind==='person'?<div key={block.id} className="min-w-0">{renderPerson(block.id)}{!folded&&block.id!=='@end'&&(block.id==='@start'?<div className="py-2"><Button type="button" variant="outline" size="sm" onClick={()=>insert('@start')}><Plus className="h-4 w-4"/>إضافة راوٍ في البداية</Button></div>:connector(block.id))}</div>:<div key={'split-'+i} className="grid gap-3" style={{gridTemplateColumns:`repeat(${block.lanes.length},minmax(0,1fr))`}}>{block.lanes.map((lane,j)=><div key={j} className="min-w-0">{!folded&&connector()}{renderBlocks(lane)}</div>)}</div>);
 if(!layout)return <p className="text-sm text-muted-foreground">هذا التشعب يحتاج عرض الفروع المنفصلة؛ اختره لتعديل المسارات كاملة.</p>;
 return <section className="rounded-lg border p-3" dir="rtl"><Button type="button" variant="ghost" size="sm" className="mb-2 gap-2" aria-expanded={!folded} onClick={()=>setFolded(v=>!v)}>{folded?<ChevronDown className="h-4 w-4"/>:<ChevronUp className="h-4 w-4"/>}<GitFork className="h-4 w-4"/>السند المتصل — {folded?'عرض الرواة':'طيّ السند'}</Button>{renderBlocks(layout)}</section>;
}
