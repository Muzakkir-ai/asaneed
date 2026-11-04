import type {CSSProperties,ReactNode} from 'react';
import {scopedPhraseRanges,type SectionFormatting} from '../lib/sanadFormatting';
import type {MatnFormat} from '../lib/matnRichText';
type Phrase=SectionFormatting['phrases'][number];
const color=(value:string,primary:string,secondary:string)=>value==='primary'?primary:value==='secondary'?secondary:'#303030';
/** Source boundaries produce inline runs; only explicit newlines produce paragraphs. */
export function renderRichSanadFlow(text:string,primary:string,secondary:string,phrases:Phrase[],renderPlain:(text:string)=>ReactNode,conclusionStyle?:CSSProperties){
 const scoped=scopedPhraseRanges(text,phrases);
 const spans:{start:number;end:number;style:CSSProperties;layout?:MatnFormat}[]=[];
 for(const r of scoped){const p=phrases[r.index];spans.push({...r,style:{fontFamily:p.font,fontSize:`calc(${p.size*1.1}pt * var(--certificate-text-scale, 1))`,color:color(p.color,primary,secondary)}});
  for(const f of p.rich||[]){const mapped=scopedPhraseRanges(text,[{...p,text:f.text,start:(p.start||0)+f.start,end:(p.start||0)+f.end}])[0];if(!mapped)continue;spans.push({...mapped,layout:f,style:{fontFamily:f.font||(f.bold?'Sakkal Kitab':p.font),fontWeight:f.bold?700:400,fontSynthesis:'none',fontSize:`calc(${f.sizePt??p.size*1.1*(f.sizePercent||100)/100}pt * var(--certificate-text-scale, 1))`,color:f.color==='default'?color(p.color,primary,secondary):color(f.color,primary,secondary)}});}
 }
 let offset=0;
 return text.split('\n').map((line,index)=>{const start=offset,end=start+line.length;offset=end+1;const active=spans.filter(s=>s.start<end&&s.end>start);const points=[...new Set([start,end,...active.flatMap(s=>[Math.max(start,s.start),Math.min(end,s.end)])])].sort((a,b)=>a-b);
  const content=points.slice(0,-1).map((a,i)=>{const b=points[i+1],marks=active.filter(s=>s.start<=a&&s.end>=b);const value=text.slice(a,b);return marks.length?<span key={a} style={Object.assign({},...marks.map(s=>s.style))}>{renderPlain(value.replace(/[\uE100-\uE10B]/gu,''))}</span>:<span key={a}>{renderPlain(value)}</span>;});
  const layout=active.map(s=>s.layout).find(f=>f&&(f.alignment||f.center||f.lastLineAlignment||f.lineSpacing||f.paragraphSpacing!==undefined||f.firstLineIndent!==undefined||f.indent));
  const layoutStyle=layout?Object.fromEntries(Object.entries({'--certificate-alignment':layout.alignment||(layout.center?'center':undefined),'--certificate-last-alignment':layout.lastLineAlignment??(layout.alignment||layout.center?'auto':undefined),textAlign:layout.alignment||(layout.center?'center':undefined),textAlignLast:layout.lastLineAlignment??(layout.alignment||layout.center?'auto':undefined),lineHeight:layout.lineSpacing,marginBlockEnd:layout.paragraphSpacing===undefined?undefined:`${layout.paragraphSpacing}pt`,textIndent:layout.firstLineIndent===undefined?undefined:`${layout.firstLineIndent}mm`,paddingInlineStart:layout.indent?layout.indent*16:undefined}).filter(([,v])=>v!==undefined)):{};
  const closing=line.includes('هذا، وأوصيه');
  return <div key={index} className={closing?'certificate-conclusion':'certificate-sanad-paragraph'} style={{marginBlockEnd:'var(--certificate-paragraph-gap)',textIndent:'var(--certificate-first-indent)',textAlign:'var(--certificate-alignment, justify)' as CSSProperties['textAlign'],textAlignLast:'var(--certificate-last-alignment, right)' as CSSProperties['textAlignLast'],...(closing?{color:primary,textAlign:'center',...conclusionStyle}:{}),...layoutStyle}}>{content.length?content:<br/>}</div>;
 });
}
