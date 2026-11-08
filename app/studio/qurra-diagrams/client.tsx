'use client';

import {useEffect,useMemo,useState} from 'react';
import {ChevronDown,GitBranch,Pencil} from 'lucide-react';
import CombinedSanadView from '../../../legacy/components/CombinedSanadView';
import BranchPersonCard from '../../../legacy/components/BranchPersonCard';
import SimpleRouteEditor from './SimpleRouteEditor';
import QurraHistoricalPanel from './QurraHistoricalPanel';
import {historicalSection,allHistoricalSections,type HistoricalSegmentKind} from '../../../legacy/lib/qurraHistoricalSegments';
import {QURRA,displayRawi,shortQariName} from '../../../legacy/lib/qurra';
import {savedRawiName} from '../../../legacy/lib/rawiIdentity';
import {buildQurraTransmissionData,sharedJazariDaniPaths,type QurraStage} from '../../../legacy/lib/qurraTransmissionData';
import {groupSimilarSanadRoutes} from '../../../legacy/lib/sanadRouteGrouping';
import {arabicDigits} from '../../../legacy/lib/arabicDigits';
import {workspaceHeaders} from '../../../legacy/lib/workspaceSelection';
import type {BuilderLibrary} from '../../../legacy/lib/bookBuilder';

/** The upper transmission graph and lower text-based transmission segments
 * stay separate until the connecting source links have been reviewed. */
type QurraPageStage=QurraStage|HistoricalSegmentKind;
const stages:{id:QurraStage;name:string;description:string}[]=[
 {id:'all-ten',name:'ابن الجزري ← القراء العشرة',description:'جميع الطرق المحفوظة المتصلة من ابن الجزري، مع إبقاء ما لم يكتمل واضحًا'}, 
 {id:'jazari-dani',name:'ابن الجزري ← الداني',description:'الإسناد المشترك من ابن الجزري إلى الداني'},
 {id:'dani-seven',name:'الداني ← القراء السبعة',description:'طرق القراء السبعة المحفوظة بعد الداني'},
 {id:'jazari-three',name:'ابن الجزري ← القراء الثلاثة',description:'طرق أبي جعفر ويعقوب وخلف البزار'},
 {id:'other-seven',name:'مسارات السبعة الأخرى',description:'طرق محفوظة أخرى لا تمر بالداني'},
];

export default function QurraTransmissionWorkspace(){
 const [library,setLibrary]=useState<BuilderLibrary|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [stage,setStage]=useState<QurraPageStage>('all-ten');
 const [qari,setQari]=useState('');
 const [route,setRoute]=useState('');
 const [showAll,setShowAll]=useState(false);
 const [editingRouteId,setEditingRouteId]=useState('');

 const reload=async()=>{
  const response=await fetch('/api/book-builder',{headers:workspaceHeaders(),cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'تعذر تحميل مكتبة الأسانيد');
  setLibrary(result as BuilderLibrary);setError('');
 };
 useEffect(()=>{
  let live=true;
  fetch('/api/book-builder',{headers:workspaceHeaders(),cache:'no-store'})
   .then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.error||'تعذر تحميل المكتبة');return result as BuilderLibrary;})
   .then(data=>{if(live)setLibrary(data);})
   .catch(e=>{if(live)setError(e instanceof Error?e.message:'تعذر تحميل المكتبة');})
   .finally(()=>{if(live)setLoading(false);});
  return ()=>{live=false;};
 },[]);

 const data=useMemo(()=>library?buildQurraTransmissionData(library):null,[library]);
 const isHistorical=stage==='rawi-imam'||stage==='imam-sahaba'||stage==='sahaba-prophet';
 const historicalKind:HistoricalSegmentKind=isHistorical?stage as HistoricalSegmentKind:'rawi-imam';
 const sections=library?.continuationSections||[];
 const historicalOptions=isHistorical?allHistoricalSections(sections,historicalKind,library?.people||[]):[];
 const historicalReaders=QURRA.filter(q=>historicalOptions.some(section=>section.qariId===q.id));
 const activeHistoricalQari=historicalReaders.some(q=>q.id===qari)?qari:historicalReaders[0]?.id||'';
 const historicalRawis=historicalKind==='rawi-imam'?(QURRA.find(q=>q.id===activeHistoricalQari)?.rawis||[]):[];
 const activeHistoricalRawi=historicalRawis.some(r=>r===route)?route:historicalRawis[0]||'';
 const historicalView=isHistorical?historicalSection(sections,activeHistoricalQari,activeHistoricalRawi,historicalKind,library?.people||[]):null;
 const candidates=(data?.witnesses||[]).filter(w=>w.stage===stage);
 const sharedStage=stage==='jazari-dani';
 const overviewStage=stage==='all-ten';
 const groupedStage=sharedStage||overviewStage;
 const sharedPaths=sharedJazariDaniPaths(candidates);
 const qariOptions=QURRA.filter(q=>candidates.some(w=>w.qariId===q.id));
 const activeQari=qariOptions.some(q=>q.id===qari)?qari:qariOptions[0]?.id||'';
 const routeOptions=[...new Map(candidates.filter(w=>w.qariId===activeQari).map(w=>[w.routeId,w])).values()];
 const activeRoute=routeOptions.some(w=>w.routeId===route)?route:routeOptions[0]?.routeId||'';
 // Jazari → Dani is a common chain. Do not choose Qalun or any other reading
 // just because its saved route happens to be the first witness.
 const uniqueFullPaths=[...new Map(candidates.map(w=>[JSON.stringify(w.ids),w])).values()];
 const chosen=sharedStage?sharedPaths:overviewStage?uniqueFullPaths:showAll?candidates:candidates.filter(w=>w.routeId===activeRoute);
 const paths=chosen.map(w=>w.ids);
 const grouped=groupSimilarSanadRoutes(paths);
 const current=groupedStage?undefined:routeOptions.find(w=>w.routeId===activeRoute);
 const currentChain=library?.chains.find(c=>c.id===activeRoute&&!c.archived&&c.kind==='route');
 const editingChain=library?.chains.find(c=>c.id===editingRouteId&&!c.archived&&c.kind==='route');
 const currentBook=library?.books.find(b=>b.id===current?.bookId);
 const unreviewed=(groupedStage?candidates:chosen).some(w=>!w.routeConfirmed||!w.parentConfirmed);
 const coverage=stage==='jazari-three'?QURRA.filter(q=>q.family==='three'):QURRA.filter(q=>q.family==='seven');
 const covered=new Set(candidates.map(w=>w.qariId));
 const changeStage=(next:QurraPageStage)=>{setStage(next);setQari('');setRoute('');setShowAll(false);setEditingRouteId('');};

 return <div dir="rtl" className="mx-auto w-full max-w-[1500px] space-y-4 px-1 py-2 sm:px-3">
  <header className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <h1 className="text-xl font-bold sm:text-2xl">مخططات أسانيد القراء</h1>
    <p className="mt-1 text-sm text-muted-foreground">{isHistorical?'نصوص محفوظة من الرواية إلى النبي ﷺ، مع عرض الفروع للمراجعة.':overviewStage?'جميع أسانيد القراء العشرة في مخطط واحد من السجلات المحفوظة.':sharedStage?'السند المشترك بين ابن الجزري والداني.':'اختر الرواية، شاهد سندها، وعدّل الرواة مباشرةً.'}</p>
   </div>
   <div className="inline-flex items-center gap-1 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
    <GitBranch size={16} aria-hidden="true"/> أسانيد محفوظة
   </div>
  </header>

  <nav aria-label="مراحل مخططات القراء" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
   {stages.filter(item=>item.id!=='other-seven').map(item=><button key={item.id} type="button" aria-pressed={stage===item.id}
    onClick={()=>changeStage(item.id)} className={'rounded-lg border px-3 py-3 text-right text-sm font-semibold transition-colors '+(stage===item.id?'border-primary bg-primary/10 text-primary':'bg-background hover:bg-muted')}>
    {item.name}
   </button>)}
  </nav>
  <details className="text-xs text-muted-foreground" open={stage==='other-seven'}>
   <summary className="cursor-pointer list-none underline-offset-2 hover:underline" aria-label="مسارات أخرى">
    مسارات أخرى <ChevronDown size={13} aria-hidden="true" className="inline"/>
   </summary>
   <button type="button" onClick={()=>changeStage('other-seven')} aria-pressed={stage==='other-seven'}
    className={'mt-2 rounded-md border px-3 py-2 text-sm '+(stage==='other-seven'?'bg-primary/10 text-primary':'bg-background')}>مسارات السبعة الأخرى</button>
  </details>

  <nav aria-label="تتمات أسانيد القراء" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
   {([
    {id:'rawi-imam',name:'الرواة ← الأئمة'},
    {id:'imam-sahaba',name:'الأئمة ← الصحابة'},
    {id:'sahaba-prophet',name:'الصحابة ← النبي ﷺ'},
   ] as const).map(item=><button type="button" key={item.id} aria-pressed={stage===item.id}
    onClick={()=>changeStage(item.id)} className={'rounded-lg border px-3 py-2.5 text-right text-sm font-semibold '+(stage===item.id?'border-primary bg-primary/10 text-primary':'bg-background hover:bg-muted')}>
    {item.name}
   </button>)}
  </nav>

  {loading&&<p role="status" className="rounded-lg border p-4">جارٍ تحميل الأسانيد المحفوظة…</p>}
  {error&&<p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}

  {data&&isHistorical&&<section className="space-y-3">
   <div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2 sm:p-4">
    <label className="block min-w-0 text-sm font-semibold">القارئ
     <select aria-label="القارئ في تتمة السند" className="mt-1 w-full rounded-md border bg-background p-2.5" value={activeHistoricalQari}
      onChange={event=>{setQari(event.target.value);setRoute('');}}>
      {historicalReaders.map(item=><option key={item.id} value={item.id}>{shortQariName(item.id)}</option>)}
     </select>
    </label>
    {stage==='rawi-imam'&&<label className="block min-w-0 text-sm font-semibold">الراوي
     <select aria-label="الراوي في تتمة السند" className="mt-1 w-full rounded-md border bg-background p-2.5" value={activeHistoricalRawi}
      onChange={event=>setRoute(event.target.value)}>
      {historicalRawis.map(rawi=><option key={rawi} value={rawi}>{displayRawi(activeHistoricalQari,rawi)}</option>)}
     </select>
    </label>}
   </div>
   <QurraHistoricalPanel key={historicalView?.id||stage+activeHistoricalQari} section={historicalView}/>
  </section>}
  {data&&!isHistorical&&<section className="space-y-3">
   {!groupedStage&&<div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2 sm:p-4">
    <label className="block min-w-0 text-sm font-medium">القارئ
     <select aria-label="القارئ" className="mt-1 w-full rounded-md border bg-background p-2.5 text-sm" value={activeQari}
      onChange={event=>{setQari(event.target.value);setRoute('');setShowAll(false);setEditingRouteId('');}}>
      {qariOptions.map(q=><option key={q.id} value={q.id}>{shortQariName(q.id)}</option>)}
     </select>
    </label>
    <label className="block min-w-0 text-sm font-medium">الرواية والطريق
     <select aria-label="الرواية والطريق" className="mt-1 w-full rounded-md border bg-background p-2.5 text-sm" value={activeRoute}
      onChange={event=>{setRoute(event.target.value);setShowAll(false);setEditingRouteId('');}}>
      {routeOptions.map(w=><option key={w.routeId} value={w.routeId}>{displayRawi(w.qariId,w.rawi)} · {w.book} · {w.title}</option>)}
     </select>
    </label>
   </div>}
   {!candidates.length&&<p role="status" className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">لا توجد طرق محفوظة لهذه المرحلة. يمكنك إضافة الطريق من مكتبة الكتب والطرق.</p>}
   {candidates.length>0&&<div className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
    {!editingChain&&<div className="flex flex-wrap items-center justify-between gap-3">
     <div className="min-w-0">
      <h2 className="font-semibold">{overviewStage?'ابن الجزري ← القراء العشرة · الطرق المحفوظة':sharedStage?'السند المشترك: ابن الجزري ← الداني':showAll?'جميع الأسانيد المحفوظة':current?displayRawi(current.qariId,current.rawi)+' عن '+shortQariName(current.qariId):'السند المحفوظ'}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{overviewStage?'طرق ظاهرة: '+arabicDigits(paths.length)+' · روايات محفوظة: '+arabicDigits(new Set(candidates.map(w=>w.routeId)).size):sharedStage?'مسارات محفوظة: '+arabicDigits(paths.length)+' · شواهد: '+arabicDigits(candidates.length):showAll?arabicDigits(chosen.length)+' أوجه محفوظة':currentBook?.title||''} · {arabicDigits(new Set(paths.flat()).size)} راوٍ · {arabicDigits(grouped.length)} مسار</p>
     </div>
     {!groupedStage&&<div className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={showAll} onClick={()=>setShowAll(v=>!v)}
       className="rounded-md border px-3 py-2 text-sm hover:bg-muted">{showAll?'عرض الرواية المختارة':'عرض جميع المسارات'}</button>
      {library?.canManage&&currentChain&&!showAll&&<button type="button" onClick={()=>setEditingRouteId(currentChain.id)}
       className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Pencil size={15}/> تعديل هذا السند</button>}
     </div>}
    </div>}
    {overviewStage&&paths.length>0&&!editingChain&&<p className="text-xs text-muted-foreground">المخطط الكامل قابل للتمرير أفقيًّا لقراءة أسماء الرجال كاملة، دون تصغير البطاقات.</p>}
    {editingChain&&library?.canManage?<SimpleRouteEditor key={editingChain.id} library={library} route={editingChain}
     onSaved={reload} onClose={()=>setEditingRouteId('')}/>:
     paths.length?<CombinedSanadView key={stage+':'+activeRoute+':'+showAll} paths={paths} spacious={overviewStage}
      routeLabels={chosen.map(w=>sharedStage?w.book+' — '+w.title:shortQariName(w.qariId)+' — '+w.rawi+' — '+w.book+' — '+w.title)}
      review={unreviewed}
      renderPerson={(id,positions)=><BranchPersonCard name={data.names[id]||'راوٍ غير متاح'} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>}/>
      :<p className="p-4 text-sm text-muted-foreground">لا توجد وصلة محفوظة.</p>}
    {!editingChain&&current&&<div className="space-y-1 rounded-md border border-dashed px-3 py-2 text-sm">
     <span className="text-xs text-muted-foreground">الراوي صاحب الرواية</span>
     <p className="font-semibold leading-8">{savedRawiName(library?.people||[],current.qariId,current.rawi)}</p>
     <p className="text-xs text-muted-foreground">لإضافة هذا الراوي إلى السند، اضغط «تعديل هذا السند».</p>
    </div>}
   </div>}

   <details className="rounded-lg border bg-background p-3 text-sm" aria-label="المعلومات والمصادر المتقدمة">
    <summary className="cursor-pointer font-semibold">المصادر والمراجعة والمعلومات المتقدمة</summary>
    <div className="mt-3 space-y-3 text-xs text-muted-foreground">
     <p>{stages.find(item=>item.id===stage)?.description}</p>
     {sharedStage&&<p>تُعرض الأسانيد المتطابقة مرة واحدة، مع بقاء مصادرها المحفوظة منفصلة.</p>}
     {overviewStage&&<p>هذا المخطط يعرض أسانيد الكتب والطرق الموجودة فعليًا. لا يدل انتهاء أي مسار على ثبوت وصله بالإمام حتى يُستكمل من نص المصدر ويُراجع.</p>}
     {current&&<div className="space-y-1 rounded-lg bg-muted/40 p-3">
      <p><strong className="text-foreground">المصدر:</strong> {current.book} — {current.title}</p>
      <p><strong className="text-foreground">حالة الطريق:</strong> {current.routeConfirmed?'محفوظ ومعتمد':'محفوظ وقيد المراجعة'}</p>
      <p><strong className="text-foreground">إسناد الكتاب:</strong> {current.parentConfirmed?'معتمد':'يحتاج مراجعة'}</p>
      <p>إكمال الرواة لا يعتمد الاتصال إلى الإمام تلقائيًا. التتمات المشتركة تُراجع منفصلة، وتبقى الأسانيد القديمة محفوظة.</p>
     </div>}
     {data.skipped>0&&<p>هناك {arabicDigits(data.skipped)} مقاطع لم تُعرض بسبب فقدان هوية أو رابط محفوظ صالح.</p>}
     {!sharedStage&&<div>
      <strong className="text-foreground">تغطية القراء</strong>
      <div className="mt-2 flex flex-wrap gap-2">{(overviewStage?QURRA:coverage).map(q=><span key={q.id} className="rounded border px-2 py-1">{shortQariName(q.id)}: {covered.has(q.id)?'محفوظ':'غير متاح'}</span>)}</div>
     </div>}
     {showAll&&<div className="max-h-40 overflow-auto space-y-1">{[...new Map(chosen.map(w=>[w.routeId,w])).values()].map(w=><p key={w.routeId}>{displayRawi(w.qariId,w.rawi)} — {w.book} — {w.title}</p>)}</div>}
    </div>
   </details>
  </section>}
 </div>;
}
