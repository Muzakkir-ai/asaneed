/** Return offsets from the original (fully vowelized) source, not a rewritten copy. */
export function ijazahWordingRanges(text:string):Array<{start:number;end:number}>{
 const letters:string[]=[];const positions:number[]=[];
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(/[\u064b-\u065f\u0670\u0640]/u.test(ch))continue;
  letters.push(ch.replace(/[أإآٱ]/u,'ا').replace('ى','ي'));positions.push(i);
 }
 const plain=letters.join('');
 const ranges:Array<{start:number;end:number}>=[];
 for(const m of plain.matchAll(/(?:فاجزته|اجبته الي ذلك|فاجزته بعد|فاجزته بان)[\s\S]{0,600}?ارب(?:اب)? هذا الفن/gu)){
  const begin=positions[m.index],stop=positions[m.index+m[0].length]??text.length;
  if(begin!==undefined&&stop>begin)ranges.push({start:begin,end:stop});
 }
 return ranges;
}
