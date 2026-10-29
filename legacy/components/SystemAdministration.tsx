import {useEffect,useState} from 'react';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@project/components/ui/dialog';
import {toast} from 'sonner';
import {matchesArabic} from '../lib/arabicSearch';
import {arabicDigits} from '../lib/arabicDigits';
import UsersManager from './UsersManager';
import {WorkspaceAccounts,type WorkspaceDirectory,type WorkspacePerson} from './WorkspaceNavigation';
type Student={id:string;name:string;accountId:string;certificates:number;published:number};
export default function SystemAdministration({directory,onUpdated,onInspect}:{directory:WorkspaceDirectory;onUpdated:()=>void;onInspect:(person:WorkspacePerson)=>void}){
 const [tab,setTab]=useState('users'),[students,setStudents]=useState<Student[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState('');
 const [editing,setEditing]=useState<Student|null>(null),[accountId,setAccountId]=useState(''),[saving,setSaving]=useState(false);
 const load=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/student-links');const d=await r.json();if(!r.ok)throw Error(d.error);setStudents(d.students);}catch(e){setError(e instanceof Error?e.message:'تعذر التحميل');}finally{setLoading(false);}};
 useEffect(()=>{if(tab==='students')void load();},[tab]);
 const save=async()=>{if(!editing)return;setSaving(true);try{const r=await fetch('/api/student-links',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({studentId:editing.id,accountId})});const d=await r.json();if(!r.ok)throw Error(d.error);setEditing(null);await load();onUpdated();toast.success('تم تحديث ربط الطالب بالحساب');}catch(e){toast.error(e instanceof Error?e.message:'تعذر الحفظ');}finally{setSaving(false);}};
 return <div className="space-y-4" dir="rtl"><h2 className="text-xl font-bold">إدارة النظام</h2><div role="group" aria-label="أقسام إدارة النظام" className="flex flex-wrap gap-2">{[['users','المستخدمون'],['issuers','المجيزون'],['students','الطلاب']].map(([key,label])=><Button key={key} aria-pressed={tab===key} variant={tab===key?'default':'outline'} onClick={()=>setTab(key)}>{label}</Button>)}</div>
 {tab==='users'&&<UsersManager/>}
 {tab==='issuers'&&<><div className="grid gap-3 sm:grid-cols-2">{directory.issuers.map(i=><article key={i.id} className="rounded-xl border bg-card p-4"><strong>{i.name}</strong><p className="text-sm text-muted-foreground">رقم المجيز: {arabicDigits(i.number||'')}</p></article>)}</div><WorkspaceAccounts directory={{...directory,accounts:directory.accounts.filter(a=>a.personalIssuerId||a.role!=='student')}} onUpdated={onUpdated} onInspect={onInspect}/></>}
 {tab==='students'&&<><p className="text-sm text-muted-foreground">اربط اسم الطالب بحساب دخوله لعرض شهاداته المنشورة في «شهاداتي». يشمل ذلك المدير والشيخ والطالب؛ لا يتغير اسم المجيز أو دور الحساب أو نص الشهادة.</p><Input aria-label="بحث الطلاب للربط" value={query} onChange={e=>setQuery(e.target.value)} placeholder="اسم الطالب…"/>{loading?<p role="status">جارٍ تحميل الطلاب…</p>:error?<div role="alert"><p>{error}</p><Button onClick={load}>إعادة المحاولة</Button></div>:<div className="grid gap-3 sm:grid-cols-2">{students.filter(s=>matchesArabic(s.name,query)).map(s=><article key={s.id} className="rounded-xl border bg-card p-4 space-y-2"><strong>{s.name}</strong><p className="text-sm">{arabicDigits(s.certificates)} شهادة · {arabicDigits(s.published)} منشورة</p><p className="text-sm text-muted-foreground">{directory.accounts.find(a=>a.id===s.accountId)?.name||'غير مرتبط بحساب'}</p><Button variant="outline" onClick={()=>{setEditing(s);setAccountId(s.accountId);}}>ربط بحساب</Button></article>)}</div>}{!loading&&!error&&!students.filter(s=>matchesArabic(s.name,query)).length&&<p role="status">لا توجد أسماء مطابقة.</p>}</>}
 <Dialog open={!!editing} onOpenChange={v=>{if(!v&&!saving)setEditing(null);}}><DialogContent dir="rtl"><DialogHeader><DialogTitle>ربط الطالب بحساب — {editing?.name}</DialogTitle></DialogHeader><label>حساب الشخص<select className="w-full rounded border bg-background p-2" value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">بدون ربط</option>{directory.accounts.map(a=><option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}</select></label><p className="text-sm">سيستطيع الحساب المحدد قراءة شهادات هذا الطالب المنشورة. راجع الاسم والبريد قبل الحفظ.</p><Button disabled={saving} onClick={save}>حفظ الربط</Button></DialogContent></Dialog>
 </div>;
}
