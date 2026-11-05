import type {PreparedSanadPeople} from '../lib/preparedSanadPeople';
import AccountSetupPanel from './AccountSetupPanel';
import PersonalSanadInput from './PersonalSanadInput';
import ShaykhMatnCards from './ShaykhMatnCards';
import MatnDocumentEditor from './MatnDocumentEditor';
import {MatnHeadingControls} from './MatnHeadingControls';
import {DEFAULT_MATN_HEADING,type MatnHeadingSettings} from '../lib/matnPresentation';
import EditorPage from './EditorPage';
import {writeMatnPresentation,readMatnPresentation} from '../lib/matnPresentation';
import ShaykhReadingsList from './ShaykhReadingsList';
import {compactRouteBook,builderCompactRouteName,type BuilderChain,type BuilderPerson,type BuilderBook} from '../lib/bookBuilder';
import {workspaceHeaders} from '../lib/workspaceSelection';
import IssuerProfilePreview from './IssuerProfilePreview';
import SavedRoutePicker from './SavedRoutePicker';
import BookTariqBuilder from './BookTariqBuilder';
import {ijazahCoverage,compactReadingCount} from '../lib/ijazahCoverage';
import {useEffect,useState} from 'react';
import {additionalShaykhs,additionalReadingSanads,mutoonTemplates,contentManagement,type AdditionalShaykhsOutputType} from '../lib/api';
import MatnFormatting,{MatnPreview,parseMatnFormat} from './MatnFormatting';
import {QURRA,displayRawi,shortReadingLabel,shortQariName} from '../lib/qurra';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {Textarea} from '@project/components/ui/textarea';
import {Card,CardContent} from '@project/components/ui/card';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@project/components/ui/dialog';
import {BookOpen,GraduationCap,Plus,PenLine,UserRound,Mail,ArrowRight} from 'lucide-react';
import {toast} from 'sonner';
type Sheikh=AdditionalShaykhsOutputType['sheikhs'][number];
type Reading={qariId:string;rawi:string;tariqNumber?:string;tariqName?:string};
type Matn={id?:string;catalogId?:string;name:string;category:string;sanadText:string;wordingText:string;introductionId:string;conclusionId:string;sanadFormatting:string};
type Template={id:string;name:string;kind:string;body:string;formatting:string};
const emptyMatn=():Matn=>({name:'',category:'',sanadText:'',wordingText:'',introductionId:'',conclusionId:'',sanadFormatting:'[]'});
const blank={email:'',mutoon:[] as Matn[],name:'',qualification:'',teachingRole:'',madrasaName:'',madrasaPlace:'',personalChain:'',junction:'ubaydi' as 'ubaydi'|'jazari',readings:[] as Reading[]};
export default function AdditionalShaykhsPage({onSaved,issuers=[]}:{onSaved:(issuerId?:string)=>void;issuers?:{id:string;number?:string}[]}){
 const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState('');
 const [items,setItems]=useState<Sheikh[]>([]);
 const [selected,setSelected]=useState('');
 const [viewing,setViewing]=useState<Sheikh|null>(null);
 const [form,setForm]=useState(blank);
 const [saving,setSaving]=useState(false);
 const [editingOpen,setEditingOpen]=useState(false);
 const [readingOpen,setReadingOpen]=useState(false);
 const [readingScope,setReadingScope]=useState<''|'sughra'|'kubra'>('');
 const [routePeople,setRoutePeople]=useState<BuilderPerson[]>([]),[routeBooks,setRouteBooks]=useState<BuilderBook[]>([]);
 const [routeChoices,setRouteChoices]=useState<BuilderChain[]>([]);
 const [routeChoiceError,setRouteChoiceError]=useState('');
 useEffect(()=>{let active=true;setRouteChoiceError('');fetch('/api/book-builder',{headers:workspaceHeaders()}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'تعذر تحميل الطرق');if(active){setRouteChoices(d.chains.filter((c:BuilderChain)=>c.kind==='route'&&!c.archived));setRoutePeople(d.people);setRouteBooks(d.books);}}).catch(e=>{if(active)setRouteChoiceError(e.message);});return()=>{active=false;};},[readingOpen]);
 const shortRoute=(number:string,name:string)=>{const route=routeChoices.find(c=>c.route_code===number),book=routeBooks.find(b=>b.id===route?.book_id);return route&&book?builderCompactRouteName(book,route,routePeople):compactRouteBook(name);};
 const [savedReadingSanads,setSavedReadingSanads]=useState<import('../lib/api').AdditionalReadingSanadsOutputType['sanads']>([]);
 const [readingEditor,setReadingEditor]=useState<Reading|null>(null);
 const [readingBookAuthor,setReadingBookAuthor]=useState(''),[readingRouteSource,setReadingRouteSource]=useState('');
 const [readingRoute,setReadingRoute]=useState(''),[readingRouteName,setReadingRouteName]=useState('');
 const [readingPreparation,setReadingPreparation]=useState<PreparedSanadPeople|null>(null);
 const [readingText,setReadingText]=useState(''),[readingPeople,setReadingPeople]=useState<string[]>([]),[readingPending,setReadingPending]=useState(false),[readingPrefixRevision,setReadingPrefixRevision]=useState(0);
 const [readingRef,setReadingRef]=useState<import('./SavedRoutePicker').SavedRouteSelection['unifiedSanad']|null>(null);
 const [readingJunction,setReadingJunction]=useState<'ubaydi'|'jazari'>('ubaydi');
 const [readingSaving,setReadingSaving]=useState(false);
 const loadReadingSanads=async(id:string)=>{try{setSavedReadingSanads((await additionalReadingSanads({action:'list',shaykhId:id})).sanads)}catch{toast.error('تعذر تحميل أسانيد الروايات')}};
 const openReading=async(r:Reading,owner?:Sheikh)=>{
  if(owner){select(owner,false);setSection('qiraat');}
  let rows=savedReadingSanads;
  if(owner){try{rows=(await additionalReadingSanads({action:'list',shaykhId:owner.id})).sanads;setSavedReadingSanads(rows);}catch{toast.error('تعذر تحميل سند الرواية');return;}}
  const profile=owner||form,specific=rows.find(x=>x.qariId===r.qariId&&x.rawi===r.rawi&&(x.tariqNumber||'')===(r.tariqNumber||''));
  setReadingPreparation(specific?.preparedPeople||null);setReadingPeople(specific?.personalPersonIds||[]);setReadingPending(false);setReadingPrefixRevision(0);setReadingRef(specific?.unifiedSanad||null);setReadingRoute(specific?.tariqNumber||r.tariqNumber||'');setReadingRouteName(specific?.tariqName||r.tariqName||'');setReadingBookAuthor(specific?.bookAuthor||'');setReadingRouteSource(specific?.routeSource||'');setReadingText(specific?.sanadText||profile.personalChain);setReadingJunction(specific?.junction||profile.junction);setReadingEditor(r);
 };
 const saveReading=async()=>{if(!selected||!readingEditor||readingPending)return;setReadingSaving(true);try{await additionalReadingSanads({action:'save',personalPersonIds:readingPeople,unifiedSanad:readingRef,bookAuthor:readingBookAuthor,routeSource:readingRouteSource,tariqNumber:readingRoute,tariqName:readingRouteName,shaykhId:selected,qariId:readingEditor.qariId,rawi:readingEditor.rawi,sanadText:readingText,junction:readingJunction});await loadReadingSanads(selected);await load();setReadingEditor(null);toast.success('تم حفظ سند الرواية بشكل مستقل')}catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ السند')}finally{setReadingSaving(false)}};

 const [section,setSection]=useState<'profile'|'qiraat'|'mutoon'>('profile');
 const [matnSaveVersion,setMatnSaveVersion]=useState(0);
 const [matnOpen,setMatnOpen]=useState(false);
 const [matnDraft,setMatnDraft]=useState<Matn>(emptyMatn);
 const [catalog,setCatalog]=useState<{id:string;title:string;category:string;heading?:MatnHeadingSettings|null;artwork_number?:string}[]>([]);
 const [templates,setTemplates]=useState<Template[]>([]);
 const [matnPreview,setMatnPreview]=useState(false);
 const [matnIndex,setMatnIndex]=useState<number|null>(null);
 const load=async()=>{setLoading(true);setLoadError('');try{const r=await additionalShaykhs({action:'list'});setItems(r.sheikhs);setViewing(current=>current?r.sheikhs.find(item=>item.id===current.id)||current:null);}catch(e){setLoadError(e instanceof Error?e.message:'تعذر تحميل المشايخ الإضافيين');}finally{setLoading(false);}};
 useEffect(()=>{void load();contentManagement({action:'list'}).then(r=>setCatalog(r.catalog.filter(item=>item.status==='published'))).catch(()=>toast.error('تعذر تحميل فهرس المتون'));mutoonTemplates({action:'list'}).then(r=>setTemplates(r.templates)).catch(()=>{});},[]);
 const setField=(key:keyof typeof blank,value:any)=>setForm(x=>({...x,[key]:value}));
 const select=(s?:Sheikh,loadSanads=true)=>{setSelected(s?.id||'');setForm(s?{
  email:s.email,mutoon:s.mutoon,name:s.name,qualification:s.qualification,teachingRole:s.teachingRole,
  madrasaName:s.madrasaName,madrasaPlace:s.madrasaPlace,personalChain:s.personalChain,
  junction:s.junction,readings:s.readings}:blank);setSection('profile');setMatnOpen(false);setEditingOpen(true);setSavedReadingSanads([]);if(s&&loadSanads)void loadReadingSanads(s.id);};
 const toggle=(qariId:string,rawi:string)=>setForm(x=>{
  const exists=x.readings.some(r=>r.qariId===qariId&&r.rawi===rawi);
  return {...x,readings:exists?x.readings.filter(r=>r.qariId!==qariId||r.rawi!==rawi):[...x.readings,{qariId,rawi}]};
 });
 const save=async()=>{
  if(matnOpen){await saveMatn();return;}
  setSaving(true);try{const result=await additionalShaykhs({action:'save',id:selected||undefined,...form});toast.success('حُفظ الشيخ وأسانيده وإجازاته');setItems(result.sheikhs);setViewing(current=>current?result.sheikhs.find(item=>item.id===current.id)||current:null);const savedId=selected||result.sheikhs.find(s=>s.name===form.name.trim())?.id;onSaved(savedId);setEditingOpen(false);}
  catch(e){toast.error(e instanceof Error?e.message:'تعذر الحفظ');}finally{setSaving(false);}
 };
 const saveMatn=async()=>{
  if(!matnDraft.name.trim()||!matnDraft.category.trim()||!matnDraft.sanadText.trim()){toast.error('أدخل اسم المتن وتصنيفه وسنده');return false;}
  setSaving(true);try{const mutoon=matnIndex===null?[...form.mutoon,matnDraft]:form.mutoon.map((m,i)=>i===matnIndex?matnDraft:m);const result=await additionalShaykhs({action:'save',...form,id:selected||undefined,mutoon});const item=result.sheikhs.find(s=>s.id===selected)||result.sheikhs.find(s=>s.name===form.name.trim());if(!item)throw Error('تعذر التحقق من حفظ المتن');const persisted=item.mutoon[matnIndex??mutoon.length-1];if(!persisted||persisted.sanadText!==matnDraft.sanadText||persisted.wordingText!==matnDraft.wordingText||persisted.sanadFormatting!==matnDraft.sanadFormatting)throw Error('تعذر التحقق من حفظ النص والتنسيق');setItems(result.sheikhs);setViewing(current=>current?result.sheikhs.find(item=>item.id===current.id)||current:null);setSelected(item.id);setForm(v=>({...v,mutoon:item.mutoon}));setMatnIndex(matnIndex??mutoon.length-1);setMatnDraft(persisted);onSaved(item.id);setMatnSaveVersion(v=>v+1);toast.success('تم حفظ المتن والنص والتنسيق');return true;}catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ المتن');return false;}finally{setSaving(false);}
 };
 const editor=(label:string,key:'name'|'qualification'|'teachingRole'|'madrasaName'|'madrasaPlace')=>
  <label className="space-y-1 block text-sm"><span>{label}</span><Input dir="rtl" value={form[key]} onChange={e=>setField(key,e.target.value)}/></label>;
 return <div className="editor-workspace space-y-5" dir="rtl">
  {!viewing&&<>
  <div><h2 className="text-xl font-bold">المشايخ الإضافيون</h2><p className="text-sm text-muted-foreground">حفظ مشايخ آخرين وأسانيدهم وإجازاتهم لكلا المديرين. لإنشاء شهادة باسم الشيخ اختره من زر إضافة طالب في الصفحة الرئيسية.</p></div>
  <div className="flex justify-end"><Button onClick={()=>select()}><Plus className="h-4 w-4 me-2"/>إضافة شيخ جديد</Button></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(s=><Card key={s.id} className="workspace-icon-card overflow-hidden transition-shadow hover:shadow-md cursor-pointer" role="button" tabIndex={0} aria-label={'فتح ملف الشيخ '+s.name} onClick={()=>setViewing(s)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setViewing(s);}}}><CardContent className="p-5 space-y-4"><div className="flex items-start gap-3"><div className="workspace-card-icon"><UserRound className="h-6 w-6"/></div><div className="min-w-0 flex-1"><h3 className="font-bold text-lg leading-relaxed">{s.name}</h3><p className="text-xs text-muted-foreground truncate">{s.qualification||s.teachingRole||'ملف الشيخ'}</p></div></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-3 py-1 inline-flex gap-1 items-center"><BookOpen className="w-3.5 h-3.5"/>{compactReadingCount(s.readings)}</span><span className="rounded-full bg-muted px-3 py-1 inline-flex gap-1 items-center"><GraduationCap className="w-3.5 h-3.5"/>{s.mutoon.length} متن</span></div>{s.email&&<p dir="ltr" className="flex items-center gap-2 text-xs text-muted-foreground truncate"><Mail className="h-3.5 w-3.5 shrink-0"/>{s.email}</p>}</CardContent></Card>)}</div>
  {loading&&<p role="status" className="rounded-xl border p-6">جارٍ تحميل المشايخ الإضافيين…</p>}
  {loadError&&<div role="alert" className="rounded-xl border p-6 space-y-3"><p>{loadError}</p><Button variant="outline" onClick={load}>إعادة المحاولة</Button></div>}
  {!loading&&!loadError&&items.length===0&&<div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">لا يوجد مشايخ إضافيون بعد. اختر إضافة شيخ جديد للبدء.</div>}
  </>}
  {viewing&&<section className="space-y-5" aria-label={'ملف الشيخ '+viewing.name}>
   <Button variant="ghost" className="gap-2" onClick={()=>setViewing(null)}><ArrowRight className="h-4 w-4"/>العودة إلى المشايخ الإضافيين</Button>
   <header className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{viewing.name}</h2><p className="text-sm text-muted-foreground">ملف الشيخ وأسانيده وإجازاته</p></div>
    <div className="flex flex-wrap gap-2">
     <Button variant="outline" className="gap-2" onClick={()=>select(viewing)}><PenLine className="h-4 w-4"/>تعديل بيانات الشيخ</Button>
     <Button className="gap-2" onClick={()=>{select(viewing);setSection('qiraat');}}><Plus className="h-4 w-4"/>إضافة إجازة قراءات</Button>
     <Button className="gap-2" onClick={()=>{select(viewing);setSection('mutoon');setMatnIndex(null);setMatnDraft(emptyMatn());setMatnOpen(true);}}><Plus className="h-4 w-4"/>إضافة متن</Button>
    </div>
   </header>
   <div className="space-y-5">
   <div className="rounded-lg border p-4 space-y-2"><h3 className="font-bold">بيانات الشيخ</h3>{viewing.qualification&&<p>{viewing.qualification}</p>}{(viewing.teachingRole||viewing.madrasaName)&&<p>{[viewing.teachingRole,viewing.madrasaName].filter(Boolean).join(' ')}</p>}{viewing.madrasaPlace&&<p className="text-sm text-muted-foreground">{viewing.madrasaPlace}</p>}{viewing.email&&<p dir="ltr" className="text-sm">{viewing.email}</p>}</div>
   <section className="space-y-2"><h3 className="font-bold">ظهور المجيز في الشهادة</h3><IssuerProfilePreview displayName={viewing.name} issuerNumber={issuers.find(i=>i.id===viewing.id)?.number} profile={{footerLineStyles:'',printedName:viewing.name,scientificQualification:viewing.qualification,showScientificQualification:true,teachingRole:viewing.teachingRole,madrasaName:viewing.madrasaName,madrasaPlace:viewing.madrasaPlace,showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true,centerStampText:''}}/></section>
   <section className="space-y-3"><h3 className="font-bold">إجازات القراءات — {compactReadingCount(viewing.readings)}</h3>{viewing.readings.length===0&&<p className="text-sm text-muted-foreground">لم تُضف إجازات قراءات بعد.</p>}<ShaykhReadingsList readings={viewing.readings} routes={viewing.routes} labelRoute={shortRoute} onEdit={r=>void openReading(r,viewing)}/></section>
   {viewing.personalChain&&<details className="rounded-lg border p-3"><summary className="cursor-pointer font-semibold">السند العام للشيخ</summary><p className="mt-3 whitespace-pre-wrap font-sanad">{viewing.personalChain}</p></details>}
   <section className="space-y-3"><h3 className="font-bold">المتون العلمية — {viewing.mutoon.length}</h3>{viewing.mutoon.length===0&&<p className="text-sm text-muted-foreground">لم تُضف متون بعد.</p>}<ShaykhMatnCards mutoon={viewing.mutoon} onOpen={index=>{select(viewing);setSection('mutoon');setMatnIndex(index);setMatnDraft({...emptyMatn(),...viewing.mutoon[index]});setMatnOpen(true);}}/></section>
  </div></section>}
  {editingOpen&&!readingEditor&&<EditorPage key={(selected||'new')+':'+section+':'+(matnOpen?'matn-'+(matnIndex??'new'):'profile')} title={matnOpen?matnDraft.name||'إضافة متن':section==='qiraat'?'إجازات القراءات':selected?form.name||'تعديل الشيخ':'إضافة شيخ جديد'} context={viewing?'المشايخ الإضافيون / '+viewing.name:'المشايخ الإضافيون'} backLabel={matnOpen?'العودة إلى متون الشيخ':viewing?'العودة إلى ملف الشيخ':'العودة إلى المشايخ'} busy={saving} saveRevision={matnSaveVersion} onBack={()=>{if(matnOpen){setMatnOpen(false);return;}setEditingOpen(false);setReadingOpen(false);}} onSave={save} saveLabel={matnOpen?'حفظ المتن':'حفظ بيانات الشيخ'} dirtyKey={JSON.stringify([form,matnOpen?matnDraft:null])}>
  {!matnOpen&&<div className="additional-profile-tabs flex flex-wrap gap-2 border-b pb-3">{([{key:'profile',label:'بيانات الشيخ'},{key:'qiraat',label:'إجازات القراءات'},{key:'mutoon',label:'المتون العلمية'}] as const).map(t=><Button key={t.key} type="button" size="sm" variant={section===t.key?'default':'outline'} onClick={()=>setSection(t.key)}>{t.label}</Button>)}</div>}
  <div className="space-y-4">
  {section==='profile'&&<>
   <IssuerProfilePreview displayName={form.name} issuerNumber={issuers.find(i=>i.id===selected)?.number} profile={{footerLineStyles:'',printedName:form.name,scientificQualification:form.qualification,showScientificQualification:true,teachingRole:form.teachingRole,madrasaName:form.madrasaName,madrasaPlace:form.madrasaPlace,showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true,centerStampText:''}}/>
   <div className="grid sm:grid-cols-2 gap-3">
    <label className="block space-y-1 text-sm">البريد الإلكتروني (ربط لاحق بمعرفة المدير)<Input dir="ltr" type="email" value={form.email} onChange={e=>setField('email',e.target.value)} placeholder="name@example.com"/><span className="block text-xs text-muted-foreground">إضافة البريد لا تنشئ حسابًا ولا تمنح صلاحيات الدخول؛ الربط يتطلب التحقق من هوية المستخدم.</span></label>
    {editor('اسم الشيخ / المُجيز','name')}
    {editor('المُجاز به / المؤهل العلمي','qualification')}
    {editor('الصفة التدريسية (مثلاً: المدرس في)','teachingRole')}
    {editor('المدرسة / المعهد','madrasaName')}
    {editor('مكان المدرسة','madrasaPlace')}
    <label className="block space-y-1 text-sm">نهاية السند<select value={form.junction} onChange={e=>setField('junction',e.target.value)} className="block w-full rounded-md border bg-background p-2"><option value="ubaydi">إبراهيم العُبيدي</option><option value="jazari">الإمام ابن الجزري</option></select></label>
   </div>
  </>}
  {section==='profile'&&selected&&<AccountSetupPanel key={selected} issuerId={selected} name={form.name} email={form.email}/>}
  {section==='qiraat'&&<div className="editor-workspace space-y-3">{selected&&<BookTariqBuilder key={selected} shaykhId={selected} shaykhName={form.name} initialPrefix={form.personalChain} onSaved={()=>{void additionalReadingSanads({action:'list',shaykhId:selected}).then(({sanads})=>{setSavedReadingSanads(sanads);setForm(v=>({...v,readings:[...v.readings,...sanads.filter(s=>!v.readings.some(r=>r.qariId===s.qariId&&r.rawi===s.rawi)).map(s=>({qariId:s.qariId,rawi:s.rawi}))]}));});onSaved(selected);void load();}}/>}<div className="flex justify-between items-center rounded-xl border p-4"><div><h3 className="font-semibold">القراءات والروايات</h3><p className="text-xs text-muted-foreground">{form.readings.length} رواية محددة</p></div><Button variant="outline" onClick={()=>{setReadingScope('');setReadingOpen(true);}}>اختيار الروايات</Button></div><div className="rounded-xl border p-3 text-sm"><strong>السند العام للشيخ</strong><p className="text-muted-foreground">يُستخدم سند الشيخ إلى {form.junction==='ubaydi'?'إبراهيم العبيدي':'الإمام ابن الجزري'}، ثم تُضاف تتمة الرواية والطريق المختار.</p></div><ShaykhReadingsList generalPrefix={form.personalChain} readings={form.readings} routes={savedReadingSanads} labelRoute={shortRoute} onEdit={selected?openReading:undefined}/>{!selected&&<p className="text-xs text-muted-foreground">احفظ بيانات الشيخ والروايات أولا، ثم افتح ملفه لإضافة سند مستقل لكل رواية.</p>}<label className="block space-y-1 text-sm"><span>نهاية السند</span><select value={form.junction} onChange={e=>setField('junction',e.target.value)} className="w-full rounded-md border bg-background p-2"><option value="ubaydi">إبراهيم العُبيدي</option><option value="jazari">الإمام ابن الجزري</option></select></label><label className="block space-y-1 text-sm"><span>السند العام للشيخ (يُستخدم للروايات التي ليس لها سند مستقل)</span><Textarea rows={7} dir="rtl" value={form.personalChain} onChange={e=>setField('personalChain',e.target.value)} placeholder="عن الشيخ... حتى إبراهيم العُبيدي أو ابن الجزري"/></label></div>}
  {section==='mutoon'&&
   <div className="additional-mutoon-panel space-y-3 rounded-lg border p-4"><div className="matn-list-header flex justify-between gap-3 items-center"><div><h3 className="font-semibold">إجازات المتون العلمية</h3><p className="text-xs text-muted-foreground">إضافة متن مع اسمه وتصنيفه وسنده الكامل وكلمات إجازته</p></div><Button type="button" variant="outline" onClick={()=>{setMatnIndex(null);setMatnDraft(emptyMatn());setMatnOpen(true)}}>إضافة متن</Button></div><ShaykhMatnCards mutoon={form.mutoon} onOpen={index=>{setMatnIndex(index);setMatnDraft({...emptyMatn(),...form.mutoon[index]});setMatnOpen(true);}} onRemove={index=>setForm(v=>({...v,mutoon:v.mutoon.filter((_,i)=>i!==index)}))}/>{matnOpen&&<div className="additional-matn-editor rounded-lg border bg-muted/20 p-3 space-y-3"><label className="block text-sm">المتن المنشور
    <select className="block w-full rounded border bg-background p-2" value={matnDraft.catalogId??''} onChange={event=>{
      const item=catalog.find(row=>row.id===event.target.value);
      if(item)setMatnDraft(draft=>({...draft,catalogId:item.id,name:item.title,category:item.category}));
    }}>
     <option value="" disabled>اختر من الفهرس</option>
     {catalog.map(item=><option key={item.id} value={item.id}>{item.title} — {item.category}</option>)}
    </select>
   </label>{!matnDraft.catalogId&&matnIndex!==null&&<><Input placeholder="اسم المتن" value={matnDraft.name} onChange={e=>setMatnDraft(v=>({...v,name:e.target.value}))}/><Input placeholder="التصنيف" value={matnDraft.category} onChange={e=>setMatnDraft(v=>({...v,category:e.target.value}))}/></>}<div className="matn-template-grid grid sm:grid-cols-2 gap-2">{([{key:'introductionId',kind:'introduction',label:'المقدمة'},{key:'conclusionId',kind:'conclusion',label:'الخاتمة'}] as const).map(t=><div key={t.key} className="matn-template-choice text-sm space-y-1"><label htmlFor={'extra-matn-'+t.key}>{t.label}</label><select id={'extra-matn-'+t.key} value={matnDraft[t.key]} onChange={e=>setMatnDraft(v=>({...v,[t.key]:e.target.value}))} className="block w-full rounded-md border bg-background p-2"><option value="">بدون {t.label}</option>{templates.filter(a=>a.kind===t.kind).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><p className="text-xs text-muted-foreground">النصوص المعتمدة تُدار من صفحة النصوص المشتركة.</p></div>)}</div><MatnDocumentEditor introductionId={matnDraft.introductionId} conclusionId={matnDraft.conclusionId} onPresentationChange={heading=>setMatnDraft(v=>({...v,sanadFormatting:writeMatnPresentation(v.sanadFormatting,parseMatnFormat(v.sanadFormatting),heading)}))} presentation={readMatnPresentation(matnDraft.sanadFormatting).heading||catalog.find(c=>c.id===matnDraft.catalogId)?.heading||DEFAULT_MATN_HEADING} sanad={matnDraft.sanadText} wording={matnDraft.wordingText} formats={parseMatnFormat(matnDraft.sanadFormatting)} onSanadChange={sanadText=>setMatnDraft(v=>({...v,sanadText}))} onWordingChange={wordingText=>setMatnDraft(v=>({...v,wordingText}))} onFormatsChange={formats=>setMatnDraft(v=>({...v,sanadFormatting:writeMatnPresentation(v.sanadFormatting,formats)}))} templates={templates} onSave={saveMatn} saving={saving} saveRevision={matnSaveVersion} draftKey={'extra:'+(selected||'new')+':'+(matnIndex??'new')+':'+(matnIndex===null?'':form.mutoon[matnIndex]?.name||'')} heading={<MatnHeadingControls showTextLayout={false} name={matnDraft.name} artworkNumber={catalog.find(c=>c.id===matnDraft.catalogId)?.artwork_number} value={readMatnPresentation(matnDraft.sanadFormatting).heading||catalog.find(c=>c.id===matnDraft.catalogId)?.heading||DEFAULT_MATN_HEADING} onChange={heading=>setMatnDraft(v=>({...v,sanadFormatting:writeMatnPresentation(v.sanadFormatting,parseMatnFormat(v.sanadFormatting),heading)}))}/>} preview={<MatnPreview headingSettings={readMatnPresentation(matnDraft.sanadFormatting).heading||catalog.find(c=>c.id===matnDraft.catalogId)?.heading||DEFAULT_MATN_HEADING} headingArtworkNumber={catalog.find(c=>c.id===matnDraft.catalogId)?.artwork_number} bookName={matnDraft.name} intro={templates.find(t=>t.id===matnDraft.introductionId)?.body||''} wording={matnDraft.wordingText} sanad={matnDraft.sanadText} end={templates.find(t=>t.id===matnDraft.conclusionId)?.body||''} formats={parseMatnFormat(matnDraft.sanadFormatting)} introFormats={parseMatnFormat(templates.find(t=>t.id===matnDraft.introductionId)?.formatting||'[]')} endFormats={parseMatnFormat(templates.find(t=>t.id===matnDraft.conclusionId)?.formatting||'[]')}/>}/></div>}</div>
  }

  </div></EditorPage>}
  {readingEditor&&<EditorPage title={'سند رواية '+displayRawi(readingEditor.qariId,readingEditor.rawi)} context={'الشيخ: '+form.name} backLabel="العودة إلى إجازات الشيخ" busy={readingSaving} saveDisabled={readingPending} onBack={()=>setReadingEditor(null)} onSave={saveReading} saveLabel="حفظ السند" dirtyKey={JSON.stringify([readingText,readingPeople,readingPending,readingRef,readingRoute,readingRouteName,readingBookAuthor,readingRouteSource,readingJunction])}><p className="text-xs text-muted-foreground">أضف رواة السند الشخصي بالترتيب، أو افتح اختيار كتاب وطريق محفوظ. الأسماء الجديدة تُحفظ في رجال الأسانيد.</p><h3 className="font-semibold">السند الشخصي لهذه الرواية</h3><PersonalSanadInput key={selected+'|'+readingEditor.qariId+'|'+readingEditor.rawi+'|'+readingRoute} value={readingText} preparation={readingPreparation} personIds={readingPeople} complete={Boolean(readingRoute)} onPendingChange={setReadingPending} onApply={(text,ids,junction)=>{setReadingPrefixRevision(v=>v+1);setReadingText(text);setReadingPeople(ids);setReadingJunction(junction);setReadingRef(null);}}/><details className="rounded-lg border p-3"><summary className="cursor-pointer font-semibold">اختيار كتاب وطريق محفوظ بدل البناء المباشر</summary><SavedRoutePicker onPendingChange={setReadingPending} initialScope={readingScope} key={selected+'|'+readingEditor?.qariId+'|'+readingEditor?.rawi+'|'+readingPrefixRevision} shaykhId={selected} shaykhName={form.name} initialPrefix={readingRef?.prefix||(!readingRoute?readingText:form.personalChain)} filterQariId={readingEditor?.qariId} filterRawi={readingEditor?.rawi} onApply={value=>{setReadingPending(false);setReadingPeople([]);setReadingRef(value.unifiedSanad);setReadingRoute(value.tariqNumber);setReadingRouteName(value.tariqName);setReadingBookAuthor(value.bookAuthor);setReadingRouteSource(value.routeSource);setReadingText(value.personalChain);setReadingJunction('jazari');}}/></details>{readingRoute&&<p className="text-sm">الطريق المختار: {shortRoute(readingRoute,readingRouteName)}</p>}</EditorPage>}
  <Dialog open={readingOpen} onOpenChange={setReadingOpen}><DialogContent dir="rtl" className="max-w-2xl"><DialogHeader><DialogTitle>تحديد القراءات والروايات</DialogTitle></DialogHeader><label className="block space-y-1 text-sm">نوع الإجازة<select className="w-full rounded border bg-background p-2" value={readingScope} onChange={e=>setReadingScope(e.target.value as typeof readingScope)}><option value="">اختر العشر الصغرى أو الكبرى</option><option value="sughra">العشر الصغرى — الشاطبية والدرة</option><option value="kubra">العشر الكبرى</option></select></label>{routeChoiceError&&<p role="alert" className="text-sm text-destructive">{routeChoiceError}</p>}<div className="max-h-[55vh] overflow-y-auto grid gap-3 sm:grid-cols-2 p-1">{(readingScope?QURRA.map(q=>({...q,rawis:q.rawis.filter(r=>readingScope==='sughra'||routeChoices.some(c=>c.confirmed&&c.reading_scope!=='sughra'&&c.qari_id===q.id&&c.rawi===r))})).filter(q=>q.rawis.length):[]).map(q=><div key={q.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{shortQariName(q.id)}</strong><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={q.rawis.every(r=>form.readings.some(x=>x.qariId===q.id&&x.rawi===r))} onChange={e=>setForm(v=>({...v,readings:e.target.checked?[...v.readings.filter(r=>r.qariId!==q.id),...q.rawis.map(rawi=>({qariId:q.id,rawi}))]:v.readings.filter(r=>r.qariId!==q.id)}))}/>القراءة كاملة</label></div><div className="flex flex-wrap gap-4 mt-2">{q.rawis.map(r=><label key={r} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={form.readings.some(x=>x.qariId===q.id&&x.rawi===r)} onChange={()=>toggle(q.id,r)}/>{displayRawi(q.id,r)}</label>)}</div></div>)}</div><Button onClick={()=>setReadingOpen(false)}>تم — {form.readings.length} رواية</Button></DialogContent></Dialog>
 </div>;
}
