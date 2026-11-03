import {useEffect,useState} from 'react';
import {accountUsername} from '../lib/api';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {Label} from '@project/components/ui/label';
import {normalizeUsername,validUsername} from '../../lib/usernames';
import {toast} from 'sonner';
export default function AccountUsername(){
 const [loginEnabled,setLoginEnabled]=useState(false);
 const [value,setValue]=useState(''),[saved,setSaved]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');accountUsername({action:'get'}).then(r=>{if(active){setValue(r.username);setSaved(r.username);setLoginEnabled(r.loginEnabled);}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'تعذر تحميل اسم الدخول');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[attempt]);
 const normalized=normalizeUsername(value);
 async function save(){if(saving)return;setSaving(true);setError('');try{const r=await accountUsername({action:'save',username:normalized});setValue(r.username);setSaved(r.username);setLoginEnabled(r.loginEnabled);toast.success('تم حفظ اسم الدخول');}catch(e){setError(e instanceof Error?e.message:'تعذر الحفظ');}finally{setSaving(false);}}
 return <section className="space-y-3 rounded-lg border p-5" aria-labelledby="login-username-title"><h2 id="login-username-title" className="text-lg font-bold">اسم الدخول</h2><p className="text-sm text-muted-foreground">{loginEnabled?'اختر اسمًا لحسابك لاستخدامه بدل البريد الإلكتروني عند تسجيل الدخول. يبقى حساب Google والبريد الإلكتروني مرتبطين بالحساب نفسه.':'يمكنك حفظ اسم دخول لحسابك. الدخول باسم الدخول لم يُفعّل بعد؛ استمر باستخدام Google أو البريد الإلكتروني.'}</p><Label htmlFor="account-username">اسم الدخول (اختياري)</Label><Input id="account-username" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={loading||saving} value={value} maxLength={30} onChange={e=>setValue(e.target.value)} placeholder="example_name"/><p className="text-xs text-muted-foreground">٣–٣٠ حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية (_)، ويبدأ بحرف.</p>{loading&&<p role="status">جارٍ التحميل…</p>}{error&&<p role="alert" className="text-sm text-destructive">{error} <Button size="sm" variant="outline" onClick={()=>setAttempt(n=>n+1)}>إعادة المحاولة</Button></p>}<Button disabled={loading||saving||!validUsername(normalized)||normalized===saved} onClick={save}>{saving?'جارٍ الحفظ…':'حفظ اسم الدخول'}</Button>{loginEnabled&&<p className="text-sm text-muted-foreground">لحساب Google: يمكنك متابعة الدخول باستخدام Google، أو <a className="underline" href="/forgot-password">تعيين كلمة مرور للأسانيد</a> لاستخدام اسم الدخول وكلمة المرور.</p>}</section>;
}
