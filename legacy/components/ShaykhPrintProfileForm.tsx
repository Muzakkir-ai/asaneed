import {useEffect,useState} from 'react';
import {shaykhPrintProfile,type ShaykhPrintProfileOutputType} from '../lib/api';
import {Input} from '@project/components/ui/input';
import {Pencil} from 'lucide-react';
import IssuerProfilePreview from './IssuerProfilePreview';
import {Button} from '@project/components/ui/button';
import {Checkbox} from '@project/components/ui/checkbox';
import {toast} from 'sonner';
type Profile=ShaykhPrintProfileOutputType['profile'];
const empty:Profile={footerLineStyles:'',scientificQualification:'',showScientificQualification:true,printedName:'',teachingRole:'مدرس في',madrasaName:'',madrasaPlace:'',centerStampText:'',showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true};
export default function ShaykhPrintProfileForm({onSaved,displayName='',issuerNumber=''}:{onSaved?:()=>void;displayName?:string;issuerNumber?:string}={}){
 const [profile,setProfile]=useState<Profile>(empty);
 const [busy,setBusy]=useState(false);
 const [editing,setEditing]=useState(false);
 const [saved,setSaved]=useState<Profile>(empty);
 const [loaded,setLoaded]=useState(false);
 const [loadFailed,setLoadFailed]=useState(false);
 useEffect(()=>{let active=true;shaykhPrintProfile({action:'get'}).then(x=>{if(active){const value={...empty,...x.profile};setProfile(value);setSaved(value);setLoaded(true);}}).catch(()=>{if(active){setLoadFailed(true);toast.error('تعذر تحميل بيانات المجيز');}});return()=>{active=false;};},[]);
 const field=(key:'printedName'|'scientificQualification'|'teachingRole'|'madrasaName'|'madrasaPlace',label:string,placeholder:string)=> <label className="block space-y-1"><span className="text-sm font-medium">{label}</span><Input value={profile[key]} placeholder={placeholder} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/></label>;
 const optionalField=(key:'scientificQualification'|'teachingRole'|'madrasaName'|'madrasaPlace',toggle:'showScientificQualification'|'showTeachingRole'|'showMadrasaName'|'showMadrasaPlace',label:string,placeholder:string)=> <div className="space-y-2"><label className="flex items-center justify-between gap-2"><span className="font-medium text-sm">{label}</span><span className="flex items-center gap-2 text-sm"><Checkbox checked={profile[toggle]} onCheckedChange={value=>setProfile(p=>({...p,[toggle]:value===true}))}/>إظهار في الشهادة</span></label><Input value={profile[key]} placeholder={placeholder} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/></div>;
 const lineKeys=['name','qualification','teaching','place'] as const;
 const lineLabels=['١. اسم المجيز','٢. المجاز بـ','٣. المدرس في مدرسة','٤. مكان المدرسة'];
 const getStyles=()=>{try{return JSON.parse(profile.footerLineStyles||'{}') as Record<string,{bold?:boolean,size?:number}>;}catch{return {} as Record<string,{bold?:boolean,size?:number}>;}};
 const changeLineStyle=(line:string,patch:{bold?:boolean,size?:number})=>{const current=getStyles();setProfile(p=>({...p,footerLineStyles:JSON.stringify({...current,[line]:{...current[line],...patch}})}));};
 const save=async()=>{setBusy(true);try{await shaykhPrintProfile({action:'save',profile});setSaved(profile);setEditing(false);toast.success('تم حفظ بيانات المجيز');onSaved?.();}catch{toast.error('تعذر حفظ بيانات الشهادة');}finally{setBusy(false);}};
 return <div className="space-y-3 rounded-lg border p-5" dir="rtl"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">بيانات المجيز في الشهادة</h2>{!editing&&<Button variant="outline" size="icon" disabled={!loaded} aria-label="تعديل بيانات المجيز في الشهادة" onClick={()=>setEditing(true)}><Pencil className="h-4 w-4"/></Button>}</div>
 {!loaded?<p role="status">{loadFailed?'تعذر تحميل بيانات المجيز. أعد فتح الصفحة للمحاولة.':'جارٍ التحميل…'}</p>:<IssuerProfilePreview profile={profile} displayName={displayName} issuerNumber={issuerNumber}/>}
 {editing&&<div className="space-y-3"><p className="text-xs text-muted-foreground">هذه البيانات لظهورك في الشهادة. يُستخدم اسم المستخدم إذا تُرك اسم الطباعة فارغًا.</p>
 {field('printedName','اسم المجيز للطباعة','اسم المجيز')}
 {optionalField('scientificQualification','showScientificQualification','الصفة العلمية / الإجازات','المجاز بالقراءات...')}
 {optionalField('teachingRole','showTeachingRole','صفة التدريس (تُجمع مع المدرسة في سطر واحد)','مدرس في')}
 {optionalField('madrasaName','showMadrasaName','اسم المدرسة (مع صفة التدريس في السطر نفسه)','اسم المدرسة')}
 {optionalField('madrasaPlace','showMadrasaPlace','مكان المدرسة (سطر مستقل)','المدينة أو موقع المدرسة')}
 <details className="rounded-md border p-3 space-y-3"><summary className="font-semibold text-sm cursor-pointer">تنسيق الأسطر النصية البديلة (اختياري)</summary><p className="text-xs text-muted-foreground">تُستخدم هذه الخيارات للأسطر النصية فقط عند غياب SVG. لا تغيّر حجم صور الأسماء. الحجم بالنقاط.</p>
 {lineKeys.map((key,index)=>{const settings=getStyles()[key]||{};return <div key={key} className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">{lineLabels[index]}</span><label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(settings.bold)} onCheckedChange={v=>changeLineStyle(key,{bold:v===true})}/>غامق</label><label className="flex items-center gap-2 text-sm">الحجم <Input className="w-20" type="number" min={7} max={18} step={0.5} value={settings.size??(key==='name'?11:9)} onChange={e=>changeLineStyle(key,{size:Math.min(18,Math.max(7,Number(e.target.value)||9))})}/> pt</label></div>;})}</details>
 <div className="flex gap-2"><Button disabled={busy} onClick={save}>{busy?'جارٍ الحفظ…':'حفظ بيانات الشهادة'}</Button><Button variant="outline" disabled={busy} onClick={()=>{setProfile(saved);setEditing(false);}}>إلغاء</Button></div></div>}
 </div>;
}
