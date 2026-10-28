'use client';
import { useState, type FormEvent } from 'react';
import { arabicDigits, isRegistration, normalizeRegistration } from '../lib/registration';
import { isVerificationResult, type VerificationResult } from '../lib/verification';
import { dateLocale } from '../lib/i18n';
import { useLanguage } from './language-provider';
export default function VerificationForm() {
 const {locale,t}=useLanguage();
 const [number,setNumber] = useState('');
 const [loading,setLoading] = useState(false);
 const [error,setError] = useState<''|'invalid'|'unavailable'>('');
 const [invalid,setInvalid] = useState(false);
 const [result,setResult] = useState<VerificationResult|null>(null);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (loading) return;
  setResult(null); setError(''); setInvalid(false);
  const normalized = normalizeRegistration(number);
  if (!isRegistration(normalized)) { setInvalid(true); setError('invalid'); return; }
  setLoading(true);
  try {
   const response = await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:normalized}),cache:'no-store',signal:AbortSignal.timeout(12000)});
   const data: unknown = await response.json();
   if (!response.ok || !isVerificationResult(data)) throw new Error('unavailable');
   setResult(data);
  } catch { setError('unavailable'); }
  finally { setLoading(false); }
 }
 const digits=(value:string)=>locale==='en'?value:arabicDigits(value);
 return <section className="checker-card" aria-label={t.searchLabel}>
  <form onSubmit={submit} className="verification-form" aria-busy={loading}>
   <label htmlFor="ijazah-number">{t.number}</label>
   <p id="number-hint" className="field-hint">{t.hint.split('المسجّل برقم').map((part,index)=><span key={index}>{index>0&&<bdi lang="ar" className="arabic-phrase">المسجّل برقم</bdi>}{part}</span>)}</p>
   <div className="number-input-wrap"><input id="ijazah-number" name="number" value={number} onChange={event=>{setNumber(event.target.value);setResult(null);setError('');setInvalid(false);}} dir="ltr" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={32} placeholder={locale==='en'?'1234-5678':'\u2066١٢٣٤\u2069-\u2066٥٦٧٨\u2069'} required disabled={loading} aria-describedby={error?'number-hint verification-error':'number-hint'} aria-invalid={invalid}/></div>
   <button type="submit" className="verify-button" disabled={loading}>{loading?<><span className="spinner" aria-hidden="true"/>{t.checking}</>:<>{t.verify}<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></>}</button>
   <p className="input-note">{t.inputNote}</p>
   {error&&<p id="verification-error" role="alert" className="lookup-message lookup-error">{t[error]}</p>}
  </form>
  <div aria-live="polite" aria-atomic="true">
   {result?.status==='preparing'&&<div className="lookup-message"><h2>{t.preparingTitle}</h2><p>{t.preparingBody}</p></div>}
   {result?.status==='not_found'&&<div className="lookup-message"><h2>{t.notFoundTitle}</h2><p>{t.notFoundBody}</p></div>}
   {result?.status==='verified'&&<section className="verified-result"><p className="verified-badge"><span aria-hidden="true">✓</span> {t.verified}</p><h2><bdi>{result.certificate.student_name}</bdi></h2><dl>
    <div><dt>{t.number}</dt><dd><bdi dir="ltr" className="registration-number"><span>{digits(result.certificate.registration_number.slice(0,4))}</span><span>-</span><span>{digits(result.certificate.registration_number.slice(5))}</span></bdi></dd></div>
    <div><dt>{t.issuer}</dt><dd><bdi>{result.certificate.issuer_name}</bdi></dd></div>
    <div><dt>{t.qiraah}</dt><dd><bdi>{result.certificate.qiraah_name}</bdi></dd></div>
    <div><dt>{t.riwayah}</dt><dd><bdi>{result.certificate.riwayah_name}</bdi></dd></div>
    <div><dt>{t.completionDate}</dt><dd>{new Intl.DateTimeFormat(dateLocale(locale),{dateStyle:'long',calendar:'gregory',timeZone:'UTC'}).format(new Date(`${result.certificate.completion_date}T00:00:00Z`))}</dd></div>
   </dl></section>}
  </div>
 </section>;
}
