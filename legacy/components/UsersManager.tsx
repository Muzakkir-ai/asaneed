import {useEffect,useState} from 'react';
import {manageUsers} from '../lib/api';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@project/components/ui/dialog';
import {toast} from 'sonner';
type User={id:string;stableId:string;name:string;email:string;role:string;active:boolean;authUserId:string;legacyUserId:string};
export default function UsersManager(){
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [users,setUsers]=useState<User[]>([]);
 const [edit,setEdit]=useState<User|null>(null);
 const [saving,setSaving]=useState(false);
 const refresh=()=>{setLoading(true);setError('');return manageUsers({action:'list'}).then(r=>setUsers(r.users)).catch(e=>setError(e instanceof Error?e.message:'تعذر تحميل المستخدمين')).finally(()=>setLoading(false));};
 useEffect(()=>{void refresh();},[]);
 const save=async()=>{if(!edit)return;setSaving(true);try{await manageUsers({action:'update',id:edit.id,name:edit.name,role:edit.role as 'Admin'|'Shaykh'|'Student',active:edit.active,authUserId:edit.authUserId,transferOwnership:true});await refresh();setEdit(null);toast.success('User updated');}catch(e){toast.error(e instanceof Error?e.message:'Unable to update user');}finally{setSaving(false)}};
 return <div className="space-y-4" dir="rtl"><div><h2 className="text-xl font-bold">المستخدمون · Users</h2><p className="text-sm text-muted-foreground">هوية ثابتة لكل شخص — مع ربط حساب الدخول والصلاحيات من مكان واحد. تغيير حساب الدخول لا ينقل الشهادات تلقائيا حتى يتم التحقق من الملكية.</p></div>
 {loading&&<p role="status">جارٍ تحميل المستخدمين…</p>}{error&&<div role="alert"><p>{error}</p><Button onClick={refresh}>إعادة المحاولة</Button></div>}{!loading&&!error&&!users.length&&<p>لا يوجد مستخدمون مسجلون بعد.</p>}
 <div className="grid gap-3 md:grid-cols-2">{users.map(u=><div key={u.id} className="rounded-xl border bg-card p-4 flex gap-3 items-center justify-between"><div className="min-w-0"><strong>{u.name}</strong><p dir="ltr" className="text-xs text-muted-foreground truncate">{u.email}</p><p className="text-xs">{u.stableId} · {u.role} · {u.active?'نشط':'غير نشط'}</p><p className="text-xs text-muted-foreground">{u.authUserId?'حساب مرتبط':'حساب غير مرتبط'}</p></div><Button variant="outline" onClick={()=>setEdit({...u})}>إدارة</Button></div>)}</div>
 <Dialog open={!!edit} onOpenChange={o=>{if(!o)setEdit(null)}}><DialogContent dir="rtl" className="max-w-lg"><DialogHeader><DialogTitle>إدارة المستخدم</DialogTitle></DialogHeader>{edit&&<div className="space-y-3"><p className="text-sm text-muted-foreground">{edit.stableId} · {edit.email}</p><label className="block space-y-1">الاسم<Input value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></label><label className="block space-y-1">الدور<select className="w-full rounded border bg-background p-2" value={edit.role} onChange={e=>setEdit({...edit,role:e.target.value})}><option value="Admin">Admin</option><option value="Shaykh">Shaykh</option><option value="Student">Student</option></select></label><p className="text-xs text-muted-foreground">Linking a different verified account ID transfers related records to it. Check the email and ID before saving.</p><label className="block space-y-1">Zite account ID<Input dir="ltr" value={edit.authUserId} onChange={e=>setEdit({...edit,authUserId:e.target.value})}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={edit.active} onChange={e=>setEdit({...edit,active:e.target.checked})}/>الحساب نشط</label><p className="text-xs text-muted-foreground">Old account ID: {edit.legacyUserId||'—'}</p><Button disabled={saving} onClick={save}>حفظ</Button></div>}</DialogContent></Dialog>
 </div>;
}
