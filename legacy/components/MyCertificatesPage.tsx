import {receivedSanad,type ReceivedSanadOutputType} from '../lib/api';
import {Textarea} from '@project/components/ui/textarea';
import {toast} from 'sonner';
import RegistrationNumber from './RegistrationNumber';
import {matchesArabic} from '../lib/arabicSearch';
import {useEffect,useState} from 'react';
import {myCertificates,type MyCertificatesOutputType} from '../lib/api';
import {Button} from '@project/components/ui/button';
import {Card,CardContent} from '@project/components/ui/card';
import {Printer} from 'lucide-react';
import {certificateSummary} from '../lib/certificateSummary';
import {arDate} from '../lib/date';
import CertificateRecordMenu from './CertificateRecordMenu';
import {Dialog,DialogContent,DialogTitle} from '@project/components/ui/dialog';
type Cert=MyCertificatesOutputType['certificates'][number];
export default function MyCertificatesPage({onPrint,onImported}:{onPrint:(c:Cert)=>void;onImported?:()=>void}){
 const [canBuild,setCanBuild]=useState(false),[imported,setImported]=useState<string[]>([]),[importing,setImporting]=useState(''),[candidate,setCandidate]=useState<(ReceivedSanadOutputType&{certificateId:string})|null>(null),[chain,setChain]=useState('');
 const review=async(c:Cert)=>{setImporting(c.id);try{const r=await receivedSanad({action:'preview',certificateId:c.id});setCandidate({...r,certificateId:c.id});setChain(r.personalChain);}catch(e){toast.error(e instanceof Error?e.message:'تعذر إعداد السند');}finally{setImporting('');}};
 const saveCopy=async()=>{if(!candidate)return;setImporting(candidate.certificateId);try{await receivedSanad({action:'save',certificateId:candidate.certificateId,personalChain:chain,confirmed:true});setImported(v=>[...v,candidate.certificateId]);setCandidate(null);onImported?.();toast.success('حُفظت نسخة قابلة للتعديل في أسانيدي');}catch(e){toast.error(e instanceof Error?e.message:'تعذر الحفظ');}finally{setImporting('');}};
 const [attempt,setAttempt]=useState(0);
 const [search,setSearch]=useState(''),[page,setPage]=useState(0);
 const [rows,setRows]=useState<Cert[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [details,setDetails]=useState<Cert|null>(null);
 useEffect(()=>{let mounted=true;setLoading(true);setError('');myCertificates({}).then(r=>{if(mounted){setRows(r.certificates);setCanBuild(r.canBuildSanad);setImported(r.importedCertificateIds);}}).catch(()=>{if(mounted)setError('تعذر تحميل الشهادات')}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false};},[attempt]);
 return <div className="space-y-4" dir="rtl">
  <h2 className="text-xl font-bold">شهاداتي</h2>
  <p className="text-sm text-muted-foreground">الشهادات النهائية التي نشرها الشيخ وربطها بحسابك. المسودات لا تظهر هنا. أسانيدي هي أسانيدك القابلة للتعديل والتعليم؛ يمكنك إنشاء نسخة منها من شهادة مستلمة بعد مراجعتها.</p>
  <input className="w-full rounded-md border bg-background p-3" aria-label="بحث شهاداتي" placeholder="رقم الشهادة أو المجيز أو القراءة…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
  {loading&&<p>جارٍ التحميل…</p>}{error&&<div role="alert"><p className="text-destructive">{error}</p><Button variant="outline" onClick={()=>setAttempt(v=>v+1)}>إعادة المحاولة</Button></div>}
  {!loading&&!rows.length&&!error&&<p className="rounded border p-5 text-muted-foreground">لم تُنشر شهادة مرتبطة بحسابك بعد.</p>}
  <div className="grid gap-3 md:grid-cols-2">{rows.filter(c=>matchesArabic([c.registrationNumber,c.shaykhName,c.qiraahName].join(' '),search)).slice(0,(page+1)*12).map(c=>{
   return <Card key={c.id}><CardContent className="p-3 space-y-1">
     <div className="certificate-card-title"><h3>{c.studentName}</h3><span className="certificate-status">نهائية</span></div>
     <p className="certificate-card-summary">{certificateSummary(c.qiraahName,c.qariId,c.rawi)}</p>
     <div className="certificate-card-meta"><RegistrationNumber value={c.registrationNumber||c.certificateNumber}/><time dateTime={c.completionDate}>{arDate(c.completionDate)}</time></div>
     <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={()=>onPrint(c)}><Printer className="size-4 ml-2"/> عرض الشهادة</Button><CertificateRecordMenu name={c.studentName} onDetails={()=>setDetails(c)}/></div>
     {canBuild&&<Button size="sm" variant="outline" disabled={!!importing||imported.includes(c.id)} onClick={()=>review(c)}>{imported.includes(c.id)?'مضافة إلى أسانيدي':importing===c.id?'جارٍ إعداد السند…':'استخدام في أسانيدي'}</Button>}
   </CardContent></Card>;
  })}</div>{rows.filter(c=>matchesArabic([c.registrationNumber,c.shaykhName,c.qiraahName].join(' '),search)).length>(page+1)*12&&<Button variant="outline" onClick={()=>setPage(p=>p+1)}>عرض المزيد</Button>}
  <Dialog open={!!candidate} onOpenChange={v=>{if(!v&&!importing)setCandidate(null);}}><DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogTitle>مراجعة السند المنقول إلى أسانيدي</DialogTitle><p>المجيز: {candidate?.teacherName}</p><p className="text-sm text-muted-foreground">تُضاف عبارة «كما أخذته عن الشيخ» واسم مُجيزك قبل بقية سنده. راجع النص قبل الحفظ. الشهادة المستلمة تبقى محفوظة كما هي، وهذه نسخة شخصية قابلة للتعديل.</p><Textarea aria-label="السند المنقول" dir="rtl" rows={12} value={chain} onChange={e=>setChain(e.target.value)}/><Button disabled={!!importing||chain.trim().length<100} onClick={saveCopy}>تأكيد وحفظ في أسانيدي</Button></DialogContent></Dialog>
  <Dialog open={!!details} onOpenChange={open=>{if(!open)setDetails(null);}}><DialogContent dir="rtl"><DialogTitle>تفاصيل الشهادة</DialogTitle>{details&&<div className="space-y-3"><strong>{details.studentName}</strong><p>المجيز: {details.shaykhName}</p><p>{details.qiraahName}</p><RegistrationNumber value={details.registrationNumber||details.certificateNumber}/><p>{arDate(details.completionDate)}</p><Button onClick={()=>{const c=details;setDetails(null);onPrint(c);}}>عرض الشهادة كاملة</Button></div>}</DialogContent></Dialog>
 </div>;
}
