'use client';
import { useState, type FormEvent } from 'react';
import { arabicDigits, isRegistration, normalizeRegistration } from '../lib/registration';
import { isVerificationResult, type VerificationResult } from '../lib/verification';
export default function VerificationForm() {
 const [number,setNumber] = useState('');
 const [loading,setLoading] = useState(false);
 const [error,setError] = useState('');
 const [invalid,setInvalid] = useState(false);
 const [result,setResult] = useState<VerificationResult|null>(null);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (loading) return;
  setResult(null); setError(''); setInvalid(false);
  const normalized = normalizeRegistration(number);
  if (!isRegistration(normalized)) { setInvalid(true); setError('أدخل رقمًا من ثمانية أرقام، مثل ٠١٢٦-١٠٠٢.'); return; }
  setLoading(true);
  try {
   const response = await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:normalized}),cache:'no-store',signal:AbortSignal.timeout(12000)});
   const data: unknown = await response.json();
   if (!response.ok || !isVerificationResult(data)) throw new Error('unavailable');
   setResult(data);
  } catch { setError('تعذر الاتصال بخدمة التحقق. يرجى المحاولة مرة أخرى.'); }
  finally { setLoading(false); }
 }
 return <section className="checker-card" aria-label="البحث برقم الإجازة">
  <form onSubmit={submit} className="verification-form" aria-busy={loading}>
   <label htmlFor="ijazah-number">رقم الإجازة</label>
   <p id="number-hint" className="field-hint">الرقم المدوّن على الإجازة بعد عبارة «المسجّل برقم».</p>
   <div className="number-input-wrap"><input id="ijazah-number" name="number" value={number} onChange={event=>{setNumber(event.target.value);setResult(null);setError('');setInvalid(false);}} dir="ltr" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={32} placeholder="٠١٢٦-١٠٠٢" required disabled={loading} aria-describedby={error?'number-hint verification-error':'number-hint'} aria-invalid={invalid}/></div>
   <button type="submit" className="verify-button" disabled={loading}>{loading?<><span className="spinner" aria-hidden="true"/>جارٍ التحقق…</>:<>تحقق من الإجازة<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></>}</button>
   <p className="input-note">يمكنك إدخال الرقم بالأرقام العربية أو الإنجليزية.</p>
   {error&&<p id="verification-error" role="alert" className="lookup-message lookup-error">{error}</p>}
  </form>
  <div aria-live="polite" aria-atomic="true">
   {result?.status==='preparing'&&<div className="lookup-message"><h2>سجل التحقق قيد التجهيز</h2><p>ستتوفر نتائج التحقق بعد إدراج الإجازات المعتمدة في السجل.</p></div>}
   {result?.status==='not_found'&&<div className="lookup-message"><h2>لم نعثر على إجازة بهذا الرقم</h2><p>تحقق من الرقم المدوّن على الإجازة وحاول مجددًا. قد لا تكون الإجازة قد أُدرجت في السجل بعد.</p></div>}
   {result?.status==='verified'&&<section className="verified-result"><p className="verified-badge"><span aria-hidden="true">✓</span> إجازة معتمدة</p><h2>{result.certificate.student_name}</h2><dl>
    <div><dt>رقم الإجازة</dt><dd><bdi dir="ltr" className="registration-number">{arabicDigits(result.certificate.registration_number)}</bdi></dd></div>
    <div><dt>المجيز</dt><dd>{result.certificate.issuer_name}</dd></div>
    <div><dt>القراءة</dt><dd>{result.certificate.qiraah_name}</dd></div>
    <div><dt>الرواية</dt><dd>{result.certificate.riwayah_name}</dd></div>
    <div><dt>تاريخ الإتمام</dt><dd>{new Intl.DateTimeFormat('ar',{dateStyle:'long',calendar:'gregory',timeZone:'UTC'}).format(new Date(`${result.certificate.completion_date}T00:00:00Z`))}</dd></div>
   </dl></section>}
  </div>
 </section>;
}
