import {useEffect,useState} from 'react';
import {riwayahColors,type RiwayahColorsOutputType} from '../lib/api';
import {QURRA,displayRawi} from '../lib/qurra';
import {matchesArabic} from '../lib/arabicSearch';
import {Button} from '@project/components/ui/button';
import {toast} from 'sonner';
type Entry=RiwayahColorsOutputType['entries'][number];
const hex=/^#[0-9a-fA-F]{6}$/;
const defaults={primaryColor:'#926e35',secondaryColor:'#075f69'};
function Palette({saved,onSaved,label}:{saved:Entry;onSaved:(e:Entry)=>void;label:string}){
 const [draft,setDraft]=useState(saved),[saving,setSaving]=useState(false);
 useEffect(()=>setDraft(saved),[saved.primaryColor,saved.secondaryColor]);
 const dirty=draft.primaryColor.toLowerCase()!==saved.primaryColor.toLowerCase()||draft.secondaryColor.toLowerCase()!==saved.secondaryColor.toLowerCase();
 const valid=hex.test(draft.primaryColor)&&hex.test(draft.secondaryColor);
 const primary=hex.test(draft.primaryColor)?draft.primaryColor:saved.primaryColor;
 const secondary=hex.test(draft.secondaryColor)?draft.secondaryColor:saved.secondaryColor;
 const save=async()=>{if(!valid)return;setSaving(true);try{await riwayahColors({action:'save',entry:draft});onSaved({...draft});toast.success('تم حفظ لوني الرواية');}catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ الألوان');}finally{setSaving(false);}};
 return <article className="palette-card rounded-xl border bg-card p-4 space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{label}</h3>{dirty&&<span role="status" className="text-xs text-muted-foreground">تغييرات غير محفوظة</span>}</div>
  <div className="grid gap-4 sm:grid-cols-2">{(['primaryColor','secondaryColor'] as const).map(field=>{const title=field==='primaryColor'?'اللون الأساسي':'اللون الثانوي';const value=draft[field];return <label key={field} className="block space-y-2 text-sm"><span>{title}</span><input type="color" className="palette-swatch" aria-label={title+' — '+label} value={hex.test(value)?value:saved[field]} onChange={e=>setDraft(p=>({...p,[field]:e.target.value}))}/><input className="w-full rounded-md border bg-background p-3 font-mono" dir="ltr" aria-label={'HEX '+title+' — '+label} aria-invalid={!hex.test(value)} value={value} maxLength={7} onChange={e=>setDraft(p=>({...p,[field]:e.target.value}))}/>{!hex.test(value)&&<span role="alert" className="block text-xs text-destructive">أدخل رمزاً كاملاً مثل #926E35</span>}</label>;})}</div>
  <div className="palette-preview" style={{borderColor:primary}} aria-label={'معاينة ألوان '+label}>
   <div style={{borderColor:secondary}}><p style={{color:primary}} className="font-bold text-lg">إجازة {label}</p><p className="my-3">الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد <span style={{color:secondary}}>ﷺ</span></p><p>أجزت الطالب <strong style={{color:primary}}>عبد الله بن محمد</strong> بما تلقيته عن شيوخي.</p><p className="mt-3" style={{color:primary}}>المُجيز · اسم الشيخ</p><p style={{color:secondary}}>تعريف الشيخ ومقر الإقراء</p></div>
  </div>
  <p className="text-xs text-muted-foreground">العناوين والأسماء باللون الأساسي، والصلاة على النبي وعناصر التعريف باللون الثانوي، كما في قواعد الشهادة. هذه معاينة للألوان فقط.</p>
  <div className="flex flex-wrap gap-2"><Button disabled={!dirty||!valid||saving} onClick={save}>{saving?'جارٍ الحفظ…':'حفظ الألوان'}</Button><Button variant="outline" disabled={!dirty||saving} onClick={()=>setDraft({...saved})}>استعادة الألوان المحفوظة</Button></div>
 </article>;
}
export default function RiwayahColorsEditor(){
 const [colors,setColors]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 const load=()=>{setLoading(true);setError('');riwayahColors({action:'list'}).then(r=>setColors(r.entries)).catch(()=>setError('تعذر تحميل ألوان الروايات')).finally(()=>setLoading(false));};
 useEffect(load,[]);
 return <section className="space-y-4" dir="rtl"><div><h2 className="font-bold text-xl">ألوان شهادات الروايات</h2><p className="text-sm text-muted-foreground">جرّب اللونين في المعاينة، ثم احفظ كل رواية بصورة مستقلة. لا تؤثر التغييرات على الشهادات النهائية المحفوظة.</p></div><input className="w-full rounded-md border bg-background p-3" aria-label="بحث الروايات" placeholder="ابحث عن القراءة أو الرواية…" value={search} onChange={e=>setSearch(e.target.value)}/>{loading?<p role="status">جارٍ تحميل الألوان…</p>:error?<div role="alert">{error}<Button onClick={load}>إعادة المحاولة</Button></div>:<div className="grid gap-4 xl:grid-cols-2">{QURRA.flatMap(q=>q.rawis.map(rawi=>{const label=`رواية ${displayRawi(q.id,rawi)} عن ${q.imam}`;if(!matchesArabic(label,search))return null;const saved=colors.find(x=>x.qariId===q.id&&x.rawi===rawi)??{qariId:q.id,rawi,...defaults};return <Palette key={q.id+rawi} label={label} saved={saved} onSaved={entry=>setColors(p=>[...p.filter(x=>x.qariId!==entry.qariId||x.rawi!==entry.rawi),entry])}/>;}))}</div>}</section>;
}
