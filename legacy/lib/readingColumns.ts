import {displayReadingLabel} from './qurra';
/** Display-only administrative columns. Preserve full vowelled headings for print. */
const cleanListName=(value:string)=>value
 .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/gu,'')
 .replace(/\bالإمام\s+/gu,'')
 .replace(/\bالامام\s+/gu,'')
 .replace(/خلف\s+العاشر/gu,'خلف البزار')
 .replace(/\s+/gu,' ').trim();
export function readingColumns(heading:string){
 const input=displayReadingLabel(heading.trim());
 const noMarks:{plain:string;offsets:number[]}={plain:'',offsets:[]};
 for(let i=0;i<input.length;i++){
   if(/[\u064b-\u065f\u0670\u06d6-\u06ed]/u.test(input[i]))continue;
   noMarks.plain+=input[i];noMarks.offsets.push(i);
 }
 const plain=noMarks.plain;
 const intro=plain.match(/^\s*(?:ب?رواية|ب?قراءة)\s+/u);
 if(!intro)return {riwayah:cleanListName(input),qiraah:'',tareeq:''};
 const match=plain.match(/\s+عن\s+/u);
 const from=plain.match(/\s+من\s+طريقي?\s+/u);
 const value=(start:number,end:number)=>input.slice(noMarks.offsets[start]??input.length,noMarks.offsets[end]??input.length).trim();
 const riwayah=value(intro[0].length,match?.index??from?.index??plain.length);
 const qiraah=match?value((match.index??0)+match[0].length,from?.index??plain.length):'';
 const tareeq=from?value((from.index??0)+from[0].length,plain.length):'';
 return {riwayah:cleanListName(riwayah),qiraah:cleanListName(qiraah),tareeq:cleanListName(tareeq)};
}
