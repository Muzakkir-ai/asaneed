import {z} from 'zod';
import {applyMatnPatch,type MatnFormat} from './matnRichText';
export const fontChoice=z.enum(['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri']);
export const colorChoice=z.enum(['primary','secondary','charcoal']);
export const richSpan=z.object({text:z.string(),start:z.number().int().nonnegative(),end:z.number().int().nonnegative(),bold:z.boolean(),color:z.enum(['default','primary','secondary']),center:z.boolean(),indent:z.number().min(0).max(10),font:fontChoice.optional(),preset:z.string().optional(),alignment:z.enum(['right','center','justify']).optional(),lastLineAlignment:z.enum(['right','center']).optional(),sizePercent:z.number().min(20).max(500).optional(),lineSpacing:z.number().min(1).max(3).optional(),paragraphSpacing:z.number().min(0).max(30).optional(),firstLineIndent:z.number().min(0).max(25).optional()});
export const phraseStyle=z.object({text:z.string().min(1).max(30000),scope:z.string().max(100000).optional(),start:z.number().int().nonnegative().optional(),end:z.number().int().nonnegative().optional(),font:fontChoice,size:z.number().min(6).max(30),color:colorChoice,rich:z.array(richSpan).max(10000).optional()});
export const sectionFormatting=z.object({font:fontChoice,size:z.number().min(6).max(30),color:colorChoice,phrases:z.array(phraseStyle).max(60),rich:z.object({text:z.string().max(100000),formats:z.array(richSpan).max(10000)}).optional()});
export type SectionFormatting=z.infer<typeof sectionFormatting>;
export const defaultSectionFormatting:SectionFormatting={font:'KSA Regular',size:9,color:'charcoal',phrases:[]};
export const parseFormatting=(value?:string|null):SectionFormatting=>{try{return value?sectionFormatting.parse(JSON.parse(value)):defaultSectionFormatting;}catch{return defaultSectionFormatting;}};

/** Scope binds a new selection to its exact source; old phrase-only records stay readable. */
export function scopedPhraseRanges(text:string,phrases:SectionFormatting['phrases']){
 const plain=text.replace(/[\uE100-\uE10B]/gu,'');
 const positions:number[]=[];for(let i=0;i<text.length;i++)if(!/[\uE100-\uE10B]/u.test(text[i]))positions.push(i);
 return phrases.flatMap((p,index)=>{
  if(p.scope===undefined||p.start===undefined||p.end===undefined)return [];
  const base=plain.indexOf(p.scope);if(base<0||plain.indexOf(p.scope,base+1)>=0||p.scope.slice(p.start,p.end)!==p.text)return [];
  let start=positions[base+p.start],last=positions[base+p.end-1];if(start===undefined||last===undefined)return [];
  while(start>0&&/[\uE100\uE102\uE104\uE106\uE108\uE10A]/u.test(text[start-1]))start--;
  while(/[\uE101\uE103\uE105\uE107\uE109\uE10B]/u.test(text[last+1]||''))last++;
  return [{start,end:last+1,index}];
 });
}


export function sectionMatnFormats(text:string,style:SectionFormatting):MatnFormat[]{
 if(style.rich?.text===text)return style.rich.formats;
 let formats:MatnFormat[]=[];
 for(const p of style.phrases){
  const hits=p.scope!==undefined?(p.scope===text&&p.start!==undefined&&p.end!==undefined&&text.slice(p.start,p.end)===p.text?[p.start]:[]):Array.from(text.matchAll(new RegExp(p.text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gu')),m=>m.index);
  for(const start of hits)formats=applyMatnPatch(text,formats,start,start+p.text.length,{font:p.font,bold:p.font==='Sakkal Kitab',color:p.color==='charcoal'?'default':p.color,sizePercent:p.size/style.size*100});
 }
 return formats;
}
export function sectionPrintPhrases(source:string,style:SectionFormatting){
 if(style.rich?.text===source)return [{text:source,scope:source,start:0,end:source.length,font:style.font,size:style.size,color:style.color,rich:style.rich.formats}];
 return style.phrases;
}

/** Save endpoints trim boundary whitespace; map edited rich spans to that exact saved text. */
export function formattingForSavedText(text:string,style:SectionFormatting):SectionFormatting{
 if(!style.rich||style.rich.text===text)return style;
 if(style.rich.text.trim()!==text)return style;
 const offset=style.rich.text.length-style.rich.text.trimStart().length;
 const formats=style.rich.formats.flatMap(f=>{const start=Math.max(0,f.start-offset),end=Math.min(text.length,f.end-offset);return end>start?[{...f,start,end,text:text.slice(start,end)}]:[];});
 return {...style,rich:{text,formats}};
}
