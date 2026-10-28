import {useEffect,useState} from 'react';
import {riwayahColors,type RiwayahColorsOutputType} from '../lib/api';
import {QURRA,displayRawi} from '../lib/qurra';
import {Button} from '@project/components/ui/button';
import {toast} from 'sonner';
type Entry=RiwayahColorsOutputType['entries'][number];
const DEFAULT_PRIMARY='#926e35';
const DEFAULT_SECONDARY='#075f69';
export default function RiwayahColorsEditor(){
 const [colors,setColors]=useState<Entry[]>([]);
 const [saving,setSaving]=useState('');
 const [hexDrafts,setHexDrafts]=useState<Record<string,string>>({});
 useEffect(()=>{riwayahColors({action:'list'}).then(r=>setColors(r.entries)).catch(()=>toast.error('تعذر تحميل ألوان الروايات'));},[]);
 const get=(qariId:string,rawi:string)=>colors.find(x=>x.qariId===qariId&&x.rawi===rawi)||{qariId,rawi,primaryColor:DEFAULT_PRIMARY,secondaryColor:DEFAULT_SECONDARY};
 const update=(qariId:string,rawi:string,field:'primaryColor'|'secondaryColor',value:string)=>setColors(p=>{const old=p.find(x=>x.qariId===qariId&&x.rawi===rawi);return [...p.filter(x=>!(x.qariId===qariId&&x.rawi===rawi)),{...(old||{qariId,rawi,primaryColor:DEFAULT_PRIMARY,secondaryColor:DEFAULT_SECONDARY}),[field]:value}];});
 const editHex=(entry:Entry,field:'primaryColor'|'secondaryColor',value:string)=>{
   const key=entry.qariId+':'+entry.rawi+':'+field;
   setHexDrafts(prev=>({...prev,[key]:value}));
   if(/^#[0-9a-fA-F]{6}$/.test(value))update(entry.qariId,entry.rawi,field,value.toLowerCase());
 };
 const hexField=(entry:Entry,field:'primaryColor'|'secondaryColor',label:string)=>{
   const key=entry.qariId+':'+entry.rawi+':'+field;
   const value=hexDrafts[key]??entry[field];
   const valid=/^#[0-9a-fA-F]{6}$/.test(value);
   return <label className="flex flex-col gap-1 text-sm">{label}<div className="flex items-center gap-2"><input type="color" aria-label={label+' '+entry.rawi} value={entry[field]} onChange={e=>{update(entry.qariId,entry.rawi,field,e.target.value);setHexDrafts(p=>{const next={...p};delete next[key];return next;});}}/><input dir="ltr" className={'w-28 rounded border px-2 py-1 font-mono text-sm '+(!valid?'border-red-500':'')} aria-label={'HEX '+label+' '+entry.rawi} value={value} maxLength={7} onChange={e=>editHex(entry,field,e.target.value)} onBlur={()=>{if(!valid)toast.error('Enter a valid HEX color, e.g. #926E35');}} /></div></label>;
 };
 const save=async(entry:Entry)=>{const key=entry.qariId+entry.rawi;setSaving(key);try{const result=await riwayahColors({action:'save',entry});setColors(result.entries);toast.success('تم حفظ لوني الرواية');}catch{toast.error('تعذر حفظ ألوان الرواية');}finally{setSaving('');}};
 return <section className="rounded-lg border p-4 space-y-3" dir="rtl"><h2 className="font-bold text-lg">ألوان شهادات الروايات (للمدير)</h2><p className="text-sm text-muted-foreground">اختر اللونين لكل رواية، أو أدخل رمز HEX مثل #926E35. تُحفظ الألوان لكل رواية بصورة مستقلة.</p><div className="grid gap-3 md:grid-cols-2">{QURRA.flatMap(q=>q.rawis.map(rawi=>{const entry=get(q.id,rawi);const primaryDraft=hexDrafts[entry.qariId+':'+entry.rawi+':primaryColor']??entry.primaryColor;const secondaryDraft=hexDrafts[entry.qariId+':'+entry.rawi+':secondaryColor']??entry.secondaryColor;return <div key={q.id+rawi} className="rounded-md border p-3 space-y-2"><p className="font-medium text-sm">رواية {displayRawi(q.id,rawi)} عن {q.imam}</p><div className="flex items-end justify-between flex-wrap gap-2">{hexField(entry,'primaryColor','اللون الأساسي')}{hexField(entry,'secondaryColor','اللون الثانوي')}<Button size="sm" disabled={saving===q.id+rawi||![primaryDraft,secondaryDraft].every(v=>/^#[0-9a-fA-F]{6}$/.test(v))} onClick={()=>save(entry)}>حفظ</Button></div></div>;}))}</div></section>;
}
