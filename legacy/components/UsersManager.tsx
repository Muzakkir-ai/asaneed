import {useEffect,useState} from 'react';
import {manageUsers} from '../lib/api';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@project/components/ui/dialog';
import {toast} from 'sonner';
type User={id:string;stableId:string;name:string;email:string;role:string;active:boolean;authUserId:string;legacyUserId:string};
type LegacyPerson={id:string;name:string;email:string};
export default function UsersManager(){
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [users,setUsers]=useState<User[]>([]),[people,setPeople]=useState<LegacyPerson[]>([]);
 const [edit,setEdit]=useState<User|null>(null),[saving,setSaving]=useState(false),[confirmed,setConfirmed]=useState(false);
 const refresh=()=>{setLoading(true);setError('');return manageUsers({action:'list'}).then(r=>{setUsers(r.users);setPeople(r.legacyProfiles);}).catch(e=>setError(e instanceof Error?e.message:'تعذر تحميل المستخدمين')).finally(()=>setLoading(false));};
 useEffect(()=>{void refresh();},[]);
 const previous=users.find(u=>u.id===edit?.id)?.legacyUserId??'';
 const changingLink=!!edit?.legacyUserId&&edit.legacyUserId!==previous;
 const selected=people.find(p=>p.id===edit?.legacyUserId);
 const save=async()=>{if(!edit||changingLink&&!confirmed)return;setSaving(true);try{await manageUsers({action:'update',id:edit.id,name:edit.name,role:edit.role as 'Admin'|'Shaykh'|'Student',active:edit.active,legacyUserId:edit.legacyUserId||undefined});await refresh();setEdit(null);toast.success('تم حفظ المستخدم');}catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ المستخدم');}finally{setSaving(false)}};
 return <div className="space-y-4" dir="rtl"><div><h2 className="text-xl font-bold">المستخدمون · Users</h2><p className="text-sm text-muted-foreground">إدارة الحسابات والصلاحيات وربط بيانات الشخص القديمة باسمه. حساب الدخول الجديد يبقى ثابتًا.</p></div>
 {loading&&<p role="status">جارٍ تحميل المستخدمين…</p>}{error&&<div role="alert"><p>{error}</p><Button onClick={refresh}>إعادة المحاولة</Button></div>}{!loading&&!error&&!users.length&&<p>لا يوجد مستخدمون مسجلون بعد.</p>}
 <div className="grid gap-3 md:grid-cols-2">{users.map(u=><div key={u.id} className="rounded-xl border bg-card p-4 flex gap-3 items-center justify-between"><div className="min-w-0"><strong>{u.name}</strong><p dir="ltr" className="text-xs text-muted-foreground truncate">{u.email}</p><p className="text-xs">{u.role} · {u.active?'نشط':'غير نشط'}</p>{u.legacyUserId&&<p className="text-xs text-muted-foreground">بيانات Zite: {people.find(p=>p.id===u.legacyUserId)?.name??u.legacyUserId}</p>}</div><Button variant="outline" onClick={()=>{setEdit({...u});setConfirmed(false);}}>إدارة</Button></div>)}</div>
 <Dialog open={!!edit} onOpenChange={o=>{if(!o)setEdit(null)}}><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle>إدارة المستخدم</DialogTitle></DialogHeader>{edit&&<div className="space-y-3"><p className="text-sm text-muted-foreground" dir="ltr">{edit.email}</p><label className="block space-y-1">الاسم<Input value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></label><label className="block space-y-1">الدور<select className="w-full rounded border bg-background p-2" value={edit.role} onChange={e=>setEdit({...edit,role:e.target.value})}><option value="Admin">مدير · Admin</option><option value="Shaykh">شيخ · Shaykh</option><option value="Student">طالب · Student</option></select></label>
 <label className="block space-y-1">{previous?'مرجع Zite التاريخي (تم نقل الملكية)':'نقل بيانات شخص من Zite — اختياري'}<select disabled={!!previous} className="w-full rounded border bg-background p-2" value={edit.legacyUserId} onChange={e=>{setEdit({...edit,legacyUserId:e.target.value});setConfirmed(false);}}><option value="">اختر الاسم القديم…</option>{people.map(p=><option key={p.id} value={p.id} disabled={users.some(u=>u.id!==edit.id&&u.legacyUserId===p.id)}>{p.name} — {p.email} — {p.id}</option>)}</select></label>
 {selected&&<div className="rounded border p-3 text-sm"><strong>{selected.name}</strong><p dir="ltr">{selected.email}</p><p className="break-all text-xs text-muted-foreground" dir="ltr">Zite ID: {selected.id}</p></div>}
 {changingLink&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="w-4 h-4 mt-1 shrink-0"/>أؤكد ربط بيانات {selected?.name} القديمة بحساب {edit.name}. لا تتغير هوية المجيزين في الشهادات.</label>}
 <label className="flex items-center gap-2"><input type="checkbox" checked={edit.active} onChange={e=>setEdit({...edit,active:e.target.checked})} className="w-4 h-4 shrink-0"/>الحساب نشط</label><Button disabled={saving||changingLink&&!confirmed} onClick={save}>{saving?'جارٍ الحفظ…':'حفظ'}</Button></div>}</DialogContent></Dialog>
 </div>;
}
