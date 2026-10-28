import {useRef,useState} from 'react';
import {Button} from '@project/components/ui/button';
import {Textarea} from '@project/components/ui/textarea';
import {defaultSectionFormatting,type SectionFormatting,parseFormatting} from '../lib/sanadFormatting';
const fonts=['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri'] as const;
const colors=[['primary','اللون الأساسي'],['secondary','اللون الثانوي'],['charcoal','أسود فحمي']] as const;
type Font=SectionFormatting['font'];type Color=SectionFormatting['color'];
export default function SanadTypographyEditor({text,onTextChange,formatting,onFormattingChange,allowTextEdit=true,beforeText='',afterText=''}:{text:string;onTextChange:(value:string)=>void;formatting:SectionFormatting;onFormattingChange:(value:SectionFormatting)=>void;allowTextEdit?:boolean;beforeText?:string;afterText?:string}){
 const area=useRef<HTMLTextAreaElement>(null);
 const [phrase,setPhrase]=useState('');
 const [font,setFont]=useState<Font>('Sakkal Kitab');const [size,setSize]=useState(12);const [color,setColor]=useState<Color>('primary');
 const capture=()=>{const e=area.current;if(!e)return;const selected=e.value.slice(e.selectionStart,e.selectionEnd).trim();if(selected){setPhrase(selected);const saved=formatting.phrases.find(p=>p.text===selected);if(saved){setFont(saved.font);setSize(saved.size);setColor(saved.color);}}};
 const control=(value:{font:Font;size:number;color:Color},change:(patch:Partial<typeof value>)=>void)=><div className="flex flex-wrap items-center gap-2 text-sm"><label>الخط <select className="rounded border bg-background p-2" value={value.font} onChange={e=>change({font:e.target.value as Font})}>{fonts.map(f=><option key={f} value={f}>{f}</option>)}</select></label><label>الحجم (pt) <input type="number" min="6" max="30" step="0.5" className="w-20 rounded border p-2" value={value.size} onChange={e=>{const n=Number(e.target.value);if(n>=6&&n<=30)change({size:n});}}/></label><label>اللون <select className="rounded border bg-background p-2" value={value.color} onChange={e=>change({color:e.target.value as Color})}>{colors.map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></label></div>;
 return <div className="space-y-3 rounded-md border p-3" dir="rtl">
  <p className="font-semibold">تنسيق هذا الجزء من السند</p>
  {control(formatting,p=>onFormattingChange({...formatting,...p}))}
  <p className="text-xs text-muted-foreground">هذا الخط الأساسي للجزء، ويمكن تمييز أسماء معينة بخط آخر عن طريق تحديدها في النص. يجب الضغط على زر الحفظ في نهاية المحرر لتثبيت التغييرات.</p>
  {beforeText&&<div className="space-y-1"><p className="font-semibold text-sm">النص الذي يسبق سندك الشخصي</p><div className="max-h-48 overflow-auto whitespace-pre-line rounded border bg-muted/20 p-3 text-right text-sm leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{beforeText}</div></div>}
  <label className="block text-sm font-semibold">سندك الشخصي — يُكتب هنا فقط ويُحفظ لحسابك</label>
  <p className="text-xs text-muted-foreground">ابدأ بسندك الشخصي بعبارة «كما أخذته عن» أو «كما أجازني»، ثم اذكر مشايخك حتى نقطة الالتقاء المحددة.</p>
  <Textarea ref={area} rows={7} placeholder="كما أخذته عن الشيخ... / كما أجازني الشيخ..." value={text} readOnly={!allowTextEdit} className="" onMouseUp={capture} onKeyUp={capture} onChange={e=>onTextChange(e.target.value)} style={{fontFamily:`'${formatting.font}',serif`,fontSize:`${formatting.size}pt`}}/>
  {afterText&&<div className="space-y-1"><p className="font-semibold text-sm">النص الذي يأتي بعد سندك الشخصي</p><div className="max-h-48 overflow-auto whitespace-pre-line rounded border bg-muted/20 p-3 text-right text-sm leading-7" style={{fontFamily:"'KSA Regular',serif"}}>{afterText}</div></div>}
  {phrase&&<div className="space-y-2 rounded border bg-muted/30 p-2"><strong className="text-sm">العبارة المحددة: {phrase.length>75?phrase.slice(0,75)+'…':phrase}</strong>{control({font,size,color},p=>{if(p.font)setFont(p.font);if(p.size)setSize(p.size);if(p.color)setColor(p.color);})}<div className="flex gap-2"><Button size="sm" onClick={()=>onFormattingChange({...formatting,phrases:[...formatting.phrases.filter(x=>x.text!==phrase),{text:phrase,font,size,color}]})}>تطبيق على العبارة</Button><Button size="sm" variant="outline" onClick={()=>{onFormattingChange({...formatting,phrases:formatting.phrases.filter(x=>x.text!==phrase)});setPhrase('');}}>إزالة تنسيق العبارة</Button></div></div>}
  {formatting.phrases.length>0&&<div className="flex flex-wrap gap-2">{formatting.phrases.map(p=><button type="button" className="rounded-md border p-2 text-xs" key={p.text} onClick={()=>{setPhrase(p.text);setFont(p.font);setSize(p.size);setColor(p.color);}}>{p.text.length>32?p.text.slice(0,32)+'…':p.text}</button>)}</div>}
 </div>;
}
