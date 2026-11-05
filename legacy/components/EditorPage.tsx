import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {ArrowRight,Save} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@project/components/ui/dialog';
/** One page frame for editing personal and shared content. Pickers remain dialogs. */
export default function EditorPage({title,context,backLabel='العودة إلى القائمة',onBack,onSave,busy=false,saveDisabled=false,saveLabel='حفظ التعديلات',dirtyKey,saveRevision,children,viewOnly=false}:{title:string;context?:string;backLabel?:string;onBack:()=>void;onSave?:()=>void|boolean|Promise<void|boolean>;busy?:boolean;saveDisabled?:boolean;saveLabel?:string;dirtyKey?:string;saveRevision?:number;children:ReactNode;viewOnly?:boolean}){
 const heading=useRef<HTMLHeadingElement>(null),initial=useRef(dirtyKey),id=useId();
 const [discard,setDiscard]=useState(false),[savedKey,setSavedKey]=useState<string|undefined>();
 useEffect(()=>{if(saveRevision!==undefined)setSavedKey(dirtyKey);},[saveRevision]);
 const dirty=dirtyKey!==undefined&&dirtyKey!==(savedKey??initial.current);
 useEffect(()=>{heading.current?.focus();heading.current?.scrollIntoView?.({block:'start'});},[]);
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 const back=()=>{if(busy)return;if(dirty)setDiscard(true);else onBack();};
 const save=async()=>{if(!onSave||busy||saveDisabled)return;const result=await onSave();if(result===true)setSavedKey(dirtyKey);};
 return <section className="editor-page" aria-labelledby={id} dir="rtl">
  <header className="editor-page-header"><div className="editor-page-heading"><Button type="button" variant="ghost" onClick={back} disabled={busy} className="gap-2"><ArrowRight aria-hidden="true"/>{backLabel}</Button><div><p className="editor-page-context">{context}</p><h2 ref={heading} tabIndex={-1} id={id}>{title}</h2></div></div>
   <div className="editor-page-actions">{dirty&&<span role="status" className="text-xs text-muted-foreground">تغييرات غير محفوظة</span>}{onSave&&<Button type="button" disabled={busy||saveDisabled} onClick={()=>void save()}><Save aria-hidden="true"/>{busy?'جارٍ الحفظ…':saveLabel}</Button>}{!viewOnly&&<Button type="button" variant="outline" disabled={busy} onClick={back}>إلغاء والعودة</Button>}</div>
  </header>
  <div className="editor-page-body">{!viewOnly&&<details className="rounded-lg border p-3 text-sm mb-4"><summary className="cursor-pointer font-medium">كيف أستخدم هذه الصفحة؟</summary><ol className="list-decimal list-inside mt-2 space-y-1"><li>تأكد من اسم المتن أو السند وصاحب الملف أعلى الصفحة.</li><li>اختر القسم المطلوب وعدّل النص أو التنسيق، ثم راجع المعاينة إن وُجدت.</li><li>اضغط حفظ لتثبيت التغييرات. استخدم العودة للرجوع إلى القائمة أو الملف.</li></ol></details>}{children}</div>
  <Dialog open={discard} onOpenChange={setDiscard}><DialogContent dir="rtl"><DialogHeader><DialogTitle>هل تريد مغادرة التعديل؟</DialogTitle></DialogHeader><p>لديك تغييرات لم تُحفظ. يمكنك متابعة التعديل أو تجاهلها والعودة.</p><div className="flex flex-wrap gap-2"><Button onClick={()=>setDiscard(false)}>متابعة التعديل</Button><Button variant="outline" onClick={()=>{setDiscard(false);onBack();}}>تجاهل التغييرات والعودة</Button></div></DialogContent></Dialog>
 </section>;
}
