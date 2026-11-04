export type MatnFormat={font?:'KSA Regular'|'Sakkal Kitab'|'Majalla'|'Bahij Muna'|'Amiri';preset?:string;text:string;start:number;end:number;color:'primary'|'secondary'|'default';bold:boolean;center:boolean;indent:number;target?:'sanad'|'wording';lastLineAlignment?:'right'|'center';sizePercent?:number;lineSpacing?:number;paragraphSpacing?:number;firstLineIndent?:number;alignment?:'right'|'center'|'justify'};
export type MatnStyle=Omit<MatnFormat,'text'|'start'|'end'>;
const same=(a:MatnStyle,b:MatnStyle)=>a.font===b.font&&a.preset===b.preset&&a.color===b.color&&a.bold===b.bold&&a.center===b.center&&a.indent===b.indent&&a.target===b.target&&a.lastLineAlignment===b.lastLineAlignment&&a.sizePercent===b.sizePercent&&a.lineSpacing===b.lineSpacing&&a.paragraphSpacing===b.paragraphSpacing&&a.firstLineIndent===b.firstLineIndent&&a.alignment===b.alignment;
export function cleanMatnFormats(text:string,formats:MatnFormat[]){
 const result:MatnFormat[]=[];
 const valid=formats.filter(f=>Number.isInteger(f.start)&&Number.isInteger(f.end)&&f.start>=0&&f.end>f.start&&f.end<=text.length&&text.slice(f.start,f.end)===f.text);
 const points=[...new Set(valid.flatMap(f=>[f.start,f.end]))].sort((a,b)=>a-b);
 for(let i=0;i<points.length-1;i++){
  const start=points[i],end=points[i+1],active=valid.filter(f=>f.start<=start&&f.end>=end);if(!active.length)continue;
  const f={...Object.assign({},...active),start,end,text:text.slice(start,end)} as MatnFormat;
  const last=result.at(-1);if(last&&last.end===start&&same(last,f)){last.end=end;last.text=text.slice(last.start,end);}else result.push(f);
 }
 return result;
}
export function setMatnStyle(text:string,formats:MatnFormat[],start:number,end:number,style:MatnStyle){
 start=Math.max(0,Math.min(text.length,start));end=Math.max(start,Math.min(text.length,end));if(start===end)return cleanMatnFormats(text,formats);
 const pieces:MatnFormat[]=[];
 for(const f of cleanMatnFormats(text,formats)){
  if(f.end<=start||f.start>=end)pieces.push(f);
  else{if(f.start<start)pieces.push({...f,end:start,text:text.slice(f.start,start)});if(f.end>end)pieces.push({...f,start:end,text:text.slice(end,f.end)});}
 }
 if(style.font||style.preset||style.bold||style.color!=='default'||style.center||style.indent||style.sizePercent||style.lineSpacing||style.paragraphSpacing!==undefined||style.firstLineIndent!==undefined||style.alignment||style.lastLineAlignment)pieces.push({...style,start,end,text:text.slice(start,end)});
 return cleanMatnFormats(text,pieces);
}
/** Rebase spans around a contiguous text edit; typing inherits the nearby span. */
export function editMatnFormats(before:string,after:string,formats:MatnFormat[]){
 const valid=cleanMatnFormats(before,formats);if(before===after)return valid;
 let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 let oldEnd=before.length,newEnd=after.length;while(oldEnd>start&&newEnd>start&&before[oldEnd-1]===after[newEnd-1]){oldEnd--;newEnd--;}
 const delta=newEnd-oldEnd,pieces:MatnFormat[]=[];
 const inherit=valid.find(f=>f.start<=start&&f.end>start)||valid.find(f=>f.start<start&&f.end===start);
 for(const f of valid){
  if(f.end<=start)pieces.push(f);
  else if(f.start>=oldEnd)pieces.push({...f,start:f.start+delta,end:f.end+delta,text:after.slice(f.start+delta,f.end+delta)});
  else{if(f.start<start)pieces.push({...f,end:start,text:after.slice(f.start,start)});if(f.end>oldEnd)pieces.push({...f,start:newEnd,end:f.end+delta,text:after.slice(newEnd,f.end+delta)});}
 }
 if(newEnd>start&&inherit)pieces.push({...inherit,start,end:newEnd,text:after.slice(start,newEnd)});
 return cleanMatnFormats(after,pieces);
}

/** Apply a patch without losing different colors, weights or sizes inside a paragraph. */
export function applyMatnPatch(text:string,formats:MatnFormat[],start:number,end:number,patch:Partial<MatnStyle>){
 const valid=cleanMatnFormats(text,formats),points=[...new Set([start,end,...valid.flatMap(f=>[f.start,f.end]).filter(p=>p>start&&p<end)])].sort((a,b)=>a-b);let result=valid;
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],base=valid.find(f=>f.start<=a&&f.end>a);result=setMatnStyle(text,result,a,b,{color:'default',bold:false,center:false,indent:0,...base,...patch});}return result;
}
