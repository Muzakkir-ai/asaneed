import Link from 'next/link';
import DraftForm from './draft-form';
import { logout } from '../login/actions';
import { getLocale } from '../../lib/locale-server';
import { messages } from '../../lib/i18n';
import { managementMessages } from '../../lib/manage-i18n';
import {managementSession} from '../../lib/manage-session';
import {normalizeName} from '../../lib/manage';
import LanguageSwitcher from '../language-switcher';
import SubmitButton from '../submit-button';
import {saveStudent,approveAccount} from './actions';
export const dynamic='force-dynamic';
export default async function Manage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
 const [locale,params,{client,account}]=await Promise.all([getLocale(),searchParams,managementSession()]);
 const t=messages[locale], m=managementMessages[locale];
 if(!account?.active) return <section className="panel"><h1>{t.pendingAccount}</h1><p>{t.activationHelp}</p><form action={logout}><button>{t.signOut}</button></form></section>;
 const staff=['admin','shaykh'].includes(account.role), admin=account.role==='admin';
 const tabs=staff?['dashboard','students','issuers','certificates',...(admin?['accounts']:[])]:['certificates'];
 const view=tabs.includes(params.view??'')?params.view! :tabs[0];
 const titles:Record<string,string>={dashboard:m.dashboard,students:m.students,issuers:m.issuers,certificates:m.certificates,accounts:m.accounts};
 const [students,issuers,certificates,accounts,qiraat,riwayat]=await Promise.all([
  staff?client.from('students').select('id,display_name').order('display_name').limit(1000):Promise.resolve({data:[],error:null}),
  staff?client.from('issuers').select('id,display_name,issuer_code').order('issuer_code'):Promise.resolve({data:[],error:null}),
  client.from('certificates').select('id,student_id,issuer_id,registration_number,status,completion_date').order('created_at',{ascending:false}).limit(1000),
  admin?client.from('accounts').select('id,display_name,role,active').order('created_at',{ascending:false}).limit(1000):Promise.resolve({data:[],error:null}),
  staff?client.from('qiraat').select('id,display_name').order('id'):Promise.resolve({data:[],error:null}),
  staff?client.from('riwayat').select('code,display_name,qiraah_id').order('code'):Promise.resolve({data:[],error:null})
 ]);
 const failed=[students,issuers,certificates,accounts,qiraat,riwayat].some(r=>r.error);
 const query=(params.q??'').slice(0,200);
 const studentRows=(students.data??[]).filter(s=>normalizeName(s.display_name).includes(normalizeName(query)));
 const issuerRows=issuers.data??[], certRows=(certificates.data??[]).filter(c=>(!params.status||!['draft','finalized'].includes(params.status)||c.status===params.status)&&(!params.issuer||c.issuer_id===params.issuer));
 const format=(v:string|number)=>locale==='en'?String(v):String(v).replace(/[0-9]/g,n=>'٠١٢٣٤٥٦٧٨٩'[Number(n)]);
 return <div className="workspace">
  <header className="site-header"><div><strong className="brand-name">{t.brand}</strong><span className="brand-subtitle">{m.setup}</span></div><LanguageSwitcher locale={locale} returnTo="/manage"/></header>
  <div className="workspace-heading"><div><h1>{m.dashboard}</h1><p>{t.welcome} <bdi>{account.display_name}</bdi> · {m[account.role as 'admin'|'student'|'shaykh']}</p></div><form action={logout}><button>{t.signOut}</button></form></div>
  <nav className="workspace-nav" aria-label={m.dashboard}>{tabs.map(tab=><Link key={tab} href={`/manage?view=${tab}`} aria-current={view===tab?'page':undefined}>{titles[tab]}</Link>)}</nav>
  {params.notice&&<p role={params.notice==='saved'?'status':'alert'} className={params.notice==='saved'?'workspace-notice':'error'}>{params.notice==='saved'?m.saved:params.notice==='invalid'?m.invalid:m.failed}</p>}
  {failed?<section className="panel"><h2>{t.pageError}</h2><p role="alert">{t.connectionError}</p><Link href={`/manage?view=${view}`}>{t.retry}</Link></section>:<>
  {view==='dashboard'&&<><div className="stat-grid">{(['students','issuers','certificates','accounts'] as const).filter(k=>k!=='accounts'||admin).map((key)=><Link className="stat-card" key={key} href={`/manage?view=${key}`}><span>{titles[key]}</span><strong>{format(({students:students.data,issuers:issuers.data,certificates:certificates.data,accounts:accounts.data}[key]??[]).length)}</strong></Link>)}</div><section className="panel"><h2>{m.setup}</h2><p>{m.setupHelp}</p><p>{m.separate}</p></section></>}
  {view==='students'&&<section className="panel workspace-section"><h2>{m.students}</h2><p>{m.shared}</p><form method="get" className="filter-form"><input type="hidden" name="view" value="students"/><label htmlFor="student-search">{m.search}</label><input id="student-search" name="q" defaultValue={query} maxLength={200}/><button>{m.filter}</button></form><form action={saveStudent} className="add-form"><label htmlFor="student-name">{m.name}</label><input id="student-name" name="name" required maxLength={200}/><SubmitButton pendingLabel={t.loading}>{m.add}</SubmitButton></form><div className="record-list">{studentRows.map(s=><article key={s.id}><bdi>{s.display_name}</bdi>{admin&&<details><summary>{m.edit}</summary><form action={saveStudent}><input type="hidden" name="id" value={s.id}/><label htmlFor={`name-${s.id}`}>{m.name}</label><input id={`name-${s.id}`} name="name" defaultValue={s.display_name} required maxLength={200}/><SubmitButton pendingLabel={t.loading}>{m.save}</SubmitButton></form></details>}</article>)}</div>{!studentRows.length&&<p className="empty-state">{query?m.noMatches:m.empty}</p>}</section>}
  {view==='issuers'&&<section className="panel workspace-section"><h2>{m.issuers}</h2><p>{m.separate}</p><div className="record-list">{issuerRows.map(i=><article key={i.id}><strong lang="ar">{i.display_name}</strong><p>{m.code}: <bdi>{format(i.issuer_code)}</bdi></p></article>)}</div>{!issuerRows.length&&<p className="empty-state">{m.empty}</p>}</section>}
  {view==='certificates'&&<section className="panel workspace-section"><h2>{m.certificates}</h2>{staff&&<DraftForm students={students.data??[]} issuers={issuerRows} qiraat={qiraat.data??[]} riwayat={riwayat.data??[]} labels={{newDraft:locale==='en'?'New ijazah draft':locale==='ur'?'نیا اجازہ مسودہ':'مسودة إجازة جديدة',student:m.student,issuer:m.issuers,qiraah:t.qiraah,riwayah:t.riwayah,date:m.completion,save:m.save,loading:t.loading,choose:m.filter}}/>}<form method="get" className="filter-form"><input type="hidden" name="view" value="certificates"/><label htmlFor="cert-status">{m.filter}</label><select id="cert-status" name="status" defaultValue={params.status??''}><option value="">{m.all}</option><option value="draft">{m.draft}</option><option value="finalized">{m.finalized}</option></select>{staff&&<><label htmlFor="cert-issuer">{m.issuers}</label><select id="cert-issuer" name="issuer" defaultValue={params.issuer??''}><option value="">{m.issuers}</option>{issuerRows.map(i=><option key={i.id} value={i.id}>{i.display_name}</option>)}</select></>}<button>{m.filter}</button></form><div className="record-list">{certRows.map(c=><article key={c.id}><strong>{students.data?.find(s=>s.id===c.student_id)?.display_name??m.certificates}</strong><p>{c.status==='draft'?m.draft:m.finalized} · <time>{format(c.completion_date)}</time></p>{c.registration_number&&<bdi className="registration-number">{format(c.registration_number)}</bdi>}</article>)}</div>{!certRows.length&&<p className="empty-state">{(certificates.data??[]).length?m.noMatches:m.empty}</p>}</section>}
  {view==='accounts'&&admin&&<section className="panel workspace-section"><h2>{m.accounts}</h2><p>{m.accountHelp}</p><div className="record-list">{(accounts.data??[]).map(a=><article key={a.id}><strong><bdi>{a.display_name}</bdi></strong><p>{m[a.role as 'admin'|'student'|'shaykh']} · {a.active?m.active:m.pending}</p>{!a.active&&a.role!=='admin'&&<form action={approveAccount}><input type="hidden" name="id" value={a.id}/><label htmlFor={`role-${a.id}`}>{m.role}</label><select id={`role-${a.id}`} name="role" defaultValue="student"><option value="student">{m.student}</option><option value="shaykh">{m.shaykh}</option></select><label htmlFor={`issuer-${a.id}`}>{m.issuers}</label><select id={`issuer-${a.id}`} name="issuer"><option value="">{m.choose}</option>{issuerRows.map(i=><option key={i.id} value={i.id}>{i.display_name}</option>)}</select><SubmitButton pendingLabel={t.loading}>{m.approve}</SubmitButton></form>}</article>)}</div></section>}
  </>}
  <footer className="site-footer"><Link href="/">{m.back}</Link></footer>
 </div>;
}
