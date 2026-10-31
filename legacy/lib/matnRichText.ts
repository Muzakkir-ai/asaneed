export type MatnFormat={text:string;start:number;end:number;color:'primary'|'secondary'|'default';bold:boolean;center:boolean;indent:number;target?:'sanad'|'wording'};
export type MatnStyle=Omit<MatnFormat,'text'|'start'|'end'>;
const same=(a:MatnStyle,b:MatnStyle)=>a.color===b.color&&a.bold===b.bold&&a.center===b.center&&a.indent===b.indent&&a.target===b.target;
export function cleanMatnFormats(text:string,formats:MatnFormat[]){
 const result:MatnFormat[]=[];
 for(const f of [...formats].sort((a,b)=>a.start-b.start)){
  if(!Number.isInteger(f.start)||!Number.isInteger(f.end)||f.start<0||f.end<=f.start||f.end>text.length||text.slice(f.start,f.end)!==f.text)continue;
  const last=result.at(-1);if(last&&f.start<last.end)continue;
  if(last&&last.end===f.start&&same(last,f)){last.end=f.end;last.text=text.slice(last.start,last.end);}else result.push({...f});
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
 if(style.bold||style.color!=='default'||style.center||style.indent)pieces.push({...style,start,end,text:text.slice(start,end)});
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
