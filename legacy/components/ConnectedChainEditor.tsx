import {arabicDigits} from '../lib/arabicDigits';
import {useMemo} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import BranchPersonCard from './BranchPersonCard';
import ChainNarratorRow from './ChainNarratorRow';
import SanadPathView from './SanadPathView';
import {observedLinks} from '../lib/narratorSelection';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';
type Node={editorKey?:string;name:string;source:boolean;personId?:string;sourceLevel?:'upper'|'branch'|null};
type Ref={branch:number;index:number};
export type ConnectedChainProps={branches:Node[][];onChange?:(v:Node[][])=>void;lib:BuilderLibrary;onCreate?:(name:string,alias:string,distinct:boolean)=>Promise<BuilderPerson>;onShortName?:(id:string,value:string)=>Promise<void>;startId?:string;endId?:string;start:string;end:string;roles?:boolean;showPaths?:boolean};
export default function ConnectedChainEditor({branches,onChange,lib,onCreate,onShortName,startId,endId,start,end,roles=false,showPaths=true}:ConnectedChainProps){
 const links=useMemo(()=>observedLinks(lib),[lib]);
 const refs=new Map<string,Ref[]>(),values=new Map<string,Node>();
 const paths=branches.map((branch,b)=>{
  const seen=new Map<string,number>();
  return ['@start',...branch.map((n,i)=>{
  const identity=n.personId?'person:'+n.personId:'draft:'+(n.editorKey||b+':'+i);
  const occurrence=seen.get(identity)||0;
  seen.set(identity,occurrence+1);
  const key=JSON.stringify([identity,occurrence]);
  refs.set(key,[...(refs.get(key)||[]),{branch:b,index:i}]);values.set(key,{...n,source:n.source||values.get(key)?.source||false});return key;
  }),'@end'];
 });
 const blank=():Node=>({editorKey:crypto.randomUUID(),name:'',source:false});
 const commit=(transform:(nodes:Node[],branch:number)=>Node[])=>onChange?.(branches.map(transform));
 const selected=(key:string,b:number)=>(refs.get(key)||[]).find(r=>r.branch===b);
 const update=(key:string,node:Node)=>{
  const displayed=values.get(key)!;
  const sourceChanged=node.source!==displayed.source||node.sourceLevel!==displayed.sourceLevel;
  commit((nodes,b)=>nodes.map((n,i)=>selected(key,b)?.index===i?{
   ...n,name:node.name,personId:node.personId,...(sourceChanged?{source:node.source,sourceLevel:node.sourceLevel}:{}),
  }:n));
 };
 const insert=(key:string)=>{const added=blank();commit((nodes,b)=>{const index=key==='@start'?-1:selected(key,b)?.index;if(index===undefined)return nodes;return [...nodes.slice(0,index+1),{...added},...nodes.slice(index+1)];});};
 const parallel=(key:string)=>{const added=blank();const extra=(refs.get(key)||[]).map(r=>branches[r.branch].map((n,i)=>i===r.index?{...added}:{...n,editorKey:crypto.randomUUID()}));onChange?.([...branches,...extra]);};
 const renderPerson=(key:string,positions:number[])=>{
  if(key==='@start'||key==='@end')return <BranchPersonCard name={key==='@start'?start.replace(/^صاحب الكتاب:\s*/u,''):end.replace(/^(?:الراوي|صاحب الرواية|صاحب الكتاب):\s*/u,'')} label={key==='@start'?(roles?'صاحب الكتاب':'بداية السند'):(roles?'صاحب الرواية':'صاحب الكتاب')} number={positions[0]} badgeLabels={positions.length>1?positions.map(arabicDigits):undefined}/>;
  const node=values.get(key)!,first=refs.get(key)![0],nodes=branches[first.branch],previous=first.index?nodes[first.index-1]?.personId:startId,next=nodes[first.index+1]?.personId||endId;
  const connected=!!node.personId&&links.some(l=>l.from===previous&&l.to===node.personId||l.from===node.personId&&l.to===next);
  if(!onCreate||!onChange)return <BranchPersonCard name={node.name} label={node.source?'صاحب الطريق':undefined} number={positions[0]} badgeLabels={positions.map(arabicDigits)} connected={node.personId?connected:undefined}/>;
  return <ChainNarratorRow node={node} index={first.index} count={nodes.length} number={positions[0]} badgeLabels={positions.length>1?positions.map(arabicDigits):undefined} lib={lib} previous={previous} next={next} roles={roles} connected={connected} onCreate={onCreate} onShortName={onShortName} onChange={n=>update(key,n)} onRemove={()=>commit((row,b)=>row.filter((_,i)=>selected(key,b)?.index!==i))} onMove={direction=>commit((row,b)=>{const index=selected(key,b)?.index;if(index===undefined||!row[index+direction])return row;const moved=[...row];[moved[index],moved[index+direction]]=[moved[index+direction],moved[index]];return moved;})} onParallel={showPaths?()=>parallel(key):undefined}/>;
 };
 return <SanadPathView paths={paths} showPaths={showPaths} renderPerson={renderPerson} afterPerson={onChange?key=>key==='@end'?null:<Button type="button" variant="outline" size="sm" className="h-7 w-7 rounded-full p-0" aria-label={key==='@start'?'إضافة راوٍ في البداية':'إضافة راوٍ في هذه الوصلة'} onClick={()=>insert(key)}><Plus className="h-3 w-3"/></Button>:undefined}/>;
}
