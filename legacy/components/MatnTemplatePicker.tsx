import {useState} from 'react';
import {Plus,Save,X} from 'lucide-react';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import {mutoonTemplates} from '../lib/api';
import MatnFormatting,{parseMatnFormat,type MatnFormat} from './MatnFormatting';
import {toast} from 'sonner';
import {useAuth} from 'zitejs/auth';
import {matnDraftKey} from '../lib/matnDraftRecovery';

type Template={id:string;name:string;kind:string;body:string;formatting:string};
export default function MatnTemplatePicker({kind,value,templates,onSelect,onTemplatesChange}:{
 kind:'introduction'|'conclusion';value?:string;templates:Template[];
 onSelect:(id:string)=>void;onTemplatesChange:(templates:Template[])=>void;
}){
 const label=kind==='introduction'?'المقدمة':'الخاتمة';
 const {user}=useAuth();
 const [creating,setCreating]=useState(false),[name,setName]=useState(''),[body,setBody]=useState('');
 const [formats,setFormats]=useState<MatnFormat[]>([]),[reusable,setReusable]=useState(true),[saving,setSaving]=useState(false);
 const save=async()=>{
  if(!name.trim()||!body.trim()){toast.error('أدخل اسم النص ومحتواه');return false;}
  setSaving(true);
  try{
   const result=await mutoonTemplates({action:'save',kind,name:name.trim(),body,formatting:JSON.stringify(formats),reusable});
   const saved=result.templates.find(item=>item.id===result.savedId);
   if(!saved)throw Error('تعذر التحقق من حفظ النص');
   if(user?.id){try{localStorage.removeItem(matnDraftKey(user.id,'new-template:'+kind,label));}catch{}}
   onTemplatesChange(result.templates);onSelect(saved.id);setCreating(false);
   toast.success('حُفظ النص واختير لهذا المتن');return true;
  }catch(error){toast.error(error instanceof Error?error.message:'تعذر حفظ النص');return false;}
  finally{setSaving(false);}
 };
 return <section className="space-y-3" aria-label={'اختيار '+label}>
  <div className="flex flex-wrap items-end gap-2">
   <label className="min-w-0 flex-1 text-sm">{label}
    <select className="mt-1 block w-full rounded border bg-background p-2" value={value||''} disabled={saving} onChange={event=>onSelect(event.target.value)}>
     <option value="">بدون {label}</option>
     {templates.filter(item=>item.kind===kind).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
   </label>
   <Button type="button" variant="outline" disabled={saving} onClick={()=>{setName('');setBody('');setFormats([]);setCreating(true);}}><Plus className="h-4 w-4" aria-hidden="true"/>{kind==='introduction'?'مقدمة جديدة':'خاتمة جديدة'}</Button>
   {value&&!creating&&<Button type="button" variant="outline" onClick={()=>{
    const template=templates.find(item=>item.id===value);if(!template)return;
    setName(template.name.slice(0,140)+' — نسخة');setBody(template.body);setFormats(parseMatnFormat(template.formatting));setCreating(true);
   }}>إنشاء نسخة</Button>}
  </div>
  {creating&&<div className="space-y-3 rounded-lg border p-3">
   <label className="block space-y-1 text-sm">اسم النص<Input value={name} maxLength={150} onChange={event=>setName(event.target.value)}/></label>
   <MatnFormatting label={label} sanad={body} onChange={setBody} formats={formats} onFormatsChange={setFormats} onSave={save} saving={saving} draftKey={'new-template:'+kind}/>
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reusable} onChange={event=>setReusable(event.target.checked)}/>إتاحة هذا النص للمجيزين الآخرين</label>
   <div className="flex flex-wrap gap-2">
    <Button type="button" disabled={saving||!name.trim()||!body.trim()} onClick={()=>void save()}><Save className="h-4 w-4" aria-hidden="true"/>حفظ واختيار</Button>
    <Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={saving} onClick={()=>setCreating(false)}><X className="h-4 w-4" aria-hidden="true"/>إلغاء</Button>
   </div>
  </div>}
 </section>;
}
