import {useEffect,useState} from 'react';
import {Button} from '@project/components/ui/button';
import {Textarea} from '@project/components/ui/textarea';
import BookTariqBuilder from './BookTariqBuilder';
import {workspaceHeaders} from '../lib/workspaceSelection';
import {builderPreview,type BuilderLibrary,type BuilderChain} from '../lib/bookBuilder';
import {QURRA,displayRawi} from '../lib/qurra';
import {reachesJunction} from '../lib/personalSanadValidation';
import {arabicDigits} from '../lib/arabicDigits';

export type SavedRouteSelection={qariId:string;rawi:string;tariqNumber:string;tariqName:string;bookAuthor:string;routeSource:string;personalChain:string};
export default function SavedRoutePicker({initialPrefix='',onApply}:{initialPrefix?:string;onApply:(selection:SavedRouteSelection)=>void}){
 const [library,setLibrary]=useState<BuilderLibrary|null>(null),[error,setError]=useState(''),[bookId,setBookId]=useState(''),[routeId,setRouteId]=useState('');
 const [prefix,setPrefix]=useState(initialPrefix),[reviewed,setReviewed]=useState(false),[applied,setApplied]=useState(false);
 const load=async()=>{setError('');try{const response=await fetch('/api/book-builder',{headers:workspaceHeaders()});const data=await response.json();if(!response.ok)throw Error(data.error||'تعذر تحميل الطرق');setLibrary(data);}catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الطرق');}};
 useEffect(()=>{void load();},[]);
 const routes=library?.chains.filter(c=>c.kind==='route'&&!c.archived&&c.confirmed&&(!bookId||c.book_id===bookId))||[];
 const selected=routes.find(r=>r.id===routeId),book=library?.books.find(b=>b.id===selected?.book_id&&!b.archived),parent=library?.chains.find(c=>c.id===selected?.book_chain_id&&c.kind==='book'&&!c.archived);
 let preview:ReturnType<typeof builderPreview>|null=null;
 if(library&&book&&parent&&selected){try{preview=builderPreview(book,parent,selected,library.people,prefix);}catch{}}
 const change=()=>{setReviewed(false);setApplied(false);};
 return <section className="rounded-lg border p-3 space-y-3"><strong>اختيار طريق محفوظ</strong><p className="text-xs text-muted-foreground">نفس مكتبة الكتب والطرق في إدارة الأسانيد. اختر الطريق وأضف سندك إلى ابن الجزري؛ سيُحمّل السند الكامل هنا للمراجعة قبل حفظ الإجازة.</p>
 {error?<div role="alert" className="text-sm">{error}<Button type="button" size="sm" variant="outline" onClick={load}>إعادة المحاولة</Button></div>:!library?<p role="status" className="text-sm">جارٍ تحميل الطرق…</p>:<>
 <div className="grid gap-2 sm:grid-cols-2"><label className="text-sm space-y-1">الكتاب<select aria-label="الكتاب المحفوظ" className="block w-full rounded-md border bg-background p-2" value={bookId} onChange={e=>{setBookId(e.target.value);setRouteId('');change();}}><option value="">جميع الكتب</option>{library.books.filter(b=>!b.archived).map(b=><option key={b.id} value={b.id}>{b.title}</option>)}</select></label><label className="text-sm space-y-1">الطريق<select aria-label="الطريق المحفوظ" className="block w-full rounded-md border bg-background p-2" value={routeId} onChange={e=>{setRouteId(e.target.value);change();}}><option value="">اختر طريقًا محفوظًا</option>{routes.map(r=><option key={r.id} value={r.id}>{r.title} — {displayRawi(r.qari_id,r.rawi)} — {arabicDigits(r.route_code)}</option>)}</select></label></div>
 {!routes.length&&<p className="text-sm text-muted-foreground">لا توجد طرق مُراجعة متاحة هنا. أضف كتابًا وطريقًا من المكتبة، أو استخدم الإدخال اليدوي أدناه.</p>}
 {selected&&<div className="space-y-3"><p className="text-sm">{book?.title} · {QURRA.find(q=>q.id===selected.qari_id)?.reading} · {displayRawi(selected.qari_id,selected.rawi)}</p><label className="block text-sm space-y-1">سندك الشخصي حتى الإمام ابن الجزري<Textarea rows={4} value={prefix} onChange={e=>{setPrefix(e.target.value);change();}} placeholder="كما أخذته عن الشيخ… إلى الإمام ابن الجزري"/></label><details className="rounded border p-2"><summary className="cursor-pointer text-sm">معاينة السند الكامل</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-loose break-words">{preview?.text||'إسناد الكتاب أو أحد رواته غير متاح؛ راجعه في المكتبة.'}</p></details><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>راجعت السند الشخصي والطريق المختار</label><Button type="button" disabled={!reviewed||!preview||!reachesJunction({personalChain:prefix,junction:'jazari'})} onClick={()=>{if(!preview||!book)return;onApply({qariId:selected.qari_id,rawi:selected.rawi,tariqNumber:selected.route_code,tariqName:book.title+' — '+selected.title,bookAuthor:preview.author,routeSource:preview.sources.join('، '),personalChain:preview.text});setApplied(true);}}>استخدام هذا الطريق في النموذج</Button>{applied&&<p role="status" className="text-sm text-primary">حُمّل الطريق والسند إلى النموذج. راجع البيانات ثم اضغط حفظ الإجازات.</p>}</div>}
 </>}
 <BookTariqBuilder triggerLabel="فتح مكتبة الكتب والطرق" onLibraryChange={()=>{void load();}}/>
 </section>;
}
