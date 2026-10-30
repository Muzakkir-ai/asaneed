import BookTariqBuilder from './BookTariqBuilder';
import {useEffect,useState} from 'react';
import {sanadSections,sectionVersions,type SanadSectionsOutputType,type SectionVersionsOutputType} from '../lib/api';
import {Pencil,ChevronUp} from 'lucide-react';
import {Card,CardContent,CardHeader,CardTitle} from '@project/components/ui/card';
import {Button} from '@project/components/ui/button';
import {toast} from 'sonner';
import SanadTypographyEditor from './SanadTypographyEditor';
import {parseFormatting,type SectionFormatting} from '../lib/sanadFormatting';
type Section=SanadSectionsOutputType['sections'][number];
export default function SanadSectionEditor(){
 const [sections,setSections]=useState<Section[]>([]);
 const [id,setId]=useState('');
 const [body,setBody]=useState('');
 const [formatting,setFormatting]=useState<SectionFormatting>(parseFormatting());
 const [busy,setBusy]=useState(false);
 const [changed,setChanged]=useState(false);
 const [versions,setVersions]=useState<SectionVersionsOutputType['versions']>([]);
 const [showVersions,setShowVersions]=useState(false);
 const load=async()=>setSections((await sanadSections({action:'list'})).sections);

 useEffect(()=>{void load().catch(()=>toast.error('تعذر تحميل المقاطع المشتركة'));},[]);
 const current=sections.find(s=>s.id===id);
 const edit=(s:Section)=>{
   if(id===s.id){setId('');return;}
   setId(s.id);setBody(s.body);setFormatting(parseFormatting(s.formatting));setChanged(false);setVersions([]);setShowVersions(false);
 };
 const history=async()=>{
  if(!current)return;
  try{const result=await sectionVersions({sectionId:current.id});setVersions(result.versions);setShowVersions(v=>!v);}catch{toast.error('تعذر تحميل النسخ السابقة');}
 };
 const restore=(version:SectionVersionsOutputType['versions'][number])=>{
  setBody(version.body);setFormatting(parseFormatting(version.formatting));setChanged(true);setShowVersions(false);
  toast.message('تم تحميل النسخة السابقة في المحرر. اضغط حفظ المدير لتأكيد الاستعادة.');
 };
 const save=async()=>{
   if(!current||!body.trim())return;
   setBusy(true);
   try{
     await sanadSections({action:'save',id:current.id,title:current.title,sectionType:current.sectionType as 'personal',body,formatting,sortOrder:current.sortOrder});
     const latest=await sanadSections({action:'list'});
     setSections(latest.sections);
     const persisted=latest.sections.find(s=>s.id===current.id);
     if(!persisted||persisted.body!==body||!persisted.formatting||JSON.stringify(parseFormatting(persisted.formatting))!==JSON.stringify(formatting))throw new Error('Update was not verified');
     setChanged(false);setId('');toast.success('تم حفظ النص والخط والحجم واللون في قاعدة البيانات والتحقق منها');
   }catch{toast.error('تعذر حفظ المقطع');}finally{setBusy(false);}
 };
 return <Card dir="rtl"><CardHeader><CardTitle>إدارة نصوص وأشكال الأسانيد المشتركة</CardTitle><p className="text-sm text-muted-foreground">اضغط أيقونة القلم لفتح المحرر أسفل المقطع مباشرة. يُحفظ تعديل المدير للمقاطع المشتركة عند تركيب أسانيد جديدة.</p></CardHeader><CardContent className="space-y-3"><BookTariqBuilder/>
 {sections.filter(s=>s.sectionType!=='personal').map(s=><div key={s.id} className="rounded-lg border overflow-hidden">
   <div className="flex justify-between items-center gap-3 px-3 py-2"><div className="space-y-1"><span className="text-sm font-medium">{s.title}</span>{s.formatting&&<p className="text-xs text-muted-foreground">الخط المحفوظ: {parseFormatting(s.formatting).font} — {parseFormatting(s.formatting).size} pt</p>}</div><Button type="button" size="icon" variant={id===s.id?'default':'outline'} aria-label={`تعديل ${s.title}`} aria-expanded={id===s.id} title={id===s.id?'إغلاق التعديل':'تعديل'} onClick={()=>edit(s)}>{id===s.id?<ChevronUp className="h-4 w-4"/>:<Pencil className="h-4 w-4"/>}</Button></div>
   {id===s.id&&<div className="space-y-3 border-t p-3 bg-muted/20"><p className="font-semibold">تعديل: {s.title}</p><SanadTypographyEditor text={body} onTextChange={v=>{setBody(v);setChanged(true);}} formatting={formatting} onFormattingChange={v=>{setFormatting(v);setChanged(true);}}/>
    <p className="text-xs text-muted-foreground">{changed?'تغييرات غير محفوظة — اضغط حفظ المدير':'التنسيق المحفوظ: '+formatting.font+'، '+formatting.size+' pt'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={history}>سجل النسخ السابقة</Button><Button disabled={busy||!body.trim()} onClick={save}>حفظ المدير — النص والتنسيق</Button><Button variant="outline" onClick={()=>setId('')} disabled={busy}>إلغاء</Button></div>
    {showVersions&&<div className="space-y-2 rounded border p-3"><strong>النسخ السابقة للمقطع</strong>{versions.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2"><div className="text-sm"><strong>الإصدار {v.revision}</strong><p className="text-xs text-muted-foreground">{v.savedAt}</p><p className="line-clamp-1 text-xs">{v.body}</p></div><Button size="sm" variant="outline" onClick={()=>restore(v)}>استعادة في المحرر</Button></div>)}</div>}
   </div>}
 </div>)}
 </CardContent></Card>;
}
