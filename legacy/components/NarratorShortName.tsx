import {useState} from 'react';
import {Button} from '@project/components/ui/button';
import {Input} from '@project/components/ui/input';
import type {BuilderPerson} from '../lib/bookBuilder';
export default function NarratorShortName({person,onSave}:{person:BuilderPerson;onSave?:(id:string,value:string)=>Promise<void>}){
 const [value,setValue]=useState(person.display_name||''),[saving,setSaving]=useState(false);
 return <div className="space-y-2"><div className="flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1 text-xs">الاسم المختصر — اختياري<Input maxLength={80} placeholder="مثال: سبط الخياط" value={value} onChange={e=>setValue(e.target.value)}/></label><Button type="button" size="sm" variant="outline" disabled={saving||!onSave||value.trim()===person.display_name} onClick={async()=>{setSaving(true);try{await onSave?.(person.id,value.trim());}finally{setSaving(false);}}}>{saving?'جارٍ الحفظ…':'حفظ المختصر'}</Button></div><p className="text-xs text-muted-foreground">يُستخدم عند تكرار ذكر الراوي مثل «وقرأ سبط الخياط أيضًا على…». يبقى الاسم الكامل في أول السند. اكتب الاسم المناسب بعد «وقرأ».</p></div>;
}
