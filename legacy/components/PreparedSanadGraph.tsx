import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import type {PreparedGraph,PreparedGraphNode} from '../lib/preparedSanadGraph';
export default function PreparedSanadGraph({graph,renderNode}:{graph:PreparedGraph;renderNode:(node:PreparedGraphNode,ordinal:number)=>ReactNode}){
 const arrowId=useId().replace(/:/g,'');
 const [pathIndex,setPathIndex]=useState(0),[drawing,setDrawing]=useState<{d:string;on:boolean}[]>([]);
 const host=useRef<HTMLDivElement>(null),path=graph.paths[Math.min(pathIndex,graph.paths.length-1)];
 const visible=graph.nodes,signature=JSON.stringify(graph);
 useEffect(()=>{
  const element=host.current;if(!element)return;
  const draw=()=>{const frame=element.getBoundingClientRect(),boxes=new Map<string,DOMRect>();element.querySelectorAll<HTMLElement>('[data-graph-node]').forEach(node=>boxes.set(node.dataset.graphNode!,node.getBoundingClientRect()));let shortcut=0;const result:{d:string;on:boolean}[]=[];
   for(const edge of graph.edges){const a=boxes.get(edge.from),b=boxes.get(edge.to);if(!a||!b)continue;const from=visible.findIndex(n=>n.id===edge.from),to=visible.findIndex(n=>n.id===edge.to);const active=path.some((id,i)=>id===edge.from&&path[i+1]===edge.to);let d:string;
    if(to===from+1){d=`M ${a.left-frame.left+a.width/2} ${a.bottom-frame.top} L ${b.left-frame.left+b.width/2} ${b.top-frame.top-4}`;}
    else{const left=shortcut++%2===0,x=left?7:frame.width-7,ax=left?a.left-frame.left:a.right-frame.left,bx=left?b.left-frame.left-4:b.right-frame.left+4;d=`M ${ax} ${a.top-frame.top+a.height/2} L ${x} ${a.top-frame.top+a.height/2} L ${x} ${b.top-frame.top+b.height/2} L ${bx} ${b.top-frame.top+b.height/2}`;}
    result.push({d,on:active});
   }
   result.sort((a,b)=>Number(a.on)-Number(b.on));setDrawing(previous=>JSON.stringify(previous)===JSON.stringify(result)?previous:result);
  };
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(draw);observer?.observe(element);element.querySelectorAll('[data-graph-node]').forEach(n=>observer?.observe(n));window.addEventListener('resize',draw);draw();document.fonts?.ready.then(draw);return()=>{observer?.disconnect();window.removeEventListener('resize',draw);};
 },[signature,pathIndex]);
 const shortest=graph.paths[0].length;
 return <section className="prepared-sanad-graph" aria-label="الفروع المتصلة عند ح"><div className="prepared-graph-paths" role="group" aria-label="تمييز مسار السند">{graph.paths.map((p,i)=><button key={p.join('|')} type="button" aria-pressed={p===path} onClick={()=>setPathIndex(i)}><strong>{p.length===shortest?'السند الأعلى':'فرع ح '+arabicDigits(i)}</strong><span>{arabicDigits(p.length)} رواة</span></button>)}</div><div ref={host} className="prepared-graph-canvas"><svg className="prepared-graph-wires" aria-hidden="true"><defs><marker id={arrowId+'-active'} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M1 1 L6 3.5 L1 6" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.4"/></marker><marker id={arrowId+'-muted'} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M1 1 L6 3.5 L1 6" fill="none" stroke="hsl(var(--muted-foreground)/.4)" strokeWidth="1.2"/></marker></defs>{drawing.map((edge,i)=><path key={i} d={edge.d} fill="none" stroke={edge.on?'hsl(var(--primary))':'hsl(var(--muted-foreground)/.35)'} strokeWidth={edge.on?2:1.2} markerEnd={'url(#'+arrowId+(edge.on?'-active':'-muted')+')'}/>)}</svg>{visible.map((node,i)=><div key={node.id} data-graph-node={node.id} data-selected={path.includes(node.id)} className="prepared-graph-node">{node.turn&&<span className="prepared-graph-turn">ح</span>}{renderNode(node,i+1)}</div>)}</div><p className="text-xs text-muted-foreground" aria-live="polite">المسار المحدد: {arabicDigits(path.length)} رواة حتى نقطة الالتقاء نفسها، بحسب النص المحفوظ.</p></section>;
}
