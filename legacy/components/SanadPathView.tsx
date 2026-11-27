import {useId,useState,type ReactNode} from 'react';
import {ChevronDown,ChevronUp,GitFork} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {arabicDigits} from '../lib/arabicDigits';
import {sanadPathLayout,sanadPositions,type SanadPathBlock} from '../lib/sanadPathLayout';
import {sanadPresentation} from '../lib/sanadPresentation';
import SanadNodePresentation from './SanadNodePresentation';
import SanadSequence,{SanadConnectorGap} from './SanadSequence';
import CombinedSanadView from './CombinedSanadView';

export default function SanadPathView({paths,renderPerson,afterPerson,unconnected,showPaths=true}:{paths:string[][];renderPerson:(id:string,positions:number[])=>ReactNode;afterPerson?:(id:string)=>ReactNode;showPaths?:boolean;unconnected?:string[]}){
 const [pathIndex,setPathIndex]=useState<number|null>(null);
 const [folded,setFolded]=useState(false);
 const [network,setNetwork]=useState(false);
 const panel=useId();
 const selected=showPaths&&pathIndex!==null?paths[pathIndex]:undefined;
 const visible=selected?[selected]:paths;
 const routeLabel=(index:number)=>'المسار '+arabicDigits((selected ? pathIndex ?? index : index)+1);
 const layout=sanadPathLayout(visible,true);
 const labels=sanadPresentation(visible);
 const networkAvailable=showPaths&&!unconnected&&paths.length>1;
 const showNetwork=networkAvailable&&network;
 const gap=(id:string,connector:'arrow'|'stem'|null)=><SanadConnectorGap connector={connector} action={afterPerson?.(id)}/>;
 function blocks(items:SanadPathBlock[],after=false):ReactNode{
  return items.map((item,i)=>{
   const next=items[i+1];
   if(item.kind==='person')return <div key={item.id} className="min-w-0" data-sanad-node={item.id}><SanadNodePresentation labels={labels.get(item.id)||[]}>{renderPerson(item.id,sanadPositions(visible,item.id))}</SanadNodePresentation>{gap(item.id,next?.kind==='person'?'arrow':!next&&after?'stem':null)}</div>;
   return <div key={'split-'+i} className="connected-chain-split grid gap-x-3" data-many-lanes={item.lanes.length>3||undefined} style={{gridTemplateColumns:`repeat(${item.lanes.length},minmax(0,1fr))`}}>
    {item.lanes.map((lane,j)=><div key={j} className="connected-chain-lane flex min-w-0 flex-col" role="group" aria-label={'الفرع '+arabicDigits(j+1)} data-branch-label={arabicDigits(j+1)}>
     {i>0&&<div aria-hidden="true" className="sanad-graph-junction sanad-graph-split"><span className="sanad-graph-arrow"/></div>}
     <div><p className="sanad-graph-lane-label text-xs font-medium text-primary">الفرع {arabicDigits(j+1)}{lane.length===0&&' · اتصال مباشر'}</p>{blocks(lane,!!(next||after))}</div><div className="sanad-graph-extension relative flex-1">{(next||after)&&<span aria-hidden="true" className="sanad-graph-stem"/>}</div>
     {(next||after)&&<div aria-hidden="true" className="sanad-graph-junction sanad-graph-merge"><span className="sanad-graph-arrow"/></div>}
    </div>)}
   </div>;
  });
 }
 return <section dir="rtl" className="sanad-graph min-w-0 rounded-lg border p-3">
  <Button type="button" variant="ghost" size="sm" className="mb-2 gap-2" aria-expanded={!folded} aria-controls={panel} onClick={()=>setFolded(v=>!v)}>{folded?<ChevronDown/>:<ChevronUp/>}<GitFork/>السند المتصل — {folded?'عرض الرواة':'طيّ السند'}</Button>
  <div id={panel} className={folded?"hidden":"flow-root"}>
   {networkAvailable&&<Button type="button" variant="outline" size="sm" className="mb-3" aria-pressed={showNetwork} onClick={()=>setNetwork(v=>!v)}>{showNetwork?'العودة إلى ترتيب السند':'معاينة الرسم الشبكي'}</Button>}
   <div className={showNetwork?'hidden':'flow-root'}>
   {showPaths&&paths.length>1&&<div className="prepared-graph-paths mb-3" role="group" aria-label="عرض الأسانيد">
    {paths.map((path,i)=><button key={i} type="button" aria-pressed={i===pathIndex} onClick={()=>setPathIndex(i)}>المسار {arabicDigits(i+1)} · {arabicDigits(path.length)} رواة</button>)}
    <button className="prepared-graph-all" type="button" aria-pressed={!selected} onClick={()=>setPathIndex(null)}>عرض الكل</button>
   </div>}
   {unconnected?<div className="space-y-2">{unconnected.map(id=><div key={id}>{renderPerson(id,[])}</div>)}</div>:layout?blocks(layout):visible.map((path,i)=><section key={i} className="mb-3 rounded-lg border p-3" aria-label={routeLabel(i)}>
    <h4 className="mb-2 text-sm font-semibold">{routeLabel(i)}</h4>
    <SanadSequence path={path} renderPerson={renderPerson} afterPerson={afterPerson} label={routeLabel(i)}/>
   </section>)}
   </div>
   {showNetwork&&<CombinedSanadView paths={visible} renderPerson={renderPerson} spacious/>}
  </div>
 </section>;
}
