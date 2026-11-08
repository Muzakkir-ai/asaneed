'use client';
import CombinedSanadView from '../../legacy/components/CombinedSanadView';
import {optimizeSanadPorts} from '../../legacy/lib/sanadConnectorRouting';
import BranchPersonCard from '../../legacy/components/BranchPersonCard';
import SanadPathView from '../../legacy/components/SanadPathView';
import ConnectedChainEditor from '../../legacy/components/ConnectedChainEditor';
import SavedRouteGraph from '../../legacy/components/SavedRouteGraph';
import PersonalSanadInput from '../../legacy/components/PersonalSanadInput';
import {displayRawi} from '../../legacy/lib/qurra';
import type {BuilderChain,BuilderLibrary} from '../../legacy/lib/bookBuilder';
import '../../app/studio/studio.css';

const names=['الشيخ الأول','الشيخ الثاني','الشيخ الثالث','الشيخ الرابع','الشيخ الخامس'];
const [author,first,second,third,meeting]=names;
const rawi=displayRawi('ibnkathir','البزي');
const people=[...names,rawi].map((name,i)=>({id:'n'+i,name,display_name:'',archived:false}));
const row=(...indices:number[])=>indices.map(i=>({person_id:people[i].id,route_source:i===1}));
const parent:BuilderChain={id:'parent',book_id:'book',book_chain_id:null,kind:'book',title:'سند الكتاب',route_code:'',qari_id:'',rawi:'',continuation:'',confirmed:true,archived:false,revision:1,branches:[[]]};
const route:BuilderChain={...parent,id:'route',book_chain_id:parent.id,kind:'route',qari_id:'ibnkathir',rawi:'البزي',branches:[row(1,4),row(2,3,4)]};
const library:BuilderLibrary={people,books:[{id:'book',title:'كتاب',author_id:people[0].id,archived:false}],chains:[parent,route],suggestions:[],continuations:{}};
const branches=route.branches.map(branch=>branch.map(node=>({personId:node.person_id,name:people.find(p=>p.id===node.person_id)!.name,source:node.route_source})));
const source=`كما أخذته عن ${author}، عن ${first}، عن ${meeting} (ح). وقرأ ${author} أيضًا على ${second}، عن ${third}، عن ${meeting}، عن ${rawi}`;
const personIds=[0,1,4,2,3,4,5].map(i=>people[i].id);

// Mandatory, sanitized regressions for the previously reported al-Jazari branches,
// al-Umyuti vertical continuation, and Ibn Ghanim's long bypass.
const regressionPaths=[
 ['jazari','uqabi','ibnGhanim','ibnShuhadha','end'],
 ['jazari','nuwayri','umyuti','samdasi','ibnShuhadha','end'],
 ['jazari','umyuti','samdasi','ibnShuhadha','end'],
];
// Connected-graph fixtures exercise the same production component with real
// edge memberships but deliberately synthetic people and no backend writes.
const jointTeachers=['teacher1','teacher2','teacher3','teacher4','teacher5'];
const jointCompanions=['sahabi1','sahabi2','sahabi3'];
const densePaths=jointTeachers.flatMap(teacher=>
 jointCompanions.map(companion=>['imam',teacher,companion,'ubayy']));
const fanOutPaths=['a','b','c','d'].map(to=>['root',to]);
const fanInPaths=['a','b','c','d'].map(from=>[from,'meeting']);
// Positive: neighbouring teachers on the same level have one directly
// shared teacher. Only this shape permits a common final incoming arrow.
const eligibleFanInPaths=[
 ['root','a','target'],['root','b','target'],
];
// Negative: neighbouring teachers have *different* teachers themselves.
const differentParentFanInPaths=[
 ['rootA','a','target'],['rootB','b','target'],
];
// Negative: a third narrator separates two teachers on the same row.
const separatedFanInPaths=[
 ['root','a','target'],['root','middle','other'],['root','b','target'],
];
// Incomplete 2x2 plus one extra transmission: no visual partial-biclique
// may create an extra arrow into x or y, or imply b transmits to z.
const incompletePaths=[
 ['root','a','x'],['root','a','y'],['root','a','z'],
 ['root','b','x'],['root','b','y'],
];
// Mixed-length branches: the edge from meeting to end skips a graph rank.
// Its bypass must not disable the unrelated root fan-out or meeting fan-in.
const longBypassPaths=[
 ['root','a','meeting','end'],
 ['root','b','meeting','end'],
 ['root','c','through1','through2','end'],
];
// Reproduces the reported al-Sa'igh layout: a narrator has two actual
// teachers, one directly above and one skipping the intermediate rank.
// The same final arrow must be shared by both genuine paths.
const mixedRankFanInPaths=[
 ['jazari','left','saigh','end'],
 ['jazari','saigh','end'],
 ['jazari','right','other','end'],
];
// Three separate row heights feeding a common target, with arbitrary
// source-side splits elsewhere. All incoming transmissions still need
// exactly one arrow at the target.
const staggeredFanInPaths=[
 ['root','a','b','target'],
 ['root','a','target'],
 ['root','target'],
];
const syntheticName=(id:string)=>({
 imam:'الإمام القارئ',ubayy:'أُبيّ بن كعب',root:'الشيخ',meeting:'الملتقى',
 teacher1:'الشيخ الأول',teacher2:'الشيخ الثاني',teacher3:'الشيخ الثالث',
 teacher4:'الشيخ الرابع',teacher5:'الشيخ الخامس',
 sahabi1:'الصحابي الأول',sahabi2:'الصحابي الثاني',sahabi3:'الصحابي الثالث',
}[id]||id);
const drawSynthetic=(id:string,positions:number[])=>
 <BranchPersonCard name={syntheticName(id)} number={positions[0]??null}/>;
const regressionNames:Record<string,string>={
 jazari:'الإمام ابن الجزري',uqabi:'أبو النعيم رضوان العُقبي',nuwayri:'النويري',
 umyuti:'العُميوطي',samdasi:'السمديسي',ibnGhanim:'ابن غانم',
 ibnShuhadha:'عبد الرحمن بن شحاذة',end:'ملتقى الأسانيد',
};
const graphCard=(id:string,positions:number[])=><BranchPersonCard name={regressionNames[id]??id} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>;

// Minimal, deterministic route cases: the card positions are intentionally only
// slightly offset, exactly where the old algorithm inserted unnecessary jogs.
const routeExample=(rows:string[][],positions:Record<string,number>)=>{
 const coordinates=new Map(Object.entries(positions).map(([id,x])=>[id,{x}]));
 return optimizeSanadPorts(rows,coordinates,[{from:'above',to:'below',x1:112,x2:138}],
  650,192,80,new Map(rows.flat().map(id=>[id,80]))).connectors[0].d;
};
const adjacentRoute=routeExample([['above'],['below']],{above:120,below:130});
const longClearRoute=routeExample([['above'],['other'],['below']],{above:120,other:390,below:130});
const longBlockedRoute=routeExample([['above'],['other'],['below']],{above:120,other:125,below:130});

// Two neighbouring narrator cards with a clear horizontal gap should leave
// from the facing side edge, not go down first and then turn sideways.
const sideExitExample=(sourceX:number,destinationX:number)=>{
 const coordinates=new Map([['above',{x:sourceX}],['below',{x:destinationX}]]);
 return optimizeSanadPorts([['above'],['below']],coordinates,
  [{from:'above',to:'below',x1:sourceX,x2:destinationX}],
  760,192,80,new Map([['above',80],['below',80]])).connectors[0].d;
};
const rightSideExitRoute=sideExitExample(120,440);
const leftSideExitRoute=sideExitExample(440,120);


export default function Review(){
 return <main className="zite-app min-w-0 space-y-4" dir="rtl">
  <script type="application/json" id="fixture-library" dangerouslySetInnerHTML={{__html:JSON.stringify(library)}}/>
  <div data-testid="reading"><PersonalSanadInput value={source} personIds={personIds} complete onApply={()=>{}}/></div>
  <div data-testid="book"><ConnectedChainEditor lib={library} start={author} startId={people[0].id} end={rawi} roles branches={branches} onChange={()=>{}} onCreate={async()=>{throw Error('fixture');}}/></div>
  <div data-testid="saved"><SavedRouteGraph library={library} route={route}/></div>
  <div data-testid="draft"><PersonalSanadInput value={'كما أخذته عن '+[author,first,meeting,rawi].join('، عن ')} personIds={[0,1,4,5].map(i=>people[i].id)} complete onApply={()=>{}}/></div>
  <div data-testid="repeated"><SanadPathView paths={[[author,first],[author,second,author]]} renderPerson={name=><span>{name}</span>}/></div>
  <div data-testid="personal"><PersonalSanadInput value={source} personIds={personIds} complete readOnly onApply={()=>{}}/></div>
  <div data-testid="straight-port-regression" data-adjacent={adjacentRoute} data-long-clear={longClearRoute} data-long-blocked={longBlockedRoute}/>
  <div data-testid="side-edge-regression" data-right={rightSideExitRoute} data-left={leftSideExitRoute}/>
  <div data-testid="combined-regression"><CombinedSanadView paths={regressionPaths} routeLabels={['العقبي','النويري','العُميوطي']} renderPerson={graphCard}/></div>
  <div data-testid="combined-no-labels"><CombinedSanadView paths={regressionPaths} renderPerson={graphCard}/></div>
  <div data-testid="combined-invalid"><CombinedSanadView paths={[[ 'jazari','uqabi' ],[ 'uqabi','jazari' ]]} renderPerson={graphCard}/></div>
  <div data-testid="coordinated-fan-out"><CombinedSanadView paths={fanOutPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-fan-in"><CombinedSanadView paths={fanInPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-eligible-fanin"><CombinedSanadView paths={eligibleFanInPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-different-parents"><CombinedSanadView paths={differentParentFanInPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-separated-parents"><CombinedSanadView paths={separatedFanInPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-dense"><CombinedSanadView paths={densePaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-incomplete"><CombinedSanadView paths={incompletePaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-long-bypass"><CombinedSanadView paths={longBypassPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-mixed-rank"><CombinedSanadView paths={mixedRankFanInPaths} spacious renderPerson={drawSynthetic}/></div>
  <div data-testid="coordinated-staggered-fanin"><CombinedSanadView paths={staggeredFanInPaths} spacious renderPerson={drawSynthetic}/></div>
 </main>;
}
