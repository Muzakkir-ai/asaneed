import {arabicSearchKey as plain} from '../lib/arabicSearch';
import {useEffect,useMemo,useState} from 'react';
import {narratorDirectory,type NarratorDirectoryOutputType} from '../lib/api';
import {QURRA,displayRawi} from '../lib/qurra';
import {Card,CardContent} from '@project/components/ui/card';
import {Input} from '@project/components/ui/input';
import {Button} from '@project/components/ui/button';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@project/components/ui/select';
import {Skeleton} from '@project/components/ui/skeleton';
import {Search,Users,BookOpen,ChevronLeft,RotateCcw,Network,ArrowUpLeft,ArrowDownLeft} from 'lucide-react';

type Profile=NarratorDirectoryOutputType['people'][number];
const sourceTitle=(source:string)=>{
 const match=source.match(/^CHAIN:([^:]+):(.+)$/u);
 if(match){
  const q=QURRA.find(q=>q.id===match[1]);
  return q?`${q.reading} — ${match[2]==='sahaba'?'إلى الصحابة':match[2]==='prophet'?'إلى النبي ﷺ':`رواية ${displayRawi(q.id,match[2])}`}`:source;
 }
 return source.replace('من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند','العُبيدي إلى ابن الجزري')
  .replace('من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة','ابن الجزري إلى الداني')
  .replace('إسناد الشيخ ذكاء الله إلى إبراهيم العُبيدي — مرجع مستقل','سند الشيخ ذكاء الله إلى العُبيدي');
};

export default function NarratorDirectoryPage(){
 const [data,setData]=useState<NarratorDirectoryOutputType|null>(null);
 const [error,setError]=useState(false);
 const [query,setQuery]=useState('');
 const [visibleCount,setVisibleCount]=useState(40);
 const [qariId,setQariId]=useState('all');
 const [rawi,setRawi]=useState('all');
 const [selectedId,setSelectedId]=useState('');
 const load=()=>{setError(false);narratorDirectory({}).then(setData).catch(()=>setError(true));};
 useEffect(()=>{let active=true;narratorDirectory({}).then(result=>{if(active)setData(result);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[]);
 const people=data?.people||[];
 const byId=useMemo(()=>new Map(people.map(p=>[p.id,p])),[people]);
 const chosenQari=QURRA.find(q=>q.id===qariId);
 const filtered=useMemo(()=>people.filter(p=>{
  const matchesQuery=!query.trim()||plain(p.name).includes(plain(query.trim()));
  const matchesQari=qariId==='all'||p.readings.some(r=>r.qariId===qariId&&(rawi==='all'||r.rawi===rawi));
  return matchesQuery&&matchesQari;
 }),[people,query,qariId,rawi]);
 const active=(selectedId?byId.get(selectedId):undefined) ||filtered[0] || undefined;
 const selectPerson=(id:string)=>{setSelectedId(id);setQuery('');setQariId('all');setRawi('all');};
 const rowsFor=(p:Profile)=>QURRA.map(q=>({q,rawis:q.rawis.filter(rawi=>p.readings.some(r=>r.qariId===q.id&&r.rawi===rawi))})).filter(row=>row.rawis.length);
 const relations=(ids:string[],title:string,kind:'teacher'|'student')=><div className="space-y-2">
   <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{title}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{ids.length}</span></div>
   {ids.length? <div className="grid gap-2 sm:grid-cols-2">{ids.map(id=>{
    const person=byId.get(id);if(!person)return null;
    return <button type="button" key={id} onClick={()=>selectPerson(id)} className="group flex min-w-0 items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2.5 text-right text-sm transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-primary">
      <span className="min-w-0 break-words leading-6">{person.name}</span><ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"/>
    </button>;
   })}</div> : <p className="text-sm text-muted-foreground">لا توجد أسماء أخرى موصولة صراحةً في المقاطع المفهرسة.</p>}
 </div>;
 return <div className="space-y-5" dir="rtl">
   <div className="flex flex-wrap items-center justify-between gap-2">
     <div><h2 className="flex items-center gap-2 text-xl font-bold"><Network className="h-5 w-5 text-primary"/> رجال الأسانيد</h2><p className="mt-1 text-sm text-muted-foreground">المشايخ والتلاميذ كما وردوا في أسانيد القراءات العشر وسند الشيخ ذكاء الله</p></div>
     {data&&<span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{people.length} اسمًا</span>}
   </div>
   {error&&<Card><CardContent className="space-y-3 p-5"><p>تعذر تحميل فهرس الأسانيد.</p><Button variant="outline" onClick={load}><RotateCcw className="ml-2 h-4 w-4"/>إعادة المحاولة</Button></CardContent></Card>}
   {!data&&!error&&<div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]"><Skeleton className="h-[360px]"/><Skeleton className="h-[360px]"/></div>}
   {data&&<>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px_180px]">
     <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={e=>{setQuery(e.target.value);setSelectedId('');}} placeholder="ابحث عن اسم راوٍ أو شيخ" className="pr-9"/></div>
     <Select dir="rtl" value={qariId} onValueChange={id=>{setQariId(id);setRawi('all');setSelectedId('');}}><SelectTrigger><SelectValue placeholder="جميع القراءات"/></SelectTrigger><SelectContent><SelectItem value="all">جميع القراءات</SelectItem>{QURRA.map(q=><SelectItem value={q.id} key={q.id}>{q.reading}</SelectItem>)}</SelectContent></Select>
     <Select dir="rtl" disabled={!chosenQari} value={rawi} onValueChange={v=>{setRawi(v);setSelectedId('');}}><SelectTrigger><SelectValue placeholder="جميع الروايات"/></SelectTrigger><SelectContent><SelectItem value="all">كلتا الروايتين</SelectItem>{chosenQari?.rawis.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.3fr)]">
     <Card className="self-start overflow-hidden"><CardContent className="p-2">
       <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground"><span>الأسماء</span><span>{filtered.length}</span></div>
       <div className="max-h-[560px] space-y-1 overflow-y-auto px-1 pb-1" role="listbox" aria-label="رجال الأسانيد">
        {filtered.slice(0,visibleCount).map(p=><button key={p.id} type="button" role="option" aria-selected={active?.id===p.id} onClick={()=>setSelectedId(p.id)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-right transition-colors ${active?.id===p.id?'bg-primary/10 text-foreground':'hover:bg-muted/60'}`}>
          <span className="min-w-0 break-words text-sm leading-6">{p.name}</span><ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground"/>
        </button>)}
        {filtered.length===0&&<p className="py-10 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة</p>}
        {filtered.length>visibleCount&&<Button variant="outline" className="w-full" onClick={()=>setVisibleCount(n=>n+40)}>عرض المزيد من الأسماء</Button>}
       </div>
     </CardContent></Card>
     {active&&<Card className="self-start overflow-hidden"><CardContent className="space-y-6 p-4 sm:p-6">
       <div className="space-y-2 border-b pb-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4"/> راوٍ في الأسانيد</div><h3 className="text-lg font-bold leading-loose sm:text-xl">{active.name}</h3></div>
       {relations(active.teachers,'أخذ عن','teacher')}
       {relations(active.students,'أخذ عنه','student')}
       <div className="space-y-3 border-t pt-5"><h3 className="flex items-center gap-2 font-bold"><BookOpen className="h-4 w-4"/> ورد في القراءات والروايات</h3>
         <div className="space-y-2">{rowsFor(active).map(({q,rawis})=><div key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="font-medium">{q.reading}</span><span className="text-xs text-muted-foreground">{rawis.map(r=>displayRawi(q.id,r)).join('، ')}</span></div>)}</div>
       </div>
       <details className="border-t pt-4 text-sm"><summary className="cursor-pointer font-medium text-muted-foreground">المقاطع المصدرية ({active.sources.length})</summary><div className="mt-3 flex flex-wrap gap-2">{active.sources.map(src=><span key={src} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{sourceTitle(src)}</span>)}</div></details>
     </CardContent></Card>}
    </div>
    <p className="text-xs text-muted-foreground">العلاقات المعروضة مأخوذة من مقاطع الأسانيد المشتركة. المواضع التي لا تصرّح بوصلٍ مباشر لا تُنشأ لها علاقة افتراضية.</p>
   </>}
 </div>;
}
