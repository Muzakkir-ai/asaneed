import {useEffect,useState} from 'react';
import {riwayahColors,getDashboard,type RiwayahColorsOutputType} from '../lib/api';
import {QURRA,displayRawi,readingText,routeFor} from '../lib/qurra';
import {vocalizeReadingLabel} from '../lib/vocalizedReading';
import {CertificateHeadingPreview} from './CertificateHeading';
import CertificatePrint from './CertificatePrint';
import {Dialog,DialogContent,DialogTitle} from '@project/components/ui/dialog';
import type {Cert,Data} from '../App';
import {matchesArabic} from '../lib/arabicSearch';
import {Button} from '@project/components/ui/button';
import {toast} from 'sonner';
type Entry=RiwayahColorsOutputType['entries'][number];
const hex=/^#[0-9a-fA-F]{6}$/;
const defaults={primaryColor:'#926e35',secondaryColor:'#075f69'};
function Palette({saved,onSaved,label,onFullPreview}:{saved:Entry;onSaved:(e:Entry)=>void;label:string;onFullPreview:(e:Entry)=>Promise<void>}){
 const [draft,setDraft]=useState(saved),[saving,setSaving]=useState(false),[opening,setOpening]=useState(false);
 useEffect(()=>setDraft(saved),[saved.primaryColor,saved.secondaryColor]);
 const dirty=draft.primaryColor.toLowerCase()!==saved.primaryColor.toLowerCase()||draft.secondaryColor.toLowerCase()!==saved.secondaryColor.toLowerCase();
 const valid=hex.test(draft.primaryColor)&&hex.test(draft.secondaryColor);
 const primary=hex.test(draft.primaryColor)?draft.primaryColor:saved.primaryColor;
 const secondary=hex.test(draft.secondaryColor)?draft.secondaryColor:saved.secondaryColor;
 const save=async()=>{if(!valid)return;setSaving(true);try{await riwayahColors({action:'save',entry:draft});onSaved({...draft});toast.success('تم حفظ لوني الرواية');}catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ الألوان');}finally{setSaving(false);}};
 return <article className="palette-card rounded-xl border bg-card p-4 space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{label}</h3>{dirty&&<span role="status" className="text-xs text-muted-foreground">تغييرات غير محفوظة</span>}</div>
  <div className="palette-controls">{(['primaryColor','secondaryColor'] as const).map(field=>{const title=field==='primaryColor'?'اللون الأساسي':'اللون الثانوي';const value=draft[field];return <div key={field} className="palette-control"><span className="palette-control-label">{title}</span><div className="palette-control-row"><input type="color" className="palette-swatch" aria-label={title+' — '+label} value={hex.test(value)?value:saved[field]} onChange={e=>setDraft(p=>({...p,[field]:e.target.value}))}/><input className="palette-hex rounded-md border bg-background font-mono" dir="ltr" aria-label={'HEX '+title+' — '+label} aria-invalid={!hex.test(value)} value={value} maxLength={7} onChange={e=>setDraft(p=>({...p,[field]:e.target.value}))}/></div>{!hex.test(value)&&<span role="alert" className="block text-xs text-destructive">أدخل رمزاً كاملاً مثل #926E35</span>}</div>;})}</div>
  <div className="palette-preview authentic-palette-preview" style={{borderColor:primary}} aria-label={'معاينة ألوان '+label}>
   <div style={{borderColor:secondary}}><CertificateHeadingPreview heading={vocalizeReadingLabel(readingText({qariId:draft.qariId,rawi:draft.rawi})+' '+routeFor([draft.qariId]))} primary={primary} secondary={secondary}/><p className="palette-sample-copy">الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد <span style={{color:secondary}}>ﷺ</span></p><p className="palette-sample-copy">أجزت الطالب <strong style={{color:primary}}>عبد الله بن محمد</strong> بما تلقيته عن شيوخي.</p></div>
  </div>
  <Button variant="outline" disabled={!valid||opening} onClick={async()=>{setOpening(true);try{await onFullPreview({...draft,primaryColor:primary,secondaryColor:secondary});}finally{setOpening(false);}}}>{opening?'جارٍ إعداد المعاينة…':'معاينة شهادة كاملة بهذه الألوان'}</Button>
  <p className="text-xs text-muted-foreground">المعاينة تستخدم عنوان الشهادة نفسه. عرض شهادة كاملة يفتح مسودة موجودة للتجربة دون حفظ الألوان أو اعتمادها.</p>
  <div className="flex flex-wrap gap-2"><Button disabled={!dirty||!valid||saving} onClick={save}>{saving?'جارٍ الحفظ…':'حفظ الألوان'}</Button><Button variant="outline" disabled={!dirty||saving} onClick={()=>setDraft({...saved})}>استعادة الألوان المحفوظة</Button></div>
 </article>;
}
export default function RiwayahColorsEditor(){
 const [colors,setColors]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 const load=()=>{setLoading(true);setError('');riwayahColors({action:'list'}).then(r=>setColors(r.entries)).catch(()=>setError('تعذر تحميل ألوان الروايات')).finally(()=>setLoading(false));};
 useEffect(load,[]);
 const [preview,setPreview]=useState<{cert:Cert;sanad?:Data['asaneed'][number];palette:Entry}|null>(null);
 const openFullPreview=async(palette:Entry)=>{try{const dashboard=await getDashboard({});const cert=dashboard.certificates.find(c=>c.publicationStatus==='draft'&&c.qariId===palette.qariId&&c.rawi===palette.rawi);if(!cert){toast.info('لا توجد مسودة لهذه الرواية في مساحة المجيز المختار. تبقى المعاينة المصغرة متاحة، والشهادات النهائية تحتفظ بألوانها.');return;}setPreview({cert,sanad:dashboard.asaneed.find(s=>s.id===cert.sanadId),palette});}catch(e){toast.error(e instanceof Error?e.message:'تعذر فتح المعاينة');}};
 return <section className="space-y-4" dir="rtl"><div><h2 className="font-bold text-xl">ألوان شهادات الروايات</h2><p className="text-sm text-muted-foreground">جرّب اللونين في المعاينة، ثم احفظ كل رواية بصورة مستقلة. لا تؤثر التغييرات على الشهادات النهائية المحفوظة.</p></div><input className="w-full rounded-md border bg-background p-3" aria-label="بحث الروايات" placeholder="ابحث عن القراءة أو الرواية…" value={search} onChange={e=>setSearch(e.target.value)}/>{loading?<p role="status">جارٍ تحميل الألوان…</p>:error?<div role="alert">{error}<Button onClick={load}>إعادة المحاولة</Button></div>:<div className="grid gap-4 xl:grid-cols-2">{QURRA.flatMap(q=>q.rawis.map(rawi=>{const label=`رواية ${displayRawi(q.id,rawi)} عن ${q.imam}`;if(!matchesArabic(label,search))return null;const saved=colors.find(x=>x.qariId===q.id&&x.rawi===rawi)??{qariId:q.id,rawi,...defaults};return <Palette key={q.id+rawi} label={label} saved={saved} onFullPreview={openFullPreview} onSaved={entry=>setColors(p=>[...p.filter(x=>x.qariId!==entry.qariId||x.rawi!==entry.rawi),entry])}/>;}))}</div>}
  <Dialog open={!!preview} onOpenChange={open=>{if(!open)setPreview(null);}}><DialogContent className="certificate-preview-dialog" aria-describedby={undefined}><DialogTitle className="sr-only">معاينة شهادة كاملة بالألوان غير المحفوظة</DialogTitle>{preview&&<CertificatePrint cert={preview.cert} sanad={preview.sanad} shaykhName={preview.cert.shaykhName} previewPalette={preview.palette} readOnly onClose={()=>setPreview(null)} onFinalized={()=>{}}/>}</DialogContent></Dialog>
 </section>;
}
