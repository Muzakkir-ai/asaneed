import type {PreparedSanadPeople} from '../lib/preparedSanadPeople';
import MeetingPointSelector,{type MeetingPointOption} from './MeetingPointSelector';
import {sanadKey} from '../lib/unifiedSanad';
import {Checkbox} from '@project/components/ui/checkbox';
import PersonalSanadPeople from './PersonalSanadPeople';
import type {BuilderLibrary,BuilderPerson} from '../lib/bookBuilder';
import {useState} from 'react';
import {Textarea} from '@project/components/ui/textarea';
import {Button} from '@project/components/ui/button';
import {sanadSections} from '../lib/api';
import {reachesJunction} from '../lib/personalSanadValidation';
import {DIRECT_JAZARI_ID,PERSONAL_BRIDGE_TITLE,prefixBridgeAnchor,validatePersonalBridge,type BuilderPrefixContinuation} from '../lib/builderPrefix';
import NarratorAutocomplete from './NarratorAutocomplete';
export default function BuilderPrefixInput({value,onChange,continuations=[],selectedId,onSelect,names=[],onCreated,library,onPersonCreated,onPeopleChange,initialPersonIds,onAssemble,onPendingChange,showJunction=true,preparation,readOnly=false}:{value:string;preparation?:PreparedSanadPeople|null;readOnly?:boolean;onChange:(v:string)=>void;continuations?:BuilderPrefixContinuation[];selectedId:string;onSelect:(id:string)=>void;names?:string[];initialPersonIds?:string[];onAssemble?:(text:string,ids:string[])=>void;onPendingChange?:(pending:boolean)=>void;showJunction?:boolean;library?:BuilderLibrary;onPersonCreated?:(person:BuilderPerson)=>void;onPeopleChange?:(ids:string[])=>void;onCreated?:(source:BuilderPrefixContinuation)=>void}){
 const [pendingPerson,setPendingPerson]=useState(''),[adding,setAdding]=useState(false),[anchor,setAnchor]=useState(''),[body,setBody]=useState(''),[reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const selected=continuations.find(c=>c.id===selectedId),ubaydi=reachesJunction({personalChain:value,junction:'ubaydi'})&&!reachesJunction({personalChain:value,junction:'jazari'});
 const save=async()=>{setError('');setBusy(true);try{if(!reviewed)throw Error('راجع التتمة وأكدها أولاً');validatePersonalBridge(anchor,body);const title=PERSONAL_BRIDGE_TITLE+anchor.trim();const result=await sanadSections({action:'save',title,body:body.trim(),sectionType:'personal'});const source=result.sections.filter(s=>s.title===title&&s.body===body.trim()).at(-1);if(!source)throw Error('تعذر إعادة تحميل التتمة');onCreated?.({id:source.id,title,body:source.body,anchorName:anchor.trim()});onSelect(source.id);setPendingPerson('');setAdding(false);setAnchor('');setBody('');setReviewed(false);}catch(e){setError(e instanceof Error?e.message:'تعذر الحفظ');}finally{setBusy(false);}};
 const options:MeetingPointOption[]=[{value:DIRECT_JAZARI_ID,name:'الإمام ابن الجزري',description:'يصل سندي إليه مباشرة'},...continuations.map(c=>({value:c.id,name:prefixBridgeAnchor(c),description:'تتمة محفوظة — '+(c.title.startsWith(PERSONAL_BRIDGE_TITLE)?c.body.slice(0,70):c.title)}))];
 const knownNames=new Set(options.map(o=>sanadKey(o.name)));
 const savedPeople=library?.quranMeetingPeople||[];
 for(const person of savedPeople){if(!knownNames.has(sanadKey(person.name))){options.push({value:'person:'+person.id,name:person.name,description:'من أسانيد القرآن المحفوظة — اختيار ومراجعة التتمة'});knownNames.add(sanadKey(person.name));}}
 const chooseJunction=(id:string)=>{
  setError('');
  const person=id.startsWith('person:')?savedPeople.find(p=>'person:'+p.id===id):undefined;
  if(person){setPendingPerson(id);setAnchor(person.name);setBody('');setReviewed(false);setAdding(true);onSelect('');onPendingChange?.(true);}
  else{setPendingPerson('');setAdding(false);onSelect(id);}
 };
 const junctionControl=(move?:(name:string,path:string[],changing:boolean)=>boolean)=>showJunction&&!readOnly?<MeetingPointSelector options={options} value={pendingPerson||selectedId} onChange={id=>{
  const option=options.find(o=>o.value===id);
  const linear=selected&&!/[؛().\n]|وقرأ|وأخذ|وهو|وهما|وهم/u.test(selected.body.trim().replace(/[.،؛]+$/u,''))?selected.body:'';
  const steps=linear.trim().replace(/[.،؛]+$/u,'').split(/،\s*عن\s+/u).map(step=>step.replace(/^عن\s+/u,''))||[];
  const end=option?steps.findIndex(step=>sanadKey(step)===sanadKey(option.name)):-1;
  if(option&&move&&!move(option.name,end>=0?steps.slice(0,end+1):[],!!selectedId))return;
  chooseJunction(id);
 }}/>:null;
 const selectedPerson=savedPeople.find(p=>'person:'+p.id===pendingPerson);

 return <div className="space-y-3">

 {library&&onPersonCreated&&<section aria-label="إضافة السند بالأسماء المحفوظة" className="space-y-3">{!readOnly&&<h4 className="font-semibold">بناء السند الشخصي — إضافة الرواة</h4>}{readOnly&&!preparation&&!initialPersonIds?.length?<p className="whitespace-pre-wrap text-sm leading-loose">{value}</p>:<PersonalSanadPeople readOnly={readOnly} preparation={preparation} library={library} initialPersonIds={initialPersonIds} onPendingChange={onPendingChange} onPersonCreated={onPersonCreated} beforeApply={junctionControl} onApply={(text,ids)=>{if(showJunction&&!selectedId){setError(pendingPerson?'احفظ تتمة هذا الشيخ إلى ابن الجزري قبل اعتماد ترتيب الرواة':'اختر نقطة الالتقاء أسفل الرواة أولًا');return;}setError('');if(onAssemble)onAssemble(text,ids);else{onChange(text);onPeopleChange?.(ids);onPendingChange?.(false);}}}/>}</section>}
 {!library&&junctionControl()}
 {!readOnly&&showJunction&&<p className="text-xs text-muted-foreground">أضف الرواة حتى شيخ نقطة الالتقاء، ثم اختره أسفل آخر راوٍ. اختر من التتمات الجاهزة أو من رجال أسانيد القرآن المحفوظة.</p>}
 {!readOnly&&value&&<details className="rounded-md border p-3"><summary className="cursor-pointer text-sm">السند المحفوظ / المعاينة النصية</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-loose">{value}</p></details>}
 {!readOnly&&!library&&<details className="rounded-md border p-3"><summary className="cursor-pointer text-sm">إدخال نصي قديم / متقدم</summary><label className="block text-sm space-y-1">{selected?'سندي الشخصي إلى '+prefixBridgeAnchor(selected):'السند الشخصي إلى إبراهيم العبيدي أو الإمام ابن الجزري'}<Textarea rows={4} value={value} onChange={e=>{onChange(e.target.value);onPeopleChange?.([]);}} placeholder={selected?'عن الشيخ… حتى '+prefixBridgeAnchor(selected):'عن الشيخ… حتى إبراهيم العبيدي أو الإمام ابن الجزري'}/></label></details>}
 {!readOnly&&showJunction&&(selected||ubaydi)&&<p className="text-xs text-muted-foreground">تُضاف التتمة المحفوظة من نقطة الالتقاء إلى ابن الجزري، ثم إسناد الكتاب والطريق. راجع السند الكامل قبل الحفظ.</p>}
 {!readOnly&&showJunction&&selected&&<details className="rounded-md border p-3"><summary className="cursor-pointer text-sm">التتمة التي ستُضاف</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-loose">{selected.body}</p></details>}
 {!readOnly&&showJunction&&onCreated&&<Button type="button" variant="outline" size="sm" onClick={()=>setAdding(v=>!v)}>إضافة نقطة التقاء أخرى</Button>}
 {!readOnly&&adding&&<fieldset disabled={busy} className="rounded-lg border bg-muted/20 p-3 space-y-3"><legend className="px-1 text-sm font-semibold">تتمة شخصية محفوظة</legend><p className="text-xs text-muted-foreground">اختر أي شيخ، قبل إبراهيم العبيدي أو بعده. اكتب التتمة بعده إلى ابن الجزري مع فروعها كما رويتها؛ لا يستنتج التطبيق اتصالاً جديداً. تُحفظ لحسابك لإعادة استخدامها.</p><label className="block text-sm space-y-1">شيخ نقطة الالتقاء<NarratorAutocomplete value={anchor} names={names} label="شيخ نقطة الالتقاء" onChange={v=>{setAnchor(v);setReviewed(false);}}/></label>{selectedPerson&&<details className="rounded border p-3"><summary className="cursor-pointer text-sm">الأسانيد المحفوظة التي ورد فيها هذا الشيخ</summary><p className="mt-2 text-xs text-muted-foreground">{selectedPerson.sources.join(' · ')}</p>{(library?.continuationSections||[]).filter(s=>selectedPerson.sources.includes(s.title)).map(s=><div key={s.id} className="mt-3 space-y-2"><strong className="text-sm">{s.title}</strong><p className="whitespace-pre-wrap text-sm leading-loose">{s.body}</p></div>)}</details>}<label className="block text-sm space-y-1">من شيخه التالي إلى ابن الجزري<Textarea rows={6} value={body} onChange={e=>{setBody(e.target.value);setReviewed(false);}} placeholder="عن… حتى الإمام ابن الجزري (لا تكرر شيخ نقطة الالتقاء)"/></label><label className="flex gap-2 text-sm"><Checkbox checked={reviewed} onCheckedChange={v=>setReviewed(v===true)}/>راجعت نقطة الالتقاء والتتمة وجميع الفروع.</label><div className="flex gap-3"><Button type="button" size="sm" disabled={!reviewed||!anchor.trim()||!body.trim()} onClick={save}>حفظ نقطة الالتقاء</Button><Button type="button" size="sm" variant="outline" onClick={()=>{setAdding(false);setPendingPerson('');}}>إلغاء</Button></div></fieldset>}
 {!readOnly&&error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
