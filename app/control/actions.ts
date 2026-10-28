'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { managementSession } from '../../lib/manage-session';
import {validName,validId} from '../../lib/manage';
function finish(view:string,status:string):never { revalidatePath('/control'); redirect(`/control?view=${view}&notice=${status}`); }
export async function saveStudent(form:FormData) {
 const {client,account}=await managementSession();
 if(!account?.active || !['admin','shaykh'].includes(account.role)) redirect('/manage');
 const name=String(form.get('name')??'').trim(), id=String(form.get('id')??'');
 if(!validName(name) || (id && (!validId(id)||account.role!=='admin'))) finish('students','invalid');
 const result=id?await client.from('students').update({display_name:name}).eq('id',id).select('id'):await client.from('students').insert({display_name:name}).select('id');
 finish('students',result.error||!result.data?.length?'failed':'saved');
}
export async function approveAccount(form:FormData) {
 const {client,account}=await managementSession();
 if(!account?.active || account.role!=='admin') redirect('/manage');
 const id=String(form.get('id')??''),role=String(form.get('role')??''),issuer=String(form.get('issuer')??'');
 if(!validId(id)||!['student','shaykh'].includes(role)||(role==='shaykh'&&!validId(issuer)))finish('accounts','invalid');
 const {error}=await client.rpc('approve_account',{target_account:id,target_role:role,target_issuer:role==='shaykh'?issuer:undefined});
 finish('accounts',error?'failed':'saved');
}
export async function createDraft(form:FormData) {
 const {client,account}=await managementSession();
 if(!account?.active || !['admin','shaykh'].includes(account.role)) redirect('/manage');
 const student=String(form.get('student')??''),issuer=String(form.get('issuer')??''),qiraah=String(form.get('qiraah')??''),riwayah=String(form.get('riwayah')??''),date=String(form.get('date')??'');
 if(!validId(student)||!validId(issuer)||!/^\d{2}$/.test(riwayah)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'1900-01-01'||date>'2199-12-31'||!Number.isFinite(Date.parse(date)))finish('certificates','invalid');
 const reading=await client.from('riwayat').select('code').eq('code',riwayah).eq('qiraah_id',qiraah).maybeSingle();
 if(reading.error||!reading.data)finish('certificates','invalid');
 const {error}=await client.from('certificates').insert({student_id:student,issuer_id:issuer,riwayah_code:riwayah,completion_date:date});
 finish('certificates',error?'failed':'saved');
}
