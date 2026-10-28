import {matchesArabic} from '../lib/arabicSearch';
import {QURRA,displayRawi} from '../lib/qurra';
import {arabicDigits} from '../lib/arabicDigits';
import RegistrationNumber from './RegistrationNumber';
import { useMemo, useState } from 'react';
import { deleteCertificate } from '../lib/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Card } from '@project/components/ui/card';
import { Skeleton } from '@project/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { Plus, Printer, Pencil, Trash2, Search, Eye, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Cert, Data } from '../App';
import CertificateForm from './CertificateForm';
import {readingColumns} from '../lib/readingColumns';
import { arDate } from '../lib/date';

const PAGE = 15;

export default function CertificatesView({ data, currentUserId, onChange, onPrint,loading=false,error='',onRetry }: { loading?:boolean;error?:string;onRetry?:()=>void; data: Data | null; currentUserId:string; onChange: () => void; onPrint: (c: Cert) => void }) {
  const [q, setQ] = useState('');
  const [selectedShaykh,setSelectedShaykh]=useState('all');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Cert | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Cert | null>(null);

  const [qari,setQari]=useState('all'),[rawi,setRawi]=useState('all'),[year,setYear]=useState('all'),[status,setStatus]=useState('all'),[sort,setSort]=useState('added');
  const years=[...new Set((data?.certificates||[]).map(c=>c.completionDate.slice(0,4)).filter(Boolean))].sort().reverse();
  const rows=useMemo(()=>{
    const result=(data?.certificates||[]).filter(c=>
      (selectedShaykh==='all'||c.issuerKey===selectedShaykh)&&
      (qari==='all'||c.qariId===qari)&&(rawi==='all'||c.qariId+'|'+c.rawi===rawi)&&
      (year==='all'||c.completionDate.startsWith(year+'-'))&&
      (status==='all'||c.publicationStatus===status)&&
      matchesArabic([c.studentName,c.qiraahName,c.shaykhName,c.registrationNumber,String(c.certificateNumber)].join(' '),q));
    return result.sort((a,b)=>sort==='name'?a.studentName.localeCompare(b.studentName,'ar'):sort==='completion'?b.completionDate.localeCompare(a.completionDate)||b.certificateNumber-a.certificateNumber:b.certificateNumber-a.certificateNumber);
  },[data,q,selectedShaykh,qari,rawi,year,status,sort]);
  const pages=Math.max(1,Math.ceil(rows.length/PAGE));
  const currentPage=Math.min(page,pages-1);
  const shown=rows.slice(currentPage*PAGE,currentPage*PAGE+PAGE);
  const resetFilters=()=>{setQ('');setSelectedShaykh('all');setQari('all');setRawi('all');setYear('all');setStatus('all');setSort('added');setPage(0);};
  const filtered=Boolean(q||selectedShaykh!=='all'||qari!=='all'||rawi!=='all'||year!=='all'||status!=='all');
  const remove = async () => {
    if (!toDelete) return;
    try { await deleteCertificate({ id: toDelete.id }); toast.success('تم الحذف'); onChange(); }
    catch { toast.error('تعذّر الحذف'); }
    setToDelete(null);
  };

  if(!data&&error)return <div role="alert" className="rounded-xl border p-6 space-y-3"><p>{error}</p><Button onClick={onRetry}>إعادة المحاولة</Button></div>;
  if(!data)return <div role="status" aria-label="جارٍ تحميل الشهادات"><p className="mb-3 text-sm">جارٍ تحميل الشهادات…</p><Skeleton className="h-64"/></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">

        <div className="relative sm:w-80">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pr-9" aria-label="بحث الشهادات" placeholder="اسم الطالب أو المُجيز أو رقم الشهادة" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="h-4 w-4 me-2" /> إضافة طالب
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
       <label className="text-sm space-y-1">المُجيز<select aria-label="تصفية حسب المُجيز" className="block w-full rounded-md border bg-background p-2" value={selectedShaykh} onChange={e=>{setSelectedShaykh(e.target.value);setPage(0);}}><option value="all">جميع المُجيزين</option>{data.issuers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
       <label className="text-sm space-y-1">القراءة<select aria-label="تصفية حسب القراءة" className="block w-full rounded-md border bg-background p-2" value={qari} onChange={e=>{setQari(e.target.value);setRawi('all');setPage(0);}}><option value="all">جميع القراءات</option>{QURRA.map(q=><option key={q.id} value={q.id}>{q.reading}</option>)}</select></label>
       <label className="text-sm space-y-1">الرواية<select aria-label="تصفية حسب الرواية" className="block w-full rounded-md border bg-background p-2" value={rawi} onChange={e=>{setRawi(e.target.value);setPage(0);}}><option value="all">جميع الروايات</option>{QURRA.filter(q=>qari==='all'||q.id===qari).flatMap(q=>q.rawis.map(r=><option key={q.id+'|'+r} value={q.id+'|'+r}>{displayRawi(q.id,r)} — {q.reading}</option>))}</select></label>
       <label className="text-sm space-y-1">سنة الإتمام<select aria-label="تصفية حسب السنة" className="block w-full rounded-md border bg-background p-2" value={year} onChange={e=>{setYear(e.target.value);setPage(0);}}><option value="all">جميع السنوات</option>{years.map(y=><option key={y} value={y}>{arabicDigits(y)}</option>)}</select></label>
       <label className="text-sm space-y-1">الحالة<select aria-label="تصفية حسب الحالة" className="block w-full rounded-md border bg-background p-2" value={status} onChange={e=>{setStatus(e.target.value);setPage(0);}}><option value="all">جميع الحالات</option><option value="draft">مسودة</option><option value="final">نهائية</option></select></label>
       <label className="text-sm space-y-1">الترتيب<select aria-label="ترتيب الشهادات" className="block w-full rounded-md border bg-background p-2" value={sort} onChange={e=>{setSort(e.target.value);setPage(0);}}><option value="added">الأحدث إضافة</option><option value="completion">الأحدث إتمامًا</option><option value="name">اسم الطالب</option></select></label>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm"><p role="status">{loading?'جارٍ تحديث الشهادات…':arabicDigits(rows.length)+' شهادة'}</p>{filtered&&<Button variant="ghost" size="sm" onClick={resetFilters}>مسح عوامل التصفية</Button>}</div>
      {error&&<div role="alert" className="rounded border p-3 text-sm"><p>{error}</p><Button variant="outline" size="sm" onClick={onRetry}>إعادة المحاولة</Button></div>}
      {data.asaneed.length===0&&<p className="text-sm text-muted-foreground">يمكنك اختيار إجازتك المحفوظة مباشرة عند إضافة الطالب؛ سيتم إعداد سندها تلقائيًا.</p>}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="text-right">رقم</TableHead>
              <TableHead className="text-right">اسم الطالب</TableHead>
              <TableHead className="text-right">المُجيز</TableHead>
              <TableHead className="text-right">الرواية</TableHead>
              <TableHead className="text-right">القراءة</TableHead>
              <TableHead className="text-right">الطريق</TableHead>
              <TableHead className="text-right">تاريخ الختم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">{filtered?'لا توجد شهادات تطابق البحث أو التصفية.':'لا توجد شهادات بعد. أضف طالبًا للبدء.'}</TableCell></TableRow>
            )}
            {shown.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-muted-foreground"><RegistrationNumber value={c.registrationNumber||c.certificateNumber}/></TableCell>
                <TableCell className="font-medium">{c.studentName}</TableCell>
                <TableCell>{c.shaykhName}</TableCell>
                <TableCell>{readingColumns(c.qiraahName).riwayah}</TableCell>
                <TableCell>{readingColumns(c.qiraahName).qiraah}</TableCell>
                <TableCell>{readingColumns(c.qiraahName).tareeq}</TableCell>
                <TableCell>{arDate(c.completionDate)}</TableCell>
                <TableCell className="text-xs">{c.publicationStatus==='draft'?<span className="text-muted-foreground">مسودة</span>:<span className="text-emerald-700">نهائية</span>}</TableCell>
                <TableCell>
                  <div className="flex flex-nowrap gap-1 justify-end whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => onPrint(c)}>{c.publicationStatus==='draft'?<><Eye className="h-4 w-4 me-1"/> معاينة</>:<><Printer className="h-4 w-4 me-1"/> طباعة</>}</Button>
                    {c.publicationStatus==='draft'&&<Button size="icon" variant="ghost" title="تعديل المسودة" aria-label="تعديل المسودة" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>}
                    <Button size="icon" variant="ghost" aria-label={'حذف شهادة '+c.studentName} onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>السابق</Button>
          <span>{arabicDigits(currentPage + 1)} / {arabicDigits(pages)}</span>
          <Button size="sm" variant="outline" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>التالي</Button>
        </div>
      )}
      {editing !== undefined && (
        <CertificateForm cert={editing} asaneed={data.asaneed} shaykhs={data.shaykhs} isAdmin={data.isAdmin} currentUserId={currentUserId} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); onChange(); }} />
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف الطالب؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف سجل «{toDelete?.studentName}» وشهادته نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
