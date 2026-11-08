'use client';
import {useEffect,useMemo,useState} from 'react';
import CombinedSanadView from '../../../legacy/components/CombinedSanadView';
import BranchPersonCard from '../../../legacy/components/BranchPersonCard';
import {QURRA,shortQariName} from '../../../legacy/lib/qurra';
import {buildQurraTransmissionData,type QurraStage} from '../../../legacy/lib/qurraTransmissionData';
import {groupSimilarSanadRoutes} from '../../../legacy/lib/sanadRouteGrouping';
import {arabicDigits} from '../../../legacy/lib/arabicDigits';
import {workspaceHeaders} from '../../../legacy/lib/workspaceSelection';
import type {BuilderLibrary} from '../../../legacy/lib/bookBuilder';

const stages:{id:QurraStage;name:string;description:string}[]=[
 {id:'jazari-dani',name:'ابن الجزري ← الداني',description:'الطرق التي تصل بينهما من أسانيد الكتب والروايات المحفوظة'},
 {id:'dani-seven',name:'الداني ← القراء السبعة',description:'الفروع المحفوظة بعد الداني، إلى آخر راوٍ مسجل في كل طريق'},
 {id:'jazari-three',name:'ابن الجزري ← القراء الثلاثة',description:'روايات أبي جعفر ويعقوب وخلف من الكتب المحفوظة'},
 {id:'other-seven',name:'مسارات السبعة الأخرى',description:'الطرق المحفوظة التي لا تمر بالداني في بيانات الرواية الحالية'},
];

export default function QurraTransmissionWorkspace(){
 const [library,setLibrary]=useState<BuilderLibrary|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [stage,setStage]=useState<QurraStage>('jazari-dani');
 const [qari,setQari]=useState('all');
 const [route,setRoute]=useState('all');
 const [sourcesVisible,setSourcesVisible]=useState(false);
 useEffect(()=>{
  let live=true;
  fetch('/api/book-builder',{headers:workspaceHeaders(),cache:'no-store'})
   .then(async response=>{
    const data=await response.json();
    if(!response.ok)throw Error(data?.error||'تعذر تحميل مكتبة الأسانيد');
    return data as BuilderLibrary;
   }).then(data=>{if(live)setLibrary(data);})
   .catch(e=>{if(live)setError(e instanceof Error?e.message:'تعذر تحميل المكتبة');})
   .finally(()=>{if(live)setLoading(false);});
  return ()=>{live=false;};
 },[]);
 const data=useMemo(()=>library?buildQurraTransmissionData(library):null,[library]);
 const candidates=(data?.witnesses||[]).filter(w=>w.stage===stage);
 const chosen=candidates.filter(w=>(qari==='all'||w.qariId===qari)&&(route==='all'||w.routeId===route));
 const qariOptions=[...new Set(candidates.map(w=>w.qariId))];
 const routeOptions=[...new Map(candidates.filter(w=>qari==='all'||w.qariId===qari).map(w=>[w.routeId,w.title])).entries()];
 const paths=chosen.map(w=>w.ids),groups=groupSimilarSanadRoutes(paths);
 const unreviewed=chosen.some(w=>!w.parentConfirmed);
 const coverage=stage==='jazari-three'?QURRA.filter(q=>q.family==='three'):QURRA.filter(q=>q.family==='seven');
 const covered=new Set(candidates.map(w=>w.qariId));
 return <main dir="rtl" className="mx-auto w-full max-w-[1500px] space-y-5 p-3 sm:p-6">
  <header className="space-y-3 rounded-xl border bg-background p-4">
   <a href="/studio?page=narrators" className="inline-flex rounded-md border px-3 py-1.5 text-sm hover:bg-muted">العودة إلى الكتب والطرق</a>
   <h1 className="text-2xl font-bold">مخططات أسانيد القراء</h1>
   <p className="text-sm text-muted-foreground">مساحة مستقلة لتجميع الأسانيد المحفوظة وفق هويات الرواة وروابطهم الفعلية؛ لا تضيف وصلات غير مسجلة، ولا تغيّر أسانيد المشايخ.</p>
  </header>
  <nav aria-label="مراحل مخططات القراء" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
   {stages.map(item=><button key={item.id} type="button" aria-pressed={stage===item.id} onClick={()=>{setStage(item.id);setQari('all');setRoute('all');}} className={'rounded-xl border p-3 text-right transition-colors '+(stage===item.id?'border-primary bg-primary/10':'bg-background hover:bg-muted')}>
    <strong className="block text-sm">{item.name}</strong>
    <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
   </button>)}
  </nav>
  {loading&&<p role="status" className="rounded-lg border p-4">جارٍ تحميل الأسماء والمسارات المحفوظة…</p>}
  {error&&<p role="alert" className="rounded-lg border border-destructive p-4 text-destructive">{error}</p>}
  {data&&<div className="space-y-4">
   <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="إحصاءات المرحلة">
    <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted-foreground">الأوجه المحفوظة المعروضة</p><p className="mt-1 text-xl font-bold">{arabicDigits(chosen.length)}</p></div>
    <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted-foreground">المسارات المجمّعة</p><p className="mt-1 text-xl font-bold">{arabicDigits(groups.length)}</p></div>
    <div className="rounded-xl border bg-background p-3"><p className="text-xs text-muted-foreground">الرواة المرتبطون بهويات محفوظة</p><p className="mt-1 text-xl font-bold">{arabicDigits(new Set(paths.flat()).size)}</p></div>
   </section>
   <section className="space-y-3 rounded-xl border bg-background p-3 sm:p-4">
    <div className="flex flex-wrap gap-3">
     <label className="min-w-[180px] flex-1 text-sm">القارئ
      <select aria-label="تصفية القارئ" value={qari} onChange={event=>{setQari(event.target.value);setRoute('all');}} className="mt-1 block w-full rounded-md border bg-background p-2">
       <option value="all">جميع القراء المتاحين</option>
       {qariOptions.map(id=><option value={id} key={id}>{shortQariName(id)}</option>)}
      </select>
     </label>
     <label className="min-w-[180px] flex-1 text-sm">الطريق المحفوظ
      <select aria-label="تصفية الطريق المحفوظ" value={route} onChange={event=>setRoute(event.target.value)} className="mt-1 block w-full rounded-md border bg-background p-2">
       <option value="all">جميع الطرق</option>
       {routeOptions.map(([id,title])=><option key={id} value={id}>{title}</option>)}
      </select>
     </label>
    </div>
    {chosen.length>0?<CombinedSanadView key={stage+':'+qari+':'+route} paths={paths}
     routeLabels={chosen.map(w=>shortQariName(w.qariId)+' — '+w.rawi+' — '+w.book+' — '+w.title)}
     source="وصلات الرواة المعروضة مأخوذة من هويات ومسارات محفوظة، لا من تشابه الأسماء."
     review={unreviewed}
     renderPerson={(id,positions)=><BranchPersonCard name={data.names[id]||'راوٍ غير متاح'} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>}/>
     :<p role="status" className="rounded-lg bg-muted/40 p-5 text-sm">لا يوجد في المكتبة الحالية اتصال محفوظ لهذه المرحلة مع التصفية المختارة. لا تُرسم وصلة غير موجودة.</p>}
    <p className="text-xs text-muted-foreground">مهم: ظهور آخر راوٍ لا يعني أن السلسلة اكتملت إلى الراوي أو الإمام. بعض أسانيد الكتب لازالت تحتاج مراجعة؛ الربط النهائي يتطلب التثبت من المصدر.</p>
   </section>
   <section className="rounded-xl border bg-background p-3 sm:p-4">
    <h2 className="text-base font-bold">تغطية القراء</h2>
    <div className="mt-2 flex flex-wrap gap-2">
     {coverage.map(reader=><span key={reader.id} className={'rounded-md border px-2 py-1 text-xs '+(covered.has(reader.id)?'text-foreground':'text-muted-foreground')} title={covered.has(reader.id)?'وصلات مسجلة لهذه المرحلة':'لم يُحفظ لهذه المرحلة مسار متصل بعد'}>
      {shortQariName(reader.id)} — {covered.has(reader.id)?'وصلات محفوظة':'بانتظار الربط'}
     </span>)}
    </div>
    {!data.jazariId&&<p className="mt-2 text-sm text-destructive">يلزم تأكيد هوية ابن الجزري في المكتبة قبل جمع سلاسل البداية.</p>}
    {!data.daniId&&<p className="mt-2 text-sm text-destructive">يلزم تأكيد هوية الداني في المكتبة قبل جمع مساراته.</p>}
    {data.skipped>0&&<p className="mt-2 text-xs text-muted-foreground">لم تُعرض {arabicDigits(data.skipped)} من المقاطع التي تفتقد هوية أو رابط كتاب محفوظ صالحًا.</p>}
   </section>
   <section className="rounded-xl border bg-background p-3 sm:p-4">
    <button type="button" aria-expanded={sourcesVisible} onClick={()=>setSourcesVisible(v=>!v)} className="w-full text-right font-semibold">المصادر والأفرع المحفوظة ({arabicDigits(chosen.length)}) {sourcesVisible?'−':'+'}</button>
    {sourcesVisible&&<div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
     {chosen.map(w=><div key={w.id} className="rounded-lg border p-2 text-sm">
      <strong>{shortQariName(w.qariId)} — {w.rawi}</strong>
      <p>{w.book} — {w.title}</p>
      <p className="text-xs text-muted-foreground">{arabicDigits(w.ids.length)} رواة بهويات محفوظة · {w.parentConfirmed?'إسناد الكتاب معتمد':'إسناد الكتاب يحتاج مراجعة'} · المسار لا يمتد تلقائيًا إلى الإمام</p>
     </div>)}
    </div>}
   </section>
   <aside className="space-y-1 rounded-xl border border-dashed p-4 text-sm">
    <h2 className="font-semibold">المرحلة اللاحقة: من القراء إلى الصحابة ثم النبي ﷺ</h2>
    <p className="text-muted-foreground">ستضاف فقط عند ربط هويات الرواة وأسانيدهم الموثقة، ولا تُنشأ تلقائيًا من أسماء القراء أو نصوص متشابهة. لإضافة الرواة والطرق الآن استخدم قسم الكتب والطرق المحفوظ.</p>
   </aside>
  </div>}
 </main>;
}
