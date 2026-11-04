import {cleanMatnFormats,type MatnFormat,type MatnStyle} from './matnRichText';
type InlineStyle=Pick<MatnStyle,'bold'|'color'|'sizePt'|'sizePercent'|'font'|'preset'>;
type ParagraphStyle=Omit<MatnStyle,keyof InlineStyle|'target'>;
export type RichDocument={version:2;direction:'rtl';paragraphs:{id:string;style:Partial<ParagraphStyle>;children:{type:'text'|'variable';text:string;style:Partial<InlineStyle>}[];original?:MatnFormat[]}[];legacyBackup:{text:string;formats:MatnFormat[]};warnings:string[]};
/** In-memory adapter only. Persisting the existing array keeps rollback and old clients safe. */
export function fromLegacy(text:string,formats:MatnFormat[]):RichDocument{
 const valid=cleanMatnFormats(text,formats);let offset=0;
 const paragraphs=text.split('\n').map((line,index)=>{
  const start=offset,end=start+line.length;offset=end+1;
  const marks=valid.filter(f=>f.end>start&&f.start<end);
  const layout=marks.find(f=>f.alignment||f.center||f.lastLineAlignment||f.lineSpacing||f.paragraphSpacing!==undefined||f.firstLineIndent!==undefined);
  const {alignment,center,indent,lastLineAlignment,lineSpacing,paragraphSpacing,firstLineIndent}=layout||{};
  const points=new Set([start,end,...marks.flatMap(f=>[Math.max(start,f.start),Math.min(end,f.end)])]);
  for(const m of line.matchAll(/\{\{[^{}\n]+\}\}/gu)){points.add(start+m.index);points.add(start+m.index+m[0].length);}
  const sorted=[...points].sort((a,b)=>a-b);
  const children=sorted.slice(0,-1).map((a,i)=>{const b=sorted[i+1],f=marks.find(f=>f.start<=a&&f.end>=b);const {bold,color,sizePt,sizePercent,font,preset}=f||{};const value=text.slice(a,b);return {type:(/^\{\{[^{}]+\}\}$/u.test(value)?'variable':'text') as 'variable'|'text',text:value,style:{bold,color,sizePt,sizePercent,font,preset}};});
  return {id:`p-${index}`,style:{alignment,center,indent,lastLineAlignment,lineSpacing,paragraphSpacing,firstLineIndent},children,original:marks};
 });
 return {version:2,direction:'rtl',paragraphs,legacyBackup:{text,formats:structuredClone(formats)},warnings:valid.length<formats.length?['Overlapping or stale legacy ranges require review; original retained.']:[]};
}
export function toLegacy(doc:RichDocument){
 const text=doc.paragraphs.map(p=>p.children.map(c=>c.text).join('')).join('\n');
 // Untouched records round-trip losslessly, including unsupported legacy metadata.
 if(text===doc.legacyBackup.text&&JSON.stringify(fromLegacy(text,doc.legacyBackup.formats).paragraphs)===JSON.stringify(doc.paragraphs))return structuredClone(doc.legacyBackup);
 let offset=0;const formats:MatnFormat[]=[];
 for(const p of doc.paragraphs){for(const run of p.children){const start=offset;offset+=run.text.length;formats.push({color:'default',bold:false,center:false,indent:0,...Object.fromEntries(Object.entries(p.style).filter(([,v])=>v!==undefined)),...Object.fromEntries(Object.entries(run.style).filter(([,v])=>v!==undefined)),start,end:offset,text:run.text});}offset++;}
 return {text,formats:cleanMatnFormats(text,formats)};
}
/** UTF-16 positions are expanded to complete graphemes and atomic placeholders. */
export function safeSelection(text:string,start:number,end:number){
 const collapsed=start===end;const boundaries=[0,...Array.from(new Intl.Segmenter('ar',{granularity:'grapheme'}).segment(text),s=>s.index+s.segment.length)];
 start=Math.max(0,Math.min(start,text.length));end=Math.max(start,Math.min(end,text.length));
 start=boundaries.filter(n=>n<=start).at(-1)??0;end=collapsed?start:(boundaries.find(n=>n>=end)??text.length);
 for(const m of text.matchAll(/\{\{[^{}\n]+\}\}/gu)){const a=m.index,b=a+m[0].length;if(start>a&&start<b)start=a;if(end>a&&end<b)end=collapsed?start:b;}
 return {start,end};
}
