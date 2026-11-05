import {compactRouteBook,builderCompactRouteName,type BuilderLibrary} from '../lib/bookBuilder';
import {workspaceHeaders} from '../lib/workspaceSelection';
import {certificateRouteBook as routeBook,certificateRouteDetail,guestRouteChoice,certificateRoutePhrase} from '../lib/certificateRouteChoice';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from '@project/components/ui/alert-dialog';
import {matchesArabic} from '../lib/arabicSearch';
import { useEffect,useState } from 'react';
import { z } from 'zod';
import { saveCertificate, prepareIjazah, issueQiraah, ijazahHoldings, studentDirectory, additionalShaykhs, type IjazahHoldingsOutputType, type StudentDirectoryOutputType, type AdditionalShaykhsOutputType } from '../lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { DatePicker } from '@project/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Loader2, ChevronDown, Plus, Search, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Cert, Data } from '../App';
import { fromIso, toIso } from '../lib/date';
import {certificateDate,hijriOffsetChoices} from '../lib/certificateDates';
import {QURRA,displayRawi,readingText,routeFor,shortQariName} from '../lib/qurra';
import {riwayahColors,type RiwayahColorsOutputType} from '../lib/api';
import {vocalizeReadingLabel} from '../lib/vocalizedReading';
import {CertificateHeadingPreview} from './CertificateHeading';
import {readingIdentityFromHeading} from '../lib/riwayahSvgHeading';
import {SelectGroup,SelectLabel,SelectSeparator} from '@project/components/ui/select';
import {canUsePersonalSanad} from '../lib/personalSanadValidation';

const schema = z.object({
  shaykhId:z.string().min(1,'اختر المُجيز'),
  studentName: z.string().trim().min(2, 'أدخل اسم الطالب'),
  completionDate: z.string().min(1, 'اختر تاريخ الختم'),
  sanadId: z.string().min(1, 'اختر القراءة'),
});

type Props = { fixedIssuer?:boolean;onBack?:()=>void;selectedIssuer?:string; cert: Cert | null; asaneed: Data['asaneed']; shaykhs:Data['shaykhs']; isAdmin:boolean; currentUserId:string; onClose: () => void; onSaved: () => void };

export default function CertificateForm({ fixedIssuer=false,onBack,selectedIssuer, cert, asaneed, shaykhs, isAdmin, currentUserId, onClose, onSaved }: Props) {
  const preferredPersonal=selectedIssuer?.startsWith('user:')?selectedIssuer.slice(5):'';
  const [form, setForm] = useState({
    studentName: cert?.studentName ?? '',
    completionDate: cert?.completionDate ?? '',
    hijriDayOffset:cert?.hijriDayOffset ?? 0,
    sanadId: cert?.sanadId ?? '',
    notes: cert?.notes ?? '',
    shaykhId:cert?.additionalShaykh ? 'guest:'+cert.additionalShaykh : cert?.shaykhId ?? (isAdmin?(shaykhs.some(s=>s.id===preferredPersonal)?preferredPersonal:shaykhs[0]?.id||''):currentUserId),
  });
  const [saving, setSaving] = useState(false);
  const [guestSheikhs,setGuestSheikhs]=useState<AdditionalShaykhsOutputType['sheikhs']>([]);
  const [guestError,setGuestError]=useState('');
  useEffect(()=>{
    if(!isAdmin)return;
    let active=true;
    additionalShaykhs({action:'list'}).then(r=>{if(active){setGuestSheikhs(r.sheikhs);const selected=r.sheikhs.find(s=>s.id===(selectedIssuer||'').replace(/^guest:/,''));if(!cert&&selected)setForm(p=>({...p,shaykhId:'guest:'+selected.id,sanadId:''}));}})
      .catch(()=>{if(active)setGuestError('تعذر تحميل المشايخ الإضافيين');});
    return()=>{active=false;};
  },[isAdmin,selectedIssuer]);
  const selectedGuestId=form.shaykhId.startsWith('guest:')?form.shaykhId.slice(6):'';
  const selectedGuest=guestSheikhs.find(g=>g.id===selectedGuestId);
  const isGuest=!!selectedGuestId;
  const [studentsLoading,setStudentsLoading]=useState(true),[studentsError,setStudentsError]=useState('');
  const [studentsAttempt,setStudentsAttempt]=useState(0);
  const [holdingsLoading,setHoldingsLoading]=useState(false),[holdingsError,setHoldingsError]=useState('');
  const [studentEntries,setStudentEntries]=useState<StudentDirectoryOutputType['entries']>([]);
  const [studentToDelete,setStudentToDelete]=useState<string|null>(null),[deletingStudent,setDeletingStudent]=useState(false);
  const [savedStudents,setSavedStudents] = useState<string[]>([]);
  const [studentListOpen,setStudentListOpen]=useState(false);
  const [studentSearch,setStudentSearch]=useState('');
  const [addingStudent,setAddingStudent]=useState(false);
  useEffect(()=>{let active=true;setStudentsLoading(true);setStudentsError('');
    studentDirectory({}).then(r=>{if(active){setSavedStudents(r.students);setStudentEntries(r.entries);}}).catch(e=>{if(active)setStudentsError(e instanceof Error?e.message:'تعذر تحميل الطلاب');}).finally(()=>{if(active)setStudentsLoading(false);});
    return()=>{active=false;};
  },[studentsAttempt]);
  const removeStudent=async()=>{
    if(!studentToDelete)return;
    setDeletingStudent(true);
    try{
      const result=await studentDirectory({action:'delete',name:studentToDelete});
      setSavedStudents(result.students);setStudentEntries(result.entries);
      if(matchesArabic(form.studentName,studentToDelete)&&matchesArabic(studentToDelete,form.studentName))setForm(prev=>({...prev,studentName:''}));
      setStudentToDelete(null);toast.success('حُذف الاسم من قائمة الطلاب المشتركة');
    }catch(error){toast.error(error instanceof Error?error.message:'تعذر حذف الطالب');}
    finally{setDeletingStudent(false);}
  };
  const [holdings,setHoldings]=useState<IjazahHoldingsOutputType['holdings']>([]);
  useEffect(()=>{let active=true;setHoldings([]);
    setHoldingsError('');
    if(!form.shaykhId||form.shaykhId.startsWith('guest:')){setHoldingsLoading(false);return()=>{active=false;};}
    setHoldingsLoading(true);
    ijazahHoldings({action:'list',ownerId:isAdmin?form.shaykhId:undefined}).then(r=>{if(active)setHoldings(r.holdings);}).catch(e=>{if(active)setHoldingsError(e instanceof Error?e.message:'تعذر تحميل الإجازات المحفوظة');}).finally(()=>{if(active)setHoldingsLoading(false);});
    return()=>{active=false;};},[form.shaykhId,isAdmin]);
  const availableAsaneed=asaneed.filter(s=>s.shaykhId===form.shaykhId);
  const [selectedTariq,setSelectedTariq]=useState('');
  const [selectedBook,setSelectedBook]=useState('');
  const [routeLibrary,setRouteLibrary]=useState<BuilderLibrary|null>(null);
  useEffect(()=>{let active=true;fetch('/api/book-builder',{headers:workspaceHeaders()}).then(async r=>{if(r.ok){const data=await r.json();if(active)setRouteLibrary(data);}}).catch(()=>{});return()=>{active=false;};},[]);
  const compactLabel=(number:string,name:string)=>{const route=routeLibrary?.chains.find(c=>c.route_code===number),book=routeLibrary?.books.find(b=>b.id===route?.book_id);return route&&book&&routeLibrary?builderCompactRouteName(book,route,routeLibrary.people):compactRouteBook(name);};
  const [readingScope,setReadingScope]=useState<''|'sughra'|'kubra'>('');
  const sughraBook=(name:string)=>/الشاطبية|الدرة/.test(routeBook(name).replace(/[\u064b-\u065f\u0670\u0640]/g,''));
  useEffect(()=>{setSelectedTariq('');setSelectedBook('');setReadingScope('');},[form.shaykhId]);
  const routeOptions=[...new Map((isGuest?selectedGuest?.routes||[]:holdings).filter(h=>h.tariqNumber).map(h=>[h.tariqNumber,h.tariqName])).entries()];
  const bookOptions=[...new Set(routeOptions.filter(([,name])=>!sughraBook(name)).map(([,name])=>routeBook(name)))];
  const baseRouteHoldings=holdings.filter(h=>readingScope==='kubra'?!!h.tariqNumber&&!sughraBook(h.tariqName)&&(!selectedBook||routeBook(h.tariqName)===selectedBook):readingScope==='sughra'?!h.tariqNumber||sughraBook(h.tariqName):!!cert);
  const routeHoldings=baseRouteHoldings.filter((h,_i,all)=>readingScope!=='sughra'||h.tariqNumber||!all.some(v=>v.tariqNumber&&v.qariId===h.qariId&&v.rawi===h.rawi&&(v.shortName||'')===(h.shortName||'')));
  const selectReading=(value:string)=>{setForm(v=>({...v,sanadId:value}));if(value.startsWith('guest-route:'))setSelectedTariq(guestRouteChoice(value)?.tariqNumber||'');else if(value.startsWith('holding:'))setSelectedTariq(holdings.find(h=>h.id===value.split(':')[1])?.tariqNumber||'');else setSelectedTariq('');};
  const eligibleHoldings=holdings.filter(h=>canUsePersonalSanad(h));
  const readingGroups=QURRA.map(q=>({
    q,
    narrators:q.rawis.map(rawi=>({
      rawi,
      holding:routeHoldings.find(h=>h.qariId===q.id&&h.rawi===rawi)||routeHoldings.find(h=>h.qariId===q.id&&!h.rawi),
    })),
  })).filter(group=>group.narrators.some(r=>r.holding));
  const choosingQiraah=!cert&&!isGuest&&form.sanadId.startsWith('qiraah:');
  const guestReadings=readingScope==='kubra'?(selectedGuest?.routes||[]).filter(r=>!sughraBook(r.tariqName)&&(!selectedBook||routeBook(r.tariqName)===selectedBook)):readingScope==='sughra'?selectedGuest?.readings||[]:[];
  const guestChoices=QURRA.map(q=>({q,rawis:q.rawis.filter(rawi=>guestReadings.some(r=>r.qariId===q.id&&r.rawi===rawi))})).filter(item=>item.rawis.length);
  const [headingPreviewOpen,setHeadingPreviewOpen]=useState(false),[previewColors,setPreviewColors]=useState<RiwayahColorsOutputType['entries']|null>(null),[previewColorError,setPreviewColorError]=useState(false);
  useEffect(()=>{if(!headingPreviewOpen||previewColors)return;let active=true;riwayahColors({action:'list'}).then(r=>{if(active){setPreviewColors(r.entries);setPreviewColorError(false);}}).catch(()=>{if(active)setPreviewColorError(true);});return()=>{active=false;};},[headingPreviewOpen,previewColors]);
  const previewChoices:{qariId:string;rawi:string;heading:string}[]=[];
  if(cert){const heading=cert.snapshotHeading||asaneed.find(s=>s.id===cert.sanadId)?.chain.match(/^【بيان القراءة:([^】]+)】/)?.[1]||cert.qiraahName;const identity=readingIdentityFromHeading(heading);previewChoices.push({qariId:identity?.qariId||'',rawi:identity?.rawi||'',heading:vocalizeReadingLabel(heading)});}
  else{
   const full=form.sanadId.startsWith('guest-qiraah:')||form.sanadId.startsWith('qiraah:');
   let qariId='',rawi='';
   if(full)qariId=form.sanadId.slice(form.sanadId.indexOf(':')+1);
   else if(form.sanadId.startsWith('guest-route:')){const choice=guestRouteChoice(form.sanadId);qariId=choice?.qariId||'';rawi=choice?.rawi||'';}
   else if(form.sanadId.startsWith('guest-reading:')){const parts=form.sanadId.split(':');qariId=parts[1];try{rawi=decodeURIComponent(parts.slice(2).join(':'));}catch{}}
   else if(form.sanadId.startsWith('holding:')){const [,holdingId,...parts]=form.sanadId.split(':');qariId=holdings.find(h=>h.id===holdingId)?.qariId||'';try{rawi=decodeURIComponent(parts.join(':'));}catch{}}
   const qari=QURRA.find(q=>q.id===qariId);if(qari)for(const r of full?qari.rawis:[rawi])if(qari.rawis.includes(r))previewChoices.push({qariId,rawi:r,heading:vocalizeReadingLabel(readingText({qariId,rawi:r})+' '+(selectedTariq?certificateRoutePhrase(routeOptions.find(([n])=>n===selectedTariq)?.[1]||''):routeFor([qariId])))});
  }

  const [touched, setTouched] = useState(false);
  const parsed = schema.safeParse(form);
  const errors = parsed.success ? {} : parsed.error.flatten().fieldErrors;
  const err = (k: keyof typeof errors) => touched && errors[k]?.[0] && <p className="text-sm text-destructive">{errors[k]?.[0]}</p>;

  const submit = async () => {
    setTouched(true);
    if (!parsed.success) return;
    setSaving(true);
    try {
      if(!cert&&isGuest){
        if(!selectedGuest)throw new Error('اختر شيخًا إضافيًا مسجلًا');
        const full=form.sanadId.startsWith('guest-qiraah:');
        if(!full&&!form.sanadId.startsWith('guest-reading:')&&!form.sanadId.startsWith('guest-route:'))throw new Error('اختر قراءة أو رواية لهذا الشيخ');
        const routeChoice=guestRouteChoice(form.sanadId);
        const parsedChoice=routeChoice?routeChoice.qariId+':'+encodeURIComponent(routeChoice.rawi):form.sanadId.slice(full?'guest-qiraah:'.length:'guest-reading:'.length);
        const split=parsedChoice.indexOf(':');
        const qariId=full?parsedChoice:parsedChoice.slice(0,split);
        const rawi=full?undefined:decodeURIComponent(parsedChoice.slice(split+1));
        await additionalShaykhs({action:'issue',tariqNumber:routeChoice?.tariqNumber||selectedTariq,id:selectedGuest.id,qariId,rawi,
          studentName:form.studentName,completionDate:form.completionDate,hijriDayOffset:form.hijriDayOffset,notes:form.notes});
        toast.success(full?'تم حفظ مسودتين للروايتين بتاريخ واحد':'تم إنشاء مسودة الشهادة باسم المُجيز المختار');
        onSaved();
        return;
      }
      if(!cert&&choosingQiraah){
        const qariId=form.sanadId.slice('qiraah:'.length);
        await issueQiraah({tariqNumber:selectedTariq,qariId,studentName:form.studentName,completionDate:form.completionDate,hijriDayOffset:form.hijriDayOffset,notes:form.notes,ownerId:form.shaykhId});
        toast.success('تم حفظ مسودتين للروايتين بتاريخ واحد');
        onSaved();
        return;
      }
      const selected=form.sanadId.startsWith('holding:')?form.sanadId.slice('holding:'.length):'';
      const [holdingId,rawiEncoded]=selected?selected.split(':'):['',''];
      const sanadId=selected
        ?(await prepareIjazah({holdingId,rawi:rawiEncoded?decodeURIComponent(rawiEncoded):undefined,ownerId:form.shaykhId})).sanadId
        :form.sanadId;
      await saveCertificate({ ...form, shaykhId:cert?.shaykhId??form.shaykhId, sanadId, id: cert?.id });
      toast.success('تم حفظ المسودة');
      onSaved();
    } catch(e) {
      toast.error(e instanceof Error?e.message:'تعذّر الحفظ، تحقق من اختيار السند');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="text-right">
        {onBack&&<Button variant="outline" size="sm" onClick={onBack}>رجوع إلى المُجيز</Button>}
        <DialogHeader className="text-right"><DialogTitle className="font-display text-2xl">{cert ? 'تعديل بيانات الشهادة' : 'إضافة شهادة'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {fixedIssuer&&!isAdmin&&<p className="rounded border p-3">المُجيز: {shaykhs.find(s=>s.id===form.shaykhId)?.name||'إجازاتي'}</p>}
          {isAdmin&&<div className="space-y-1.5">
            <Label>المُجيز (الشيخ صاحب الإجازة)</Label>
            <Select dir="rtl" disabled={!!cert||fixedIssuer} value={form.shaykhId} onValueChange={v=>setForm(prev=>({...prev,shaykhId:v,sanadId:''}))}>
              <SelectTrigger><SelectValue placeholder="اختر المُجيز" /></SelectTrigger>
              <SelectContent>
                <SelectGroup><SelectLabel>مشايخ لهم إجازات في حساباتهم</SelectLabel>
                  {shaykhs.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectGroup>
                {guestSheikhs.length>0&&<><SelectSeparator/><SelectGroup><SelectLabel>المشايخ الإضافيون</SelectLabel>
                  {guestSheikhs.map(s=><SelectItem key={s.id} value={'guest:'+s.id}>{s.name}</SelectItem>)}
                </SelectGroup></>}
              </SelectContent>
            </Select>
          </div>}
          {err('shaykhId')}
          {holdingsLoading&&<p role="status" className="text-sm">جارٍ تحميل إجازات المُجيز…</p>}
          {holdingsError&&<p role="alert" className="text-sm text-destructive">{holdingsError}</p>}
          {guestError&&<p className="text-sm text-destructive">{guestError}</p>}
          {isGuest&&!selectedGuest&&<p className="text-sm text-muted-foreground">جارٍ تحميل إجازات الشيخ المختار…</p>}
          <div className="space-y-1.5">
            {!cert&&<label className="block space-y-1">نوع الإجازة<select className="w-full rounded border bg-background p-2" value={readingScope} onChange={e=>{setReadingScope(e.target.value as typeof readingScope);setSelectedBook('');setSelectedTariq('');setForm(v=>({...v,sanadId:''}));}}><option value="">اختر العشر الصغرى أو الكبرى</option><option value="sughra">العشر الصغرى — الشاطبية والدرة</option><option value="kubra">العشر الكبرى</option></select></label>}
            {!cert&&readingScope==='kubra'&&bookOptions.length>0&&<label className="block space-y-1">الكتاب / الطريق<select className="w-full rounded border bg-background p-2" value={selectedBook} onChange={e=>{setSelectedBook(e.target.value);setSelectedTariq('');setForm(v=>({...v,sanadId:''}));}}><option value="">جميع كتب العشر الكبرى</option>{bookOptions.map(name=><option key={name} value={name}>{name}</option>)}</select></label>}
            <Label>القراءة أو الرواية</Label>
            <Select dir="rtl" disabled={!!cert||!readingScope} value={form.sanadId || undefined} onValueChange={selectReading}>
              <SelectTrigger><SelectValue placeholder="اختر من إجازاتك المحفوظة" /></SelectTrigger>
              <SelectContent className="max-h-[340px] min-w-[300px]" dir="rtl">
                {!cert&&isGuest&&guestChoices.map(({q,rawis})=><SelectGroup key={q.id}>
                  <SelectLabel className="text-xs text-muted-foreground text-right font-medium px-3 pt-3 pb-1">{shortQariName(q.id)}</SelectLabel>
                  {readingScope==='sughra'&&q.rawis.every(r=>rawis.includes(r))&&<SelectItem value={`guest-qiraah:${q.id}`} className="font-semibold">القراءة كاملة — شهادتان للروايتين</SelectItem>}
                  {readingScope==='kubra'?(selectedGuest?.routes||[]).filter(r=>r.qariId===q.id&&!sughraBook(r.tariqName)&&(!selectedBook||routeBook(r.tariqName)===selectedBook)).map(r=><SelectItem key={r.tariqNumber+'-'+r.rawi} value={`guest-route:${encodeURIComponent(r.tariqNumber)}:${q.id}:${encodeURIComponent(r.rawi)}`}>رواية {displayRawi(q.id,r.rawi)} من طريق {compactLabel(r.tariqNumber,r.tariqName)}</SelectItem>):rawis.map(rawi=>{const original=selectedGuest?.routes.find(r=>r.qariId===q.id&&r.rawi===rawi&&sughraBook(r.tariqName));return <SelectItem key={rawi} value={original?`guest-route:${encodeURIComponent(original.tariqNumber)}:${q.id}:${encodeURIComponent(rawi)}`:`guest-reading:${q.id}:${encodeURIComponent(rawi)}`}>رواية {displayRawi(q.id,rawi)}</SelectItem>})}
                  <SelectSeparator className="my-1"/>
                </SelectGroup>)}
                {!cert&&!isGuest&&readingGroups.map(({q,narrators})=>{
                  const choicesFor=(rawi:string)=>{const exact=routeHoldings.filter(h=>h.qariId===q.id&&h.rawi===rawi);return exact.length?exact:routeHoldings.filter(h=>h.qariId===q.id&&!h.rawi);};
                  const ambiguous=narrators.some(n=>choicesFor(n.rawi).length>1);
                  const valid=!ambiguous&&narrators.every(x=>x.holding&&canUsePersonalSanad(x.holding));
                  return <SelectGroup key={q.id}>
                    <SelectLabel className="text-xs text-muted-foreground text-right font-medium px-3 pt-3 pb-1">{shortQariName(q.id)}</SelectLabel>
                    {readingScope==='sughra'&&narrators.every(x=>x.holding)&&<SelectItem value={`qiraah:${q.id}`} disabled={!valid} className="font-semibold text-right py-2.5">
                      <span className="flex items-center gap-2"><span>القراءة كاملة</span><span className="text-xs font-normal text-muted-foreground">شهادتان · {q.rawis.map(r=>displayRawi(q.id,r)).join(' + ')}</span></span>
                    </SelectItem>}
                    {narrators.flatMap(({rawi})=>choicesFor(rawi).map(holding=><SelectItem key={holding.id+'-'+rawi} value={`holding:${holding!.id}:${encodeURIComponent(rawi)}`} disabled={!canUsePersonalSanad(holding!)} className="text-right py-2">
                      <span className="text-sm">رواية {displayRawi(q.id,rawi)}{readingScope==='kubra'?' من طريق '+compactLabel(holding.tariqNumber,holding.tariqName):''}{holding.shortName?' — '+holding.shortName:holding.sourceTeacherName?' — عن '+holding.sourceTeacherName:''}</span>
                    </SelectItem>))}
                    <SelectSeparator className="my-1"/>
                  </SelectGroup>;
                })}
                {cert&&<SelectItem value={cert.sanadId}>{availableAsaneed.find(s=>s.id===cert.sanadId)?.qiraahName||cert.qiraahName||'الرواية المحفوظة'}</SelectItem>}
              </SelectContent>
            </Select>
            {!cert&&readingScope&&!isGuest&&holdings.length>0&&eligibleHoldings.length===0&&<p className="text-sm text-destructive">أكمل السند إلى العُبيدي أو ابن الجزري.</p>}
            {!cert&&readingScope&&isGuest&&selectedGuest&&!guestError&&guestChoices.length===0&&<p className="text-sm text-destructive">لم تُضف لهذا الشيخ أي رواية. أضف الإجازات في تبويب المشايخ الإضافيين أولًا.</p>}
            {choosingQiraah&&<p className="text-xs text-muted-foreground">شهادتان مستقلتان بنفس تاريخ الختم</p>}
            {err('sanadId')}
          </div>
          {previewChoices.length>0&&<details className="rounded-lg border p-3" onToggle={e=>setHeadingPreviewOpen(e.currentTarget.open)}><summary className="cursor-pointer text-sm font-semibold">معاينة عنوان الإجازة قبل الحفظ</summary>{headingPreviewOpen&&<div className="space-y-3 mt-3">{previewChoices.length>1&&<p className="text-xs text-muted-foreground">القراءة كاملة: تُنشأ شهادتان مستقلتان، وهذه معاينة عنوان كل رواية.</p>}{previewColorError?<p role="alert" className="text-sm text-destructive">تعذر تحميل ألوان الروايات. أغلق المعاينة وافتحها لإعادة المحاولة.</p>:!previewColors?<p role="status">جارٍ تحميل المعاينة…</p>:previewChoices.map(choice=>{const colors=previewColors.find(c=>c.qariId===choice.qariId&&c.rawi===choice.rawi);return <div key={choice.heading} className="rounded border bg-white"><CertificateHeadingPreview heading={choice.heading} primary={colors?.primaryColor||'#926e35'} secondary={colors?.secondaryColor||'#075f69'}/></div>;})}</div>}</details>}
          <div className="space-y-1.5">
            <Label>اسم الطالب</Label>
            <div className="space-y-2">
              {!addingStudent&&<div className="relative">
                <button type="button" aria-expanded={studentListOpen} aria-label="اختر الطالب" onClick={()=>{setStudentListOpen(v=>!v);setStudentSearch('');}} className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-input bg-background px-3 text-right shadow-sm hover:bg-muted/40">
                  <span className={form.studentName?'min-w-0 truncate':'text-muted-foreground'}>{form.studentName||'اختر الطالب'}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground"/>
                </button>
                {studentListOpen&&<div className="mt-2 w-full overflow-hidden rounded-lg border bg-background shadow-sm">
                  {savedStudents.length>0&&<div className="relative border-b px-2 py-1"><Search className="absolute right-4 top-3.5 h-4 w-4 text-muted-foreground"/><Input className="border-0 pr-9 shadow-none focus-visible:ring-0" placeholder="ابحث عن طالب" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}/></div>}
                  {studentsLoading&&<p role="status" className="p-3 text-sm">جارٍ تحميل قائمة الطلاب المشتركة…</p>}
                  {studentsError&&<div role="alert" className="p-3 text-sm"><p>{studentsError}</p><Button variant="outline" size="sm" onClick={()=>setStudentsAttempt(v=>v+1)}>إعادة المحاولة</Button></div>}
                  <div className="max-h-44 overflow-y-auto p-1" role="listbox" aria-label="الطلاب المحفوظون">
                    {savedStudents.filter(name=>matchesArabic(name,studentSearch)).map(name=><div key={name} className="flex items-center gap-1">
                      <button type="button" role="option" aria-selected={form.studentName===name} onClick={()=>{setForm(prev=>({...prev,studentName:name}));setStudentListOpen(false);setTouched(false);}} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded px-3 py-2 text-right text-sm hover:bg-muted focus:bg-muted focus:outline-none"><span className="min-w-0 break-words">{name}</span>{form.studentName===name&&<Check className="h-4 w-4 shrink-0"/>}</button>
                      {isAdmin&&<Button type="button" size="icon" variant="ghost" disabled={!studentEntries.find(row=>row.name===name)?.canDelete} aria-label={'حذف الطالب '+name} title={studentEntries.find(row=>row.name===name)?.canDelete?'حذف الاسم من القائمة':'لدى الطالب إجازة محفوظة؛ لا يمكن حذف اسمه'} onClick={()=>setStudentToDelete(name)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                    </div>)}
                    {isAdmin&&savedStudents.length>0&&<p className="px-3 py-2 text-xs text-muted-foreground">حذف الاسم متاح فقط إذا لم توجد للطالب إجازة محفوظة.</p>}
                    {!studentsLoading&&!studentsError&&savedStudents.filter(name=>matchesArabic(name,studentSearch)).length===0&&<p className="px-3 py-3 text-center text-sm text-muted-foreground">لا يوجد طالب محفوظ</p>}
                  </div>
                  <div className="border-t p-1"><button type="button" onClick={()=>{setAddingStudent(true);setStudentListOpen(false);setForm(prev=>({...prev,studentName:''}));}} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-muted"><Plus className="h-4 w-4"/> إضافة طالب</button></div>
                </div>}
              </div>}
              {addingStudent&&<div className="flex gap-2"><Input autoFocus value={form.studentName} onChange={e=>setForm(prev=>({...prev,studentName:e.target.value}))} onBlur={()=>setTouched(true)} placeholder="اسم الطالب الجديد" className="min-w-0 flex-1"/><Button type="button" variant="outline" onClick={()=>{setAddingStudent(false);setStudentListOpen(true);setTouched(false);}}>رجوع</Button></div>}
            </div>
            {err('studentName')}
          </div>
          <div className="space-y-1.5">
            <Label>تاريخ الختم</Label>
            <DatePicker inlineCalendar value={fromIso(form.completionDate)} onChange={(d) => setForm({ ...form, completionDate: d ? toIso(d) : '' })} />
            {form.completionDate&&<div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">التاريخ الهجري</span>
                <strong dir="rtl" className="tabular-nums">{certificateDate(form.completionDate,'islamic-umalqura',form.hijriDayOffset)} هـ</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">تعديل اليوم</span>
                <div className="flex gap-1" dir="ltr">{hijriOffsetChoices.map(offset=><Button key={offset} type="button" size="sm" variant={form.hijriDayOffset===offset?'default':'outline'} className="h-8 min-w-9 px-2 text-xs" onClick={()=>setForm(prev=>({...prev,hijriDayOffset:offset}))}>{offset>0?`+${offset}`:String(offset)}</Button>)}</div>
              </div>
            </div>}
            {err('completionDate')}
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving || (touched && !parsed.success)}>
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />} {choosingQiraah?'حفظ مسودتين':'حفظ المسودة'}
          </Button>
        </DialogFooter>
        <AlertDialog open={!!studentToDelete} onOpenChange={open=>{if(!open&&!deletingStudent)setStudentToDelete(null);}}>
          <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف اسم الطالب؟</AlertDialogTitle><AlertDialogDescription>سيُحذف «{studentToDelete}» من قائمة الاختيار المشتركة لجميع المشايخ. لا تُحذف أي شهادة بهذه العملية.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deletingStudent}>إلغاء</AlertDialogCancel><AlertDialogAction disabled={deletingStudent} onClick={event=>{event.preventDefault();void removeStudent();}}>{deletingStudent?'جارٍ الحذف…':'حذف الاسم'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
