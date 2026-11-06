'use client';
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

export default function Review(){
 return <main className="zite-app min-w-0 space-y-4" dir="rtl">
  <script type="application/json" id="fixture-library" dangerouslySetInnerHTML={{__html:JSON.stringify(library)}}/>
  <div data-testid="reading"><PersonalSanadInput value={source} personIds={personIds} complete onApply={()=>{}}/></div>
  <div data-testid="book"><ConnectedChainEditor lib={library} start={author} startId={people[0].id} end={rawi} roles branches={branches} onChange={()=>{}} onCreate={async()=>{throw Error('fixture');}}/></div>
  <div data-testid="saved"><SavedRouteGraph library={library} route={route}/></div>
  <div data-testid="draft"><PersonalSanadInput value={'كما أخذته عن '+[author,first,meeting,rawi].join('، عن ')} personIds={[0,1,4,5].map(i=>people[i].id)} complete onApply={()=>{}}/></div>
  <div data-testid="repeated"><SanadPathView paths={[[author,first],[author,second,author]]} renderPerson={name=><span>{name}</span>}/></div>
  <div data-testid="personal"><PersonalSanadInput value={source} personIds={personIds} complete readOnly onApply={()=>{}}/></div>
 </main>;
}
