import {useEffect,useState} from 'react';
import {Button} from '@project/components/ui/button';
import BookTariqBuilder from './BookTariqBuilder';
import {workspaceHeaders} from '../lib/workspaceSelection';
import {builderPreview,builderRouteName,builderCompactRouteName,type BuilderLibrary,type BuilderChain} from '../lib/bookBuilder';
import {QURRA,displayRawi,shortReadingLabel} from '../lib/qurra';
import {resolveBuilderPrefix} from '../lib/builderPrefix';
import BuilderPrefixInput from './BuilderPrefixInput';
import {arabicDigits} from '../lib/arabicDigits';

export type SavedRouteSelection={qariId:string;rawi:string;tariqNumber:string;tariqName:string;bookAuthor:string;routeSource:string;personalChain:string};
export default function SavedRoutePicker({initialScope='',initialPrefix='',filterQariId='',filterRawi='',shaykhId='',shaykhName='',onApply}:{initialScope?:''|'sughra'|'kubra';initialPrefix?:string;filterQariId?:string;filterRawi?:string;shaykhId?:string;shaykhName?:string;onApply:(selection:SavedRouteSelection)=>void}){
 const [library,setLibrary]=useState<BuilderLibrary|null>(null),[error,setError]=useState(''),[bookId,setBookId]=useState(''),[routeId,setRouteId]=useState('');
 const [scope,setScope]=useState<''|'sughra'|'kubra'>(initialScope);
 const [riwayah,setRiwayah]=useState(filterQariId&&filterRawi?filterQariId+'|'+filterRawi:'');
 const [prefixContinuationId,setPrefixContinuationId]=useState('');
 const [prefix,setPrefix]=useState(initialPrefix),[reviewed,setReviewed]=useState(false),[applied,setApplied]=useState(false);
 const load=async()=>{setError('');try{const response=await fetch('/api/book-builder',{headers:workspaceHeaders()});const data=await response.json();if(!response.ok)throw Error(data.error||'تعذر تحميل الطرق');setLibrary(data);}catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الطرق');}};
 useEffect(()=>{void load();},[]);
 const available=library?.chains.filter(c=>c.kind==='route'&&!c.archived&&library.books.some(b=>b.id===c.book_id&&!b.archived)&&(scope==='sughra'?c.reading_scope==='sughra':scope==='kubra'?c.confirmed&&c.reading_scope!=='sughra':false)&&(!filterQariId||c.qari_id===filterQariId)&&(!filterRawi||c.rawi===filterRawi))||[];
 const routes=available.filter(c=>(!riwayah||c.qari_id+'|'+c.rawi===riwayah)&&(!bookId||c.book_id===bookId));
 useEffect(()=>{if(scope==='sughra'){const matches=available.filter(c=>c.qari_id+'|'+c.rawi===riwayah);setRouteId(matches.length===1?matches[0].id:'');}},[library,scope,riwayah,filterQariId,filterRawi]);
 const selected=routes.find(r=>r.id===routeId),book=library?.books.find(b=>b.id===selected?.book_id&&!b.archived),parent=library?.chains.find(c=>c.id===selected?.book_chain_id&&c.kind==='book'&&!c.archived);
 let preview:ReturnType<typeof builderPreview>|null=null,prefixError='';
 if(library&&book&&parent&&selected){try{preview=builderPreview(book,parent,selected,library.people,resolveBuilderPrefix(prefix,library.prefixContinuations,prefixContinuationId).text);}catch(e){prefixError=e instanceof Error?e.message:'تعذر تركيب السند';}}
 const change=()=>{setReviewed(false);setApplied(false);};
 return <section className="rounded-lg border p-3 space-y-3"><strong>اختيار طريق محفوظ</strong><p className="text-xs text-muted-foreground">نفس مكتبة الكتب والطرق في إدارة الأسانيد. اختر الطريق وأضف سندك إلى إبراهيم العبيدي أو ابن الجزري؛ سيُحمّل السند الكامل هنا للمراجعة قبل حفظ الإجازة.</p>
 {error?<div role="alert" className="text-sm">{error}<Button type="button" size="sm" variant="outline" onClick={load}>إعادة المحاولة</Button></div>:!library?<p role="status" className="text-sm">جارٍ تحميل الطرق…</p>:<>
 <label className="block text-sm space-y-1">نوع الإجازة<select aria-label="العشر الصغرى أو الكبرى" className="block w-full rounded border bg-background p-2" value={scope} onChange={e=>{setScope(e.target.value as typeof scope);setBookId('');setRouteId('');change();}}><option value="">اختر العشر الصغرى أو الكبرى</option><option value="sughra">العشر الصغرى — الشاطبية والدرة</option><option value="kubra">العشر الكبرى</option></select></label>
 {scope&&<label className="block text-sm space-y-1">الرواية<select aria-label="الرواية المتاحة" className="block w-full rounded border bg-background p-2" value={riwayah} onChange={e=>{setRiwayah(e.target.value);setBookId('');setRouteId('');change();}}><option value="">اختر الرواية</option>{QURRA.flatMap(q=>q.rawis.filter(r=>available.some(c=>c.qari_id===q.id&&c.rawi===r)).map(r=><option key={q.id+'|'+r} value={q.id+'|'+r}>{shortReadingLabel(q.id,r)}</option>))}</select></label>}
 {scope==='sughra'&&selected&&<p className="text-sm">الطريق الأصلي: {book?.title}</p>}
 {scope==='kubra'&&riwayah&&<div className="grid gap-2 sm:grid-cols-2"><label className="text-sm space-y-1">الكتاب<select aria-label="الكتاب المحفوظ" className="block w-full rounded-md border bg-background p-2" value={bookId} onChange={e=>{setBookId(e.target.value);setRouteId('');change();}}><option value="">جميع الكتب</option>{library.books.filter(b=>!b.archived&&available.some(c=>c.book_id===b.id)).map(b=><option key={b.id} value={b.id}>{b.title}</option>)}</select></label><label className="text-sm space-y-1">الطريق<select aria-label="الطريق المحفوظ" className="block w-full rounded-md border bg-background p-2" value={routeId} onChange={e=>{setRouteId(e.target.value);change();}}><option value="">اختر طريقًا محفوظًا</option>{routes.map(r=><option key={r.id} value={r.id} disabled={!r.confirmed}>{builderCompactRouteName(library.books.find(b=>b.id===r.book_id)!,r,library.people)} · {displayRawi(r.qari_id,r.rawi)}{r.confirmed?'':' — للمراجعة'}</option>)}</select></label></div>}
 {scope&&routes.length>0&&routes.every(r=>!r.confirmed)&&<p className="text-sm text-muted-foreground">الطرق المستوردة ظاهرة للمراجعة. افتح مكتبة الكتب والطرق، ثم أيقونة القلم لمراجعة كل طريق وتأكيد تتمته قبل الاستخدام.</p>}
 {scope&&!routes.length&&<p className="text-sm text-muted-foreground">لا توجد طرق مُراجعة متاحة هنا. أضف كتابًا وطريقًا من المكتبة، أو استخدم الإدخال اليدوي أدناه.</p>}
 {selected&&<div className="space-y-3"><p className="text-sm">{book?.title} · {QURRA.find(q=>q.id===selected.qari_id)?.reading} · {displayRawi(selected.qari_id,selected.rawi)}</p><BuilderPrefixInput value={prefix} onChange={value=>{setPrefix(value);change();}} continuations={library.prefixContinuations} selectedId={prefixContinuationId} onSelect={id=>{setPrefixContinuationId(id);change();}}/>{prefixError&&<p role="alert" className="text-sm text-destructive">{prefixError}</p>}<details className="rounded border p-2"><summary className="cursor-pointer text-sm">معاينة السند الكامل</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-loose break-words">{preview?.text||'إسناد الكتاب أو أحد رواته غير متاح؛ راجعه في المكتبة.'}</p></details><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>راجعت السند الشخصي والطريق المختار</label><Button type="button" disabled={!reviewed||!preview||!selected.confirmed} onClick={()=>{if(!preview||!book||!selected.confirmed)return;onApply({qariId:selected.qari_id,rawi:selected.rawi,tariqNumber:selected.route_code,tariqName:builderRouteName(book,selected),bookAuthor:preview.author,routeSource:preview.sources.join('، '),personalChain:preview.text});setApplied(true);}}>استخدام هذا الطريق في النموذج</Button>{applied&&<p role="status" className="text-sm text-primary">حُمّل الطريق والسند إلى النموذج. راجع البيانات ثم اضغط حفظ الإجازات.</p>}</div>}
 </>}
 <BookTariqBuilder shaykhId={shaykhId} shaykhName={shaykhName} initialPrefix={initialPrefix} triggerLabel="فتح مكتبة الكتب والطرق" onLibraryChange={()=>{void load();}}/>
 </section>;
}
