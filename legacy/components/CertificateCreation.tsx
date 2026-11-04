import {BookOpen,ScrollText} from 'lucide-react';
import {useEffect,useState} from 'react';
import {additionalShaykhs,matnCertificates,studentDirectory,type MatnCertificatesOutputType} from '../lib/api';
import type {Cert,Data} from '../App';
import {isMatnHeading} from '../lib/matnCertificate';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter} from '@project/components/ui/dialog';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {Label} from '@project/components/ui/label';
import {Textarea} from '@project/components/ui/textarea';
import {DatePicker} from '@project/components/ui/date-picker';
import {fromIso,toIso} from '../lib/date';
import {certificateDate,hijriOffsetChoices} from '../lib/certificateDates';
import CertificateForm from './CertificateForm';
import {toast} from 'sonner';
type Props={data:Data;currentUserId:string;cert:Cert|null;onClose:()=>void;onSaved:()=>void};
export default function CertificateCreation({data,currentUserId,cert,onClose,onSaved}:Props){
 const [section,setSection]=useState<'quran'|'matn'|null>(null),[issuer,setIssuer]=useState(''),[chosen,setChosen]=useState(false);
 const [guests,setGuests]=useState<{id:string;name:string}[]>([]),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!data.isAdmin)return;let active=true;setError('');additionalShaykhs({action:'list'}).then(r=>{if(active)setGuests(r.sheikhs);}).catch(()=>{if(active)setError('تعذر تحميل المشايخ الإضافيين');});return()=>{active=false;};},[data.isAdmin,attempt]);
 const personal=data.isAdmin?data.shaykhs:data.shaykhs.filter(s=>s.id===currentUserId);
 const issuers=[...personal.map(s=>({key:'user:'+s.id,name:s.name})),...guests.map(s=>({key:'guest:'+s.id,name:s.name}))];
 if(!issuers.some(s=>s.key==='user:'+currentUserId)&&!data.isAdmin)issuers.push({key:'user:'+currentUserId,name:'إجازاتي'});
 if(cert){
  if(isMatnHeading(cert.snapshotHeading||cert.qiraahName))return <MatnCertificateForm cert={cert} issuerKey={cert.additionalShaykh?'guest:'+cert.additionalShaykh:'user:'+cert.shaykhId} issuerName={cert.shaykhName} onClose={onClose} onSaved={onSaved}/>;
  return <CertificateForm cert={cert} asaneed={data.asaneed} shaykhs={data.shaykhs} isAdmin={data.isAdmin} currentUserId={currentUserId} onClose={onClose} onSaved={onSaved}/>;
 }
 if(chosen&&section==='quran')return <CertificateForm selectedIssuer={issuer} fixedIssuer onBack={()=>setChosen(false)} cert={null} asaneed={data.asaneed} shaykhs={data.shaykhs} isAdmin={data.isAdmin} currentUserId={currentUserId} onClose={onClose} onSaved={onSaved}/>;
 if(chosen&&section==='matn')return <MatnCertificateForm issuerKey={issuer} issuerName={issuers.find(i=>i.key===issuer)?.name||''} onBack={()=>setChosen(false)} onClose={onClose} onSaved={onSaved}/>;
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent dir="rtl"><DialogHeader><DialogTitle>إضافة شهادة</DialogTitle></DialogHeader>
  {!section?<div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" className="workspace-action-card h-24 text-lg" onClick={()=>setSection('quran')}><span className="workspace-card-icon" aria-hidden="true"><BookOpen/></span>قسم القراءات</Button><Button variant="outline" className="workspace-action-card h-24 text-lg" onClick={()=>setSection('matn')}><span className="workspace-card-icon" aria-hidden="true"><ScrollText/></span>قسم المتون</Button></div>:<div className="space-y-3"><p className="font-semibold">{section==='quran'?'قسم القراءات':'قسم المتون'}</p><Label htmlFor="creation-issuer">المُجيز</Label><select id="creation-issuer" className="w-full rounded-md border bg-background p-2" value={issuer} onChange={e=>setIssuer(e.target.value)}><option value="">اختر المُجيز</option>{issuers.map(i=><option key={i.key} value={i.key}>{i.name}</option>)}</select>{error&&<p role="alert">{error} <Button variant="outline" size="sm" onClick={()=>setAttempt(n=>n+1)}>إعادة المحاولة</Button></p>}<DialogFooter><Button variant="outline" onClick={()=>{setSection(null);setIssuer('');}}>رجوع</Button><Button disabled={!issuer} onClick={()=>setChosen(true)}>عرض الإجازات المتاحة</Button></DialogFooter></div>}
 </DialogContent></Dialog>;
}
function MatnCertificateForm({issuerKey,issuerName,cert,onBack,onClose,onSaved}:{issuerKey:string;issuerName:string;cert?:Cert;onBack?:()=>void;onClose:()=>void;onSaved:()=>void}){
 const [options,setOptions]=useState<MatnCertificatesOutputType['options']>([]),[students,setStudents]=useState<string[]>([]),[matnId,setMatnId]=useState('');
 const [student,setStudent]=useState(cert?.studentName||''),[newStudent,setNewStudent]=useState(false),[date,setDate]=useState(cert?.completionDate||''),[offset,setOffset]=useState(cert?.hijriDayOffset||0),[notes,setNotes]=useState(cert?.notes||'');
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[saving,setSaving]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');Promise.all([matnCertificates({action:'options',issuerKey}),studentDirectory({})]).then(([r,s])=>{if(active){setOptions(r.options);setStudents(s.students);}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'تعذر تحميل الإجازات');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[issuerKey,attempt]);
 async function save(){if(saving)return;setSaving(true);try{await matnCertificates({action:'save',issuerKey,matnId:cert?undefined:matnId,id:cert?.id,studentName:student,completionDate:date,hijriDayOffset:offset,notes});toast.success('تم حفظ مسودة شهادة المتن');onSaved();}catch(e){setError(e instanceof Error?e.message:'تعذر حفظ الشهادة');}finally{setSaving(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent dir="rtl"><DialogHeader><DialogTitle>{cert?'تعديل شهادة المتن':'إضافة شهادة — قسم المتون'}</DialogTitle></DialogHeader><div className="space-y-4"><p className="rounded-md border p-3">المُجيز: <strong>{issuerName}</strong></p>
  {loading?<p role="status">جارٍ تحميل متون المُجيز…</p>:cert?<p>{cert.qiraahName}</p>:<div className="space-y-2"><Label htmlFor="certificate-matn">المتون المتاحة</Label><select id="certificate-matn" className="w-full rounded-md border bg-background p-2" value={matnId} onChange={e=>setMatnId(e.target.value)}><option value="">اختر المتن</option>{options.map(m=><option key={m.id} value={m.id}>{m.name}{m.category?' — '+m.category:''}</option>)}</select>{!options.length&&!error&&<p className="text-sm text-muted-foreground">لا توجد إجازات متون محفوظة بسند لهذا المُجيز. أضفها من إجازاتي أو ملف الشيخ الإضافي أولًا.</p>}</div>}
  {(cert||matnId)&&<><div className="space-y-2"><Label htmlFor="matn-student">الطالب</Label>{!newStudent?<><select id="matn-student" className="w-full rounded-md border bg-background p-2" value={student} onChange={e=>setStudent(e.target.value)}><option value="">اختر الطالب</option>{[...new Set([...students,...(student?[student]:[])])].map(name=><option key={name} value={name}>{name}</option>)}</select><Button variant="outline" size="sm" onClick={()=>{setStudent('');setNewStudent(true);}}>إضافة طالب</Button></>:<><Input id="matn-student" autoFocus value={student} onChange={e=>setStudent(e.target.value)} placeholder="اسم الطالب الجديد"/><Button variant="ghost" size="sm" onClick={()=>{setStudent(cert?.studentName||'');setNewStudent(false);}}>اختيار طالب محفوظ</Button></>}</div><div className="space-y-2"><Label>تاريخ الإتمام</Label><DatePicker inlineCalendar value={fromIso(date)} onChange={d=>setDate(d?toIso(d):'')}/>{date&&<div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-2"><div className="flex items-center justify-between gap-2 text-sm"><span className="text-muted-foreground">التاريخ الهجري</span><strong dir="rtl" className="tabular-nums">{certificateDate(date,'islamic-umalqura',offset)} هـ</strong></div><div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">تعديل اليوم</span><div className="flex gap-1" dir="ltr">{hijriOffsetChoices.map(value=><Button key={value} type="button" size="sm" variant={offset===value?'default':'outline'} className="h-8 min-w-9 px-2 text-xs" onClick={()=>setOffset(value)}>{value>0?`+${value}`:String(value)}</Button>)}</div></div></div>}</div><div className="space-y-2"><Label htmlFor="matn-notes">ملاحظات (اختياري)</Label><Textarea id="matn-notes" value={notes} onChange={e=>setNotes(e.target.value)}/></div></>}
  {error&&<div role="alert" className="text-sm text-destructive">{error}<Button variant="outline" size="sm" onClick={()=>setAttempt(n=>n+1)}>إعادة المحاولة</Button></div>}
 </div><DialogFooter>{onBack&&<Button variant="outline" disabled={saving} onClick={onBack}>رجوع إلى المُجيز</Button>}<Button disabled={loading||saving||!student.trim()||!date||(!cert&&!matnId)} onClick={save}>{saving?'جارٍ الحفظ…':'حفظ المسودة'}</Button></DialogFooter></DialogContent></Dialog>;
}
