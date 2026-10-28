import {useEffect,useState} from 'react';
import {shaykhPrintProfile,type ShaykhPrintProfileOutputType} from '../lib/api';
import {Input} from '@project/components/ui/input';
import {Textarea} from '@project/components/ui/textarea';
import {Button} from '@project/components/ui/button';
import {Checkbox} from '@project/components/ui/checkbox';
import {toast} from 'sonner';
type Profile=ShaykhPrintProfileOutputType['profile'];
const empty:Profile={footerLineStyles:'',scientificQualification:'',showScientificQualification:true,printedName:'',teachingRole:'مدرس في',madrasaName:'',madrasaPlace:'',centerStampText:'',showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true};
export default function ShaykhPrintProfileForm(){
 const [profile,setProfile]=useState<Profile>(empty);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;shaykhPrintProfile({action:'get'}).then(x=>{if(active)setProfile({...empty,...x.profile,teachingRole:x.profile.teachingRole||'مدرس في'});}).catch(()=>toast.error('تعذر تحميل بيانات المجيز'));return()=>{active=false;};},[]);
 const field=(key:'printedName'|'scientificQualification'|'teachingRole'|'madrasaName'|'madrasaPlace',label:string,placeholder:string)=> <label className="block space-y-1"><span className="text-sm font-medium">{label}</span><Input value={profile[key]} placeholder={placeholder} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/></label>;
 const optionalField=(key:'scientificQualification'|'teachingRole'|'madrasaName'|'madrasaPlace',toggle:'showScientificQualification'|'showTeachingRole'|'showMadrasaName'|'showMadrasaPlace',label:string,placeholder:string)=> <div className="space-y-2"><label className="flex items-center justify-between gap-2"><span className="font-medium text-sm">{label}</span><span className="flex items-center gap-2 text-sm"><Checkbox checked={profile[toggle]} onCheckedChange={value=>setProfile(p=>({...p,[toggle]:value===true}))}/>إظهار في الشهادة</span></label><Input value={profile[key]} placeholder={placeholder} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/></div>;
 const lineKeys=['name','qualification','teaching','place'] as const;
 const lineLabels=['١. اسم المجيز','٢. المجاز بـ','٣. المدرس في مدرسة','٤. مكان المدرسة'];
 const getStyles=()=>{try{return JSON.parse(profile.footerLineStyles||'{}') as Record<string,{bold?:boolean,size?:number}>;}catch{return {} as Record<string,{bold?:boolean,size?:number}>;}};
 const changeLineStyle=(line:string,patch:{bold?:boolean,size?:number})=>{const current=getStyles();setProfile(p=>({...p,footerLineStyles:JSON.stringify({...current,[line]:{...current[line],...patch}})}));};
 const save=async()=>{setBusy(true);try{await shaykhPrintProfile({action:'save',profile});toast.success('تم حفظ بيانات تذييل الشهادة');}catch{toast.error('تعذر حفظ بيانات الشهادة');}finally{setBusy(false);}};
 return <div className="space-y-3 rounded-lg border p-5" dir="rtl"><h2 className="text-lg font-bold">بيانات المجيز في الشهادة</h2><p className="text-xs text-muted-foreground">تُستخدم هذه البيانات في التذييل أسفل الشهادة. إذا تُرك الاسم فارغًا يُستعمل اسم حساب المجيز. يمكنك تحديد ظهور كل سطر بشكل مستقل دون حذف النص المحفوظ.</p>
 {field('printedName','اسم المجيز للطباعة','اسم المجيز')}
 {optionalField('scientificQualification','showScientificQualification','الصفة العلمية / الإجازات','المجاز بالقراءات...')}
 {optionalField('teachingRole','showTeachingRole','صفة التدريس (تُجمع مع المدرسة في سطر واحد)','مدرس في')}
 {optionalField('madrasaName','showMadrasaName','اسم المدرسة (مع صفة التدريس في السطر نفسه)','اسم المدرسة')}
 {optionalField('madrasaPlace','showMadrasaPlace','مكان المدرسة (سطر مستقل)','المدينة أو موقع المدرسة')}
 <div className="rounded-md border p-3 space-y-3"><div className="font-semibold text-sm">تنسيق الأسطر الأربعة في الشهادة</div><p className="text-xs text-muted-foreground">يمكن اختيار الخط الغامق وحجم كل سطر بشكل مستقل. الحجم بالنقاط.</p>
 {lineKeys.map((key,index)=>{const settings=getStyles()[key]||{};return <div key={key} className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">{lineLabels[index]}</span><label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(settings.bold)} onCheckedChange={v=>changeLineStyle(key,{bold:v===true})}/>غامق</label><label className="flex items-center gap-2 text-sm">الحجم <Input className="w-20" type="number" min={7} max={18} step={0.5} value={settings.size??(key==='name'?11:9)} onChange={e=>changeLineStyle(key,{size:Math.min(18,Math.max(7,Number(e.target.value)||9))})}/> pt</label></div>;})}</div>
 <label className="block space-y-1"><span className="text-sm font-medium">النص الأوسط أسفل ختم المجيز (اختياري)</span><Textarea rows={2} value={profile.centerStampText} onChange={e=>setProfile(p=>({...p,centerStampText:e.target.value}))} placeholder="اتركه فارغًا إذا لم ترغب في إضافة نص"/></label>
 <Button disabled={busy} onClick={save}>{busy?'جارٍ الحفظ…':'حفظ بيانات الشهادة'}</Button>
 </div>;
}
