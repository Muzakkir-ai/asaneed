import RegistrationNumber from './RegistrationNumber';
import {useEffect,useState} from 'react';
import {verifyCertificate,type VerifyCertificateOutputType} from '../lib/api';
import {ShieldCheck,ShieldX} from 'lucide-react';

type Verification=VerifyCertificateOutputType;
export default function CertificateVerificationPage(){
 const token=decodeURIComponent(window.location.pathname.split('/verify/')[1]||'').split('/')[0];
 const [data,setData]=useState<Verification|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  let active=true;
  verifyCertificate({token}).then(r=>{if(active)setData(r);}).catch(()=>{if(active)setError(true);});
  return ()=>{active=false;};
 },[token]);
 const c=data?.certificate;
 return <main className="min-h-screen bg-[#f7f5f0] p-4 sm:p-9" dir="rtl">
  <section className="mx-auto max-w-xl rounded-xl border bg-white shadow-sm p-6 sm:p-9 space-y-5 text-right">
   <h1 className="text-2xl font-bold">التحقق من الشهادة</h1>
   {!data&&!error&&<p>جارٍ التحقق من شهادة الإجازة…</p>}
   {(error||data&&!data.verified)&&<div className="space-y-2 text-red-800"><ShieldX size={32}/>
    <h2 className="text-xl font-semibold">تعذر التحقق من الشهادة</h2>
    <p>لا توجد شهادة نهائية صادرة برمز التحقق هذا. راجع المُجيز أو الإدارة.</p>
   </div>}
   {c&&data?.verified&&<div className="space-y-4">
    <div className="flex items-center gap-3 text-[#146348]"><ShieldCheck size={32}/><h2 className="text-xl font-semibold">شهادة إجازة معتمدة</h2></div>
    <dl className="divide-y text-base">
     <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">رقم الشهادة</dt><dd><RegistrationNumber value={c.registrationNumber||c.certificateNumber}/></dd></div>
     <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">اسم المُجاز</dt><dd>{c.studentName}</dd></div>
     <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">اسم المُجيز</dt><dd>{c.issuerName}</dd></div>
     <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">الرواية والقراءة والطريق</dt><dd>{c.reading}</dd></div>
     <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">تاريخ الختم</dt><dd>{c.completionDate}</dd></div>
     <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">تاريخ الاعتماد</dt><dd>{new Date(c.publishedAt).toLocaleDateString('ar-SA')}</dd></div>
    </dl>
    <p className="text-sm text-muted-foreground">هذه الصفحة تؤكد تسجيل الشهادة في منصة الأسانيد والإجازات، ولا تُعدّ بديلًا عن الشهادة الأصلية.</p>
   </div>}
   <a href="/" className="inline-block underline text-sm">منصة الأسانيد والإجازات</a>
  </section>
 </main>;
}
