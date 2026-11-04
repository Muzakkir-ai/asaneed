import MatnFormatting from './MatnFormatting';
import {sectionMatnFormats,rebaseSectionFormatting} from '../lib/sanadFormatting';
import {useRef} from 'react';
import {type SectionFormatting} from '../lib/sanadFormatting';
const fonts=['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri'] as const;
const colors=[['primary','اللون الأساسي'],['secondary','اللون الثانوي'],['charcoal','أسود فحمي']] as const;
type Font=SectionFormatting['font'];type Color=SectionFormatting['color'];
export default function SanadTypographyEditor({text,onTextChange,formatting,onFormattingChange,allowTextEdit=true,beforeText='',afterText='',label='سندك الشخصي',personal=true}:{text:string;onTextChange:(value:string)=>void;formatting:SectionFormatting;onFormattingChange:(value:SectionFormatting)=>void;label?:string;personal?:boolean;allowTextEdit?:boolean;beforeText?:string;afterText?:string}){
 const pendingText=useRef(text);
 const control=(value:{font:Font;size:number;color:Color},change:(patch:Partial<typeof value>)=>void)=><div className="flex flex-wrap items-center gap-2 text-sm"><label>الخط <select className="rounded border bg-background p-2" value={value.font} onChange={e=>change({font:e.target.value as Font})}>{fonts.map(f=><option key={f} value={f}>{f}</option>)}</select></label><label>الحجم (pt) <input type="number" min="6" max="30" step="0.5" className="w-20 rounded border p-2" value={value.size} onChange={e=>{const n=Number(e.target.value);if(n>=6&&n<=30)change({size:n});}}/></label><label>اللون <select className="rounded border bg-background p-2" value={value.color} onChange={e=>change({color:e.target.value as Color})}>{colors.map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></label></div>;
 return <div className="space-y-3 rounded-md border p-3" dir="rtl">
  <p className="font-semibold">تنسيق هذا الجزء من السند</p>
  <details><summary>الخط الأساسي للجزء</summary>{control(formatting,p=>onFormattingChange({...formatting,...p}))}</details>
  <p className="text-xs text-muted-foreground">هذا الخط الأساسي للجزء، ويمكن تمييز أسماء معينة بخط آخر عن طريق تحديدها في النص. يجب الضغط على زر الحفظ في نهاية المحرر لتثبيت التغييرات.</p>
  {beforeText&&<div className="space-y-1"><p className="font-semibold text-sm">النص الذي يسبق سندك الشخصي</p><div className="max-h-48 overflow-auto whitespace-pre-line rounded border bg-muted/20 p-3 text-right text-sm leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{beforeText}</div></div>}
  <label className="block text-sm font-semibold">{personal?'سندك الشخصي — يُكتب هنا فقط ويُحفظ لحسابك':label}</label>
  {personal&&<p className="text-xs text-muted-foreground">ابدأ بسندك الشخصي بعبارة «كما أخذته عن» أو «كما أجازني»، ثم اذكر مشايخك حتى نقطة الالتقاء المحددة.</p>}
  <MatnFormatting label={label} readOnly={!allowTextEdit} baseFont={formatting.font} baseSize={formatting.size} baseColor={formatting.color==='charcoal'?'inherit':`hsl(var(--${formatting.color}))`} sanad={text} onChange={value=>{pendingText.current=value;onTextChange(value);}} formats={sectionMatnFormats(text,formatting)} onFormatsChange={formats=>onFormattingChange({...rebaseSectionFormatting(text,pendingText.current,formatting),rich:{text:pendingText.current,formats}})}/>

  {afterText&&<div className="space-y-1"><p className="font-semibold text-sm">النص الذي يأتي بعد سندك الشخصي</p><div className="max-h-48 overflow-auto whitespace-pre-line rounded border bg-muted/20 p-3 text-right text-sm leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{afterText}</div></div>}

 </div>;
}
