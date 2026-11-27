import {useState} from 'react';
import {arabicDigits} from '../lib/arabicDigits';
import type {ConsistencyEntry,auditSanadConsistency} from '../lib/sanadConsistency';
type Report=ReturnType<typeof auditSanadConsistency>;
const stateLabel={error:'خطأ في المراجع',review:'يحتاج مراجعة',consistent:'لا تعارض مكتشف'};
const severityLabel={error:'خطأ',review:'مراجعة',info:'معلومة'};
export default function SanadConsistencyPanel({report,onRefresh}:{report:Report;onRefresh:()=>void}){
 const [filter,setFilter]=useState<'all'|'error'|'review'|'consistent'>('all');
 const [kind,setKind]=useState<'route'|'linked'>('route');
 const entries=[...report.routes,...report.linked];
 const visible=(kind==='route'?report.routes:report.linked).filter(e=>filter==='all'||e.status===filter);
 const counts=(status:ConsistencyEntry['status'])=>entries.filter(e=>e.status===status).length;
 return <section dir="rtl" className="my-3 min-w-0 space-y-3 rounded-lg border p-3" aria-label="فحص اتساق الأسانيد">
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">فحص اتساق الأسانيد تلقائيًا</h3><button type="button" onClick={onRefresh} className="rounded border px-3 py-1 text-sm">إعادة الفحص</button></div>
  <p className="text-xs text-muted-foreground">فحص آلي للهوية والمراجع وترتيب الأسماء؛ لا يثبت اتصال السند ولا يغير النصوص أو يعتمدها. النسخة القديمة ليست خطأ بحد ذاتها.</p>
  <div className="grid gap-2 sm:grid-cols-3">{(['error','review','consistent'] as const).map(status=><button key={status} type="button" aria-pressed={filter===status} onClick={()=>setFilter(v=>v===status?'all':status)} className="rounded border p-2 text-start text-sm"><strong className="block text-lg">{arabicDigits(counts(status))}</strong>{stateLabel[status]}</button>)}</div>
  <div className="flex flex-wrap gap-2"><button type="button" aria-pressed={kind==='route'} className="rounded border px-2 py-1 text-sm" onClick={()=>setKind('route')}>الطرق ({arabicDigits(report.routes.length)})</button><button type="button" aria-pressed={kind==='linked'} className="rounded border px-2 py-1 text-sm" onClick={()=>setKind('linked')}>النصوص المرتبطة ({arabicDigits(report.linked.length)})</button></div>
  <p className="text-xs text-muted-foreground">نصوص بلا مرجع طريق منظم: {arabicDigits(report.unlinked)} — لم تدخل في المقارنة الآلية.</p>
  {!visible.length&&<p role="status" className="text-sm text-muted-foreground">لا نتائج لهذا الاختيار.</p>}
  {visible.map(e=><details key={e.kind+':'+e.id} className="min-w-0 rounded border p-2"><summary className="cursor-pointer break-words text-sm">{e.label||e.id} · {stateLabel[e.status]}</summary><p className="my-2 text-xs text-muted-foreground">المسارات المطابقة في ترتيب الأسماء: {arabicDigits(e.pathsMatched)} / {arabicDigits(e.pathsChecked)}</p>{e.issues.map((issue,i)=><p key={i} className="my-1 break-words text-xs" data-consistency-code={issue.code}>{severityLabel[issue.severity]}: {issue.message}{issue.branch?' · الفرع '+arabicDigits(issue.branch):''}{issue.personId&&<span className="block break-all text-muted-foreground" dir="ltr">{issue.personId}</span>}</p>)}<p className="break-all text-xs text-muted-foreground" dir="ltr">{e.id}</p></details>)}
 </section>;
}
