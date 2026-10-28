import {useEffect,useState} from 'react';
import {ijazahHoldings,sanadSections,personalWording,IjazahHoldingsOutputType,SanadSectionsOutputType} from '../lib/api';
import {Pencil,Plus,Trash2,Eye} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@project/components/ui/card';
import {Textarea} from '@project/components/ui/textarea';
import {Checkbox} from '@project/components/ui/checkbox';
import {Input} from '@project/components/ui/input';
import {QURRA,readingText,routeFor,displayRawi,type ReadingSelection} from '../lib/qurra';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@project/components/ui/dialog';
import {parseFormatting,type SectionFormatting} from '../lib/sanadFormatting';
import {reachesJunction} from '../lib/personalSanadValidation';
import {vocalizeReadingLabel} from '../lib/vocalizedReading';
import {assembleIjazah} from '../lib/assembleIjazah';
import MutoonEditor from './MutoonEditor';
type Holding=IjazahHoldingsOutputType['holdings'][number];
type Section=SanadSectionsOutputType['sections'][number];
export default function IjazahHoldingsView({onSaved}:{onSaved?:()=>void}){
 const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState('');
 const [holdings,setHoldings]=useState<Holding[]>([]);
 const sortedHoldings=[...holdings].sort((a,b)=>QURRA.findIndex(q=>q.id===a.qariId)-QURRA.findIndex(q=>q.id===b.qariId)||((QURRA.find(q=>q.id===a.qariId)?.rawis as readonly string[]|undefined)?.indexOf(a.rawi||'')??-1)-((QURRA.find(q=>q.id===b.qariId)?.rawis as readonly string[]|undefined)?.indexOf(b.rawi||'')??-1));
 const [sections,setSections]=useState<Section[]>([]);
 const [introductionId,setIntroductionId]=useState('');
 const [wordingId,setWordingId]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 const [pickerOpen,setPickerOpen]=useState(false);
 const [addCategory,setAddCategory]=useState<'choose'|'qiraat'|'mutoon'>('choose');
 const availableQurra=QURRA.filter(q=>!holdings.some(h=>h.qariId===q.id&&!h.rawi));
 const [showWordingPreview,setShowWordingPreview]=useState(false);
 const [creatingWording,setCreatingWording]=useState(false);
 const [wordingTitle,setWordingTitle]=useState('');
 const [wordingBody,setWordingBody]=useState('');
 const [choices,setChoices]=useState<ReadingSelection[]>([]);
 const [personal,setPersonal]=useState('');
 const [separateRiwayat,setSeparateRiwayat]=useState(false);
 const [riwayahTexts,setRiwayahTexts]=useState<Record<string,string>>({});
 const [enabledRiwayat,setEnabledRiwayat]=useState<Record<string,boolean>>({});
 const [deleteAllOpen,setDeleteAllOpen]=useState(false);
 const [deleteAllPhrase,setDeleteAllPhrase]=useState('');
 const [junction,setJunction]=useState<'ubaydi'|'jazari'>('ubaydi');
 const [busy,setBusy]=useState(false);
 const [formatting,setFormatting]=useState<SectionFormatting>(parseFormatting());
 const refresh=async()=>{setLoading(true);setLoadError('');try{const [h,sec]=await Promise.all([ijazahHoldings({action:'list'}),sanadSections({action:'list'})]);setHoldings(h.holdings);setSections(sec.sections);setIntroductionId(v=>v||sec.sections.find(x=>x.sectionType==='introduction')?.id||'');setWordingId(v=>v||sec.sections.find(x=>x.title==='كلمات الإجازة')?.id||sec.sections.find(x=>x.sectionType==='wording')?.id||'');}catch(e){setLoadError(e instanceof Error?e.message:'تعذر تحميل الإجازات');}finally{setLoading(false);}};
 useEffect(()=>{void refresh();},[]);
 const reset=()=>{setPickerOpen(false);setAddCategory('choose');setShowWordingPreview(false);setCreatingWording(false);setEditing(null);setChoices([]);setPersonal('');setSeparateRiwayat(false);setRiwayahTexts({});setEnabledRiwayat({});setJunction('ubaydi');setFormatting(parseFormatting());setIntroductionId(sections.find(x=>x.sectionType==='introduction')?.id||'');setWordingId(sections.find(x=>x.title==='كلمات الإجازة')?.id||sections.find(x=>x.sectionType==='wording')?.id||'');};
 const start=(h?:Holding)=>{setPickerOpen(false);setAddCategory(h?'qiraat':'choose');setEditing(h?.id||'new');setChoices(h?[{qariId:h.qariId,rawi:h.rawi||undefined}]:[]);setPersonal(h?.personalChain||'');
   const related=h?holdings.filter(v=>v.qariId===h.qariId&&!!v.rawi):[];
   setSeparateRiwayat(Boolean(h&&!h.rawi&&related.length));
   setRiwayahTexts(Object.fromEntries(related.map(v=>[v.rawi,v.personalChain])));
   setEnabledRiwayat(Object.fromEntries(related.map(v=>[v.rawi,true])));
   setFormatting(parseFormatting(h?.formatting));setJunction(h?.junction==='jazari'?'jazari':'ubaydi');setIntroductionId(h?.introductionId||sections.find(x=>x.sectionType==='introduction')?.id||'');setWordingId(h?.wordingId||sections.find(x=>x.title==='كلمات الإجازة')?.id||sections.find(x=>x.sectionType==='wording')?.id||'');};
 const pick=(qariId:string,rawi?:string)=>{const has=choices.some(v=>v.qariId===qariId&&v.rawi===rawi);setChoices(v=>has?v.filter(t=>!(t.qariId===qariId&&t.rawi===rawi)):[...v,{qariId,rawi}]);};
 const save=async()=>{
  if(!choices.length||!personal.trim())return toast.error('اختر إجازة وأدخل سندك الشخصي');
  if(!reachesJunction({personalChain:personal,junction}))return toast.error('السند لا ينتهي عند نقطة الالتقاء المختارة');
  if(editing!=='new'&&choices.length!==1)return toast.error('يمكن تعديل إجازة واحدة فقط في كل مرة');
  const selectedOverride=separateRiwayat?choices.filter(c=>!c.rawi).flatMap(c=>QURRA.find(q=>q.id===c.qariId)?.rawis.filter(r=>enabledRiwayat[r]).map(r=>({qariId:c.qariId,rawi:r}))||[]):[];
  for(const item of selectedOverride){
    const chain=riwayahTexts[item.rawi]?.trim()||'';
    if(!reachesJunction({personalChain:chain,junction}))return toast.error(`أكمل سند رواية ${item.rawi} إلى نقطة الالتقاء المختارة`);
  }
  setBusy(true);
  try{
   for(const choice of choices){
     await ijazahHoldings({action:'save',id:editing==='new'?undefined:editing||undefined,qariId:choice.qariId,rawi:choice.rawi||'',junction,personalChain:personal,introductionId,wordingId,formatting});
     if(!choice.rawi){
       const original=holdings.filter(h=>h.qariId===choice.qariId&&!!h.rawi);
       for(const r of QURRA.find(q=>q.id===choice.qariId)?.rawis||[]){
         const existing=original.find(h=>h.rawi===r);
         if(separateRiwayat&&enabledRiwayat[r]){
           await ijazahHoldings({action:'save',id:existing?.id,qariId:choice.qariId,rawi:r,junction,personalChain:riwayahTexts[r].trim(),introductionId,wordingId,formatting});
         }else if(existing&&separateRiwayat===false){
           // Turning the option off restores the shared qiraah sanad for both narrators.
           await ijazahHoldings({action:'delete',id:existing.id});
         }else if(existing&&!enabledRiwayat[r]){
           await ijazahHoldings({action:'delete',id:existing.id});
         }
       }
     }
   }
   toast.success('تم حفظ أسانيد القراءات والروايات');reset();await refresh();onSaved?.();
  }catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ الإجازات');await refresh();}finally{setBusy(false);}
 };
 const deleteEverything=async()=>{
   if(deleteAllPhrase!=='حذف جميع الأسانيد')return;
   setBusy(true);
   try{await ijazahHoldings({action:'deleteAll'});reset();setDeleteAllOpen(false);setDeleteAllPhrase('');await refresh();onSaved?.();toast.success('حُذفت الأسانيد والإجازات المحفوظة في حسابك');}
   catch(e){toast.error(e instanceof Error?e.message:'تعذر حذف الأسانيد');}finally{setBusy(false);}
 };
 const addWording=async()=>{
  if(wordingTitle.trim().length<2||wordingBody.trim().length<10)return toast.error('Enter a wording title and text');
  if(!/^أما بعد[!،,:؛\s]*فيقول/u.test(wordingBody.trim()))return toast.error('ابدأ كلمات الإجازة بعبارة: أما بعد فيقول');
  if(/كما أخذته/u.test(wordingBody))return toast.error('توقف قبل عبارة كما أخذته؛ فهي بداية السند الشخصي');
  setBusy(true);
  try{
    const saved=await personalWording({title:wordingTitle.trim(),body:wordingBody.trim()});
    const sec=await sanadSections({action:'list'});
    setSections(sec.sections);
    setWordingId(saved.id);
    setCreatingWording(false);setShowWordingPreview(true);
    setWordingTitle('');setWordingBody('');
    toast.success('تمت إضافة كلمات الإجازة الخاصة بك');
  }catch(e){toast.error(e instanceof Error?e.message:'Unable to create wording');}finally{setBusy(false);}
 };
 const selectedWording=sections.find(s=>s.id===wordingId);
 const selectedIntro=sections.find(s=>s.id===introductionId);
 const selectedChoice=choices[0];
 const selectedImam=QURRA.find(q=>q.id===selectedChoice?.qariId);
 const selectedRawi=selectedChoice?.rawi||selectedImam?.rawis[0];
 const reading=selectedImam&&selectedRawi?readingText({qariId:selectedImam.id,rawi:selectedRawi}):'{{القراءة/الرواية}}';
 const route=selectedImam?routeFor([selectedImam.id]):'';
 const beforePersonal=[selectedIntro?.body,selectedWording?.body?.replaceAll('{{القراءة/الرواية}}',vocalizeReadingLabel([reading,route].filter(Boolean).join(' '))).replaceAll('mujeez','[اسم المُجيز]').replaceAll('mujaaz','[اسم المُجاز]')].filter(Boolean).join('\n\n');
 const afterPersonal=junction==='ubaydi'?'من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند':selectedImam?.family==='seven'?'من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة':selectedImam&&selectedRawi?`CHAIN:${selectedImam.id}:${selectedRawi}`:'';
 const afterBody=sections.find(s=>s.title===afterPersonal)?.body||'';
 const sanadPreview=selectedImam&&personal.trim()? (selectedChoice?.rawi?[selectedChoice.rawi]:[...selectedImam.rawis]).map(rawi=>({rawi,...assembleIjazah({qariId:selectedImam.id,rawi,personalChain:separateRiwayat&&enabledRiwayat[rawi]?riwayahTexts[rawi]||'':personal,junction,introductionId,wordingId},sections)})) : [];

 const remove=async(h:Holding)=>{if(!confirm('هل تريد حذف هذه الإجازة؟ لن تُحذف الأسانيد المرتبطة بالشهادات السابقة.'))return;setBusy(true);try{await ijazahHoldings({action:'delete',id:h.id});await refresh();onSaved?.();toast.success('تم حذف الإجازة');}catch{await refresh();toast.error('تعذر حذف الإجازة؛ تم تحديث القائمة، حاول مجددًا إذا كانت لا تزال موجودة');}finally{setBusy(false);}};
 if(loading)return <p role="status" className="rounded-xl border p-6">جارٍ تحميل الأسانيد والإجازات…</p>;
 if(loadError)return <div role="alert" className="rounded-xl border p-6 space-y-3"><p>{loadError}</p><Button onClick={refresh}>إعادة المحاولة</Button></div>;
 return <div className="space-y-4" dir="rtl">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">إجازاتي وأسانيدي الشخصية</h2></div><div className="flex gap-2"><Button onClick={()=>start()}><Plus className="h-4 w-4 me-1"/>إضافة إجازة</Button><Button variant="outline" disabled={busy} onClick={()=>{setDeleteAllPhrase('');setDeleteAllOpen(true);}}>حذف جميع الأسانيد</Button></div></div>
  {deleteAllOpen&&<div className="rounded-lg border border-destructive p-4 space-y-3"><strong>حذف جميع الأسانيد المحفوظة في حسابك</strong><p className="text-sm">سيُحذف جميع سجلات إجازاتك وأسانيدك المحفوظة والمسودات غير المرتبطة بشهادات صادرة. تبقى بيانات الشهادات الصادرة محفوظة للرجوع إليها، لكن لن تتاح طباعتها دون سند محفوظ. لا يمكن التراجع عن الحذف.</p><p className="text-sm">اكتب «حذف جميع الأسانيد» للتأكيد.</p><Input dir="rtl" value={deleteAllPhrase} onChange={e=>setDeleteAllPhrase(e.target.value)} placeholder="حذف جميع الأسانيد"/><div className="flex gap-2"><Button variant="destructive" disabled={busy||deleteAllPhrase!=='حذف جميع الأسانيد'} onClick={deleteEverything}>حذف نهائي</Button><Button variant="outline" onClick={()=>setDeleteAllOpen(false)}>إلغاء</Button></div></div>}
  <Dialog open={!!editing} onOpenChange={open=>{if(!open&&!busy)reset()}}><DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing==='new'?'إضافة الإجازات':'تعديل الإجازة'}</DialogTitle></DialogHeader><div className="space-y-4">

   {editing==='new'&&addCategory==='choose'&&<div className="grid gap-3 sm:grid-cols-2"><button type="button" className="rounded-xl border p-5 text-right hover:bg-muted" onClick={()=>setAddCategory('qiraat')}><strong className="block text-lg">إسناد القراءات</strong><span className="text-sm text-muted-foreground">اختر القراءات غير المحفوظة</span></button><button type="button" className="rounded-xl border p-5 text-right hover:bg-muted" onClick={()=>setAddCategory('mutoon')}><strong className="block text-lg">إسناد المتون العلمية</strong><span className="text-sm text-muted-foreground">قسم مستقل قيد الإعداد</span></button></div>}
   {editing==='new'&&addCategory==='mutoon'&&<div className="space-y-3"><Button variant="outline" onClick={()=>setAddCategory('choose')}>رجوع</Button><MutoonEditor/></div>}
   {addCategory==='qiraat'&&<><div className="rounded-lg border p-3 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm">{availableQurra.length===0?'جميع القراءات العشر محفوظة — عدل إجازاتك الحالية':`القراءات المتاحة: ${availableQurra.length} من 10`}</span><Button variant="outline" onClick={()=>setPickerOpen(true)}>اختر القراءات / الروايات</Button></div><div className="flex flex-wrap gap-2">{choices.map((c,i)=><span key={i} className="rounded-full bg-muted px-3 py-1 text-sm">{QURRA.find(q=>q.id===c.qariId)?.reading}{c.rawi?` — ${displayRawi(c.qariId,c.rawi)}`:''}</span>)}{choices.length===0&&<p className="text-sm text-muted-foreground">لم تختر أي قراءة بعد</p>}</div></div>
   <Dialog open={pickerOpen} onOpenChange={setPickerOpen}><DialogContent dir="rtl" className="max-w-2xl"><DialogHeader><DialogTitle>اختر القراءات والروايات</DialogTitle></DialogHeader><div className="max-h-[55vh] overflow-y-auto space-y-2 p-1"><Button type="button" variant="outline" disabled={editing!=='new'||!availableQurra.length} onClick={()=>setChoices(availableQurra.map(q=>({qariId:q.id})))}>جميع القراءات</Button>{(editing==='new'?availableQurra:QURRA).map(q=><div key={q.id} className="border rounded-lg p-3 space-y-2"><strong>{q.reading}</strong><label className="flex items-center gap-2"><Checkbox checked={choices.some(c=>c.qariId===q.id&&!c.rawi)} onCheckedChange={()=>pick(q.id)}/>القراءة كاملة</label><div className="flex flex-wrap gap-4">{q.rawis.map(r=><label key={r} className="flex gap-2 items-center"><Checkbox checked={choices.some(c=>c.qariId===q.id&&c.rawi===r)} onCheckedChange={()=>pick(q.id,r)}/>{displayRawi(q.id,r)}</label>)}</div></div>)}</div><Button onClick={()=>setPickerOpen(false)}>التالي — {choices.length} مختارة</Button></DialogContent></Dialog>
   {choices.some(c=>!c.rawi)&&<div className="rounded-md border p-3 space-y-3"><label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={separateRiwayat} onCheckedChange={v=>{setSeparateRiwayat(v===true);if(v===true){const selected=choices.find(c=>!c.rawi);const q=QURRA.find(q=>q.id===selected?.qariId);if(q){setRiwayahTexts(prev=>Object.fromEntries(q.rawis.map(r=>[r,prev[r]??personal])));}}}}/>إدخال أسانيد مختلفة لبعض روايات هذه القراءة</label>
   {separateRiwayat&&choices.filter(c=>!c.rawi).map(choice=>{const imam=QURRA.find(q=>q.id===choice.qariId);return imam?<div key={choice.qariId} className="space-y-3">{imam.rawis.map(r=><div key={r} className="rounded border p-3 space-y-2"><label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(enabledRiwayat[r])} onCheckedChange={v=>{setEnabledRiwayat(prev=>({...prev,[r]:v===true}));if(v===true)setRiwayahTexts(prev=>({...prev,[r]:prev[r]??personal}));}}/>سند مستقل لرواية {displayRawi(imam.id,r)}</label>{enabledRiwayat[r]&&<Textarea dir="rtl" rows={5} value={riwayahTexts[r]||''} onChange={e=>setRiwayahTexts(prev=>({...prev,[r]:e.target.value}))} placeholder={`سند رواية ${displayRawi(imam.id,r)} إلى نقطة الالتقاء`}/>}</div>)}</div>:null;})}
   </div>}
   <label className="block space-y-1"><span className="font-medium">ينتهي سندي الشخصي عند</span><select value={junction} onChange={e=>{setJunction(e.target.value as 'ubaydi'|'jazari');}} className="w-full rounded-md border bg-background p-2"><option value="ubaydi">إبراهيم العُبيدي</option><option value="jazari">الإمام ابن الجزري</option></select></label>
   <div className="space-y-2 rounded-lg border p-3"><label className="font-semibold">السند الشخصي</label><p className="text-xs text-muted-foreground">ابدأ بعبارة «كما أخذته عن» حتى نقطة الالتقاء المختارة. يظل تنسيق الطباعة محفوظا في إعدادات الإجازة.</p><Textarea rows={8} dir="rtl" value={personal} onChange={e=>setPersonal(e.target.value)} placeholder="كما أخذته عن الشيخ..." style={{fontFamily:"'KSA Regular',serif"}}/><div className="rounded-lg bg-muted/30 p-3 text-sm"><strong>المقطع الذي يلي سندك</strong><div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line">{afterBody||'اختر القراءة ونقطة الاتصال لعرض المقطع التالي.'}</div></div></div>
   {sanadPreview.length>0&&<div className="rounded-md border p-3 space-y-3"><strong className="text-sm">معاينة السند المركّب لكل رواية من هذه القراءة</strong>{sanadPreview.map(item=><details key={item.rawi} className="rounded border p-2"><summary className="cursor-pointer text-sm font-semibold">رواية {displayRawi(selectedImam!.id,item.rawi)} {item.missing.length?'— مقاطع ناقصة':'— السند جاهز للتركيب'}</summary>{item.missing.length?<p className="text-xs text-destructive mt-2">مقاطع مفقودة: {item.missing.join('، ')}</p>:<div className="max-h-52 overflow-auto mt-2 whitespace-pre-line text-sm leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{item.chain}</div>}</details>)}</div>}
   <div className="grid gap-3 md:grid-cols-2"><label className="space-y-1"><span className="font-medium">المقدمة الثابتة</span><select className="w-full rounded-md border bg-background p-2" value={introductionId} onChange={e=>setIntroductionId(e.target.value)}><option value="">بدون مقدمة</option>{sections.filter(v=>v.sectionType==='introduction').map(v=><option key={v.id} value={v.id}>{v.title}</option>)}</select></label><label className="space-y-1"><span className="font-medium">كلمات الإجازة</span><select className="w-full rounded-md border bg-background p-2" value={wordingId} onChange={e=>setWordingId(e.target.value)}><option value="">بدون كلمات إجازة</option>{sections.filter(v=>v.sectionType==='wording').map(v=><option key={v.id} value={v.id}>{v.title}</option>)}</select><div className="flex flex-wrap gap-2 pt-2"><Button size="sm" type="button" variant="outline" onClick={()=>setShowWordingPreview(v=>!v)}><Eye className="h-4 w-4 me-1"/>معاينة كلمات الإجازة</Button><Button size="sm" type="button" variant="outline" onClick={()=>setCreatingWording(v=>!v)}><Plus className="h-4 w-4 me-1"/>إضافة كلمات إجازة جديدة</Button></div></label></div>
   {showWordingPreview&&<div className="rounded border p-3 space-y-2"><strong>معاينة كلمات الإجازة</strong><div className="max-h-64 overflow-auto rounded bg-muted/20 p-3 whitespace-pre-line leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{selectedWording?.body?.replaceAll('{{القراءة/الرواية}}',vocalizeReadingLabel([reading,route].filter(Boolean).join(' '))).replaceAll('mujeez','[اسم المُجيز]').replaceAll('mujaaz','[اسم المُجاز]')||'اختر كلمات الإجازة أولًا.'}</div></div>}
   {creatingWording&&<div className="rounded border p-3 space-y-3"><p className="font-semibold">إضافة كلمات إجازة خاصة بي</p><p className="text-xs text-muted-foreground">اكتب من «أما بعد فيقول» إلى ما قبل «كما أخذته». لا تضع سندك الشخصي هنا. سيُحفظ النص لحسابك فقط. استخدم mujeez وmujaaz و{'{{القراءة/الرواية}}'} لإدراج بيانات الشهادة تلقائيًا.</p><Input value={wordingTitle} onChange={e=>setWordingTitle(e.target.value)} placeholder="عنوان كلمات الإجازة"/><Textarea rows={6} value={wordingBody} onChange={e=>setWordingBody(e.target.value)} placeholder="أما بعد فيقول راجي عفو ربه الكريم mujeez ... (توقف قبل كما أخذته)"/><div className="space-y-1"><span className="text-sm font-medium">معاينة النص الجديد قبل الحفظ</span><div className="max-h-56 overflow-auto whitespace-pre-line rounded-md border bg-muted/20 p-3 text-right leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{wordingBody.trim()?wordingBody.replaceAll('{{القراءة/الرواية}}',vocalizeReadingLabel([reading,route].filter(Boolean).join(' '))).replaceAll('mujeez','[اسم المُجيز]').replaceAll('mujaaz','[اسم المُجاز]'):'اكتب الكلمات لمعاينتها هنا.'}</div></div><div className="flex gap-2"><Button disabled={busy||wordingTitle.trim().length<2||wordingBody.trim().length<10} onClick={addWording}>حفظ كلمات الإجازة</Button><Button variant="outline" onClick={()=>setCreatingWording(false)}>إلغاء</Button></div></div>}
   <div className="flex gap-2"><Button disabled={busy} onClick={save}>حفظ الإجازات</Button><Button variant="outline" onClick={reset} disabled={busy}>إلغاء</Button></div>
  </>}</div></DialogContent></Dialog>
  {holdings.length===0&&!editing&&<p className="rounded-lg border p-8 text-center text-muted-foreground">لا توجد إجازات محفوظة بعد. اضغط «إضافة إجازة» واختر القراءة وسندك الشخصي.</p>}
  <div className="grid gap-3 md:grid-cols-2">{sortedHoldings.map(h=><Card key={h.id}><CardContent className="flex items-center justify-between gap-3 p-4" dir="rtl"><div className="min-w-0"><strong className="text-lg">{(()=>{const q=QURRA.find(q=>q.id===h.qariId);return q?(h.rawi?`رواية ${displayRawi(q.id,h.rawi)} عن ${q.imam}`:`قراءة ${q.reading}`):h.name;})()}</strong><p className="text-sm text-muted-foreground">{h.junction==='jazari'?'إلى ابن الجزري':'إلى العُبيدي'}{!h.rawi?' · للروايتين':''}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" title="تعديل" aria-label={`تعديل ${h.name}`} onClick={()=>start(h)}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" title="حذف" aria-label={`حذف ${h.name}`} disabled={busy} onClick={()=>remove(h)}><Trash2 className="h-4 w-4 text-red-600"/></Button></div></CardContent></Card>)}</div>
 </div>;
}
