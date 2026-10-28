import RegistrationNumber from './RegistrationNumber';
import {useEffect,useState} from 'react';
import {myCertificates,type MyCertificatesOutputType} from '../lib/api';
import {Button} from '@project/components/ui/button';
import {Card,CardContent} from '@project/components/ui/card';
import {Eye,Printer} from 'lucide-react';
import {readingColumns} from '../lib/readingColumns';
type Cert=MyCertificatesOutputType['certificates'][number];
export default function MyCertificatesPage({onPrint}:{onPrint:(c:Cert)=>void}){
 const [attempt,setAttempt]=useState(0);
 const [rows,setRows]=useState<Cert[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let mounted=true;setLoading(true);setError('');myCertificates({}).then(r=>{if(mounted)setRows(r.certificates)}).catch(()=>{if(mounted)setError('تعذر تحميل الشهادات')}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false};},[attempt]);
 return <div className="space-y-4" dir="rtl">
  <h2 className="text-xl font-bold">شهاداتي</h2>
  <p className="text-sm text-muted-foreground">الشهادات النهائية التي نشرها الشيخ وربطها بحسابك. المسودات لا تظهر هنا.</p>
  {loading&&<p>جارٍ التحميل…</p>}{error&&<div role="alert"><p className="text-destructive">{error}</p><Button variant="outline" onClick={()=>setAttempt(v=>v+1)}>إعادة المحاولة</Button></div>}
  {!loading&&!rows.length&&!error&&<p className="rounded border p-5 text-muted-foreground">لم تُنشر شهادة مرتبطة بحسابك بعد.</p>}
  <div className="grid gap-3 md:grid-cols-2">{rows.map(c=>{
   const names=readingColumns(c.qiraahName);
   return <Card key={c.id}><CardContent className="p-4 space-y-2">
     <div className="font-semibold">الشهادة رقم <RegistrationNumber value={c.registrationNumber||c.certificateNumber}/></div>
     <p>المُجيز: {c.shaykhName}</p>
     <p className="text-sm">الرواية: {names.riwayah} · القراءة: {names.qiraah}</p>
     {names.tareeq&&<p className="text-sm">الطريق: {names.tareeq}</p>}
     <Button variant="outline" onClick={()=>onPrint(c)}><Printer className="size-4 ml-2"/> عرض الشهادة وطباعتها</Button>
   </CardContent></Card>;
  })}</div>
 </div>;
}
