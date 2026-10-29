/** Locate the imam/raawi identification immediately following على or عن
 * and ending at صاحب القراءة / صاحب الرواية, with or without Arabic vowel marks.
 * Returns offsets into the ORIGINAL text, so no sanad characters are altered. */
export function sanadTitleRanges(text:string):Array<{start:number;end:number}>{
  const cleanChars:string[]=[];
  const offsets:number[]=[];
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(/[\u064b-\u065f\u0670\u06d6-\u06ed]/u.test(char))continue;
    cleanChars.push(char);
    offsets.push(i);
  }
  const plain=cleanChars.join('');
  const result:Array<{start:number;end:number}>=[];
  const endings=/صاحب\s+(?:الرواية|القراءة)/gu;
  for(const hit of plain.matchAll(endings)){
    const endIndex=hit.index+hit[0].length;
    // Both "على الإمام ..." and "عن الإمام ..." introduce a named
    // صاحب الرواية / صاحب القراءة. Require a real word boundary so names
    // containing similar letters are not mistakenly used as connectors.
    const connectors=plain.slice(0,hit.index).matchAll(/(?:^|[\s،؛.])(?:على|عن)\s+/gu);
    let beginning=-1;
    for(const link of connectors)beginning=link.index+link[0].length;
    if(beginning<0||hit.index-beginning>260)continue;
    const between=plain.slice(beginning,hit.index);
    // Don't span intermediate sanad links or paragraph boundaries.
    if(!between.trim()||/[،؛.\n\uE100\uE101]/u.test(between))continue;
    const start=offsets[beginning];
    const end=(offsets[endIndex]??text.length);
    if(start===undefined||end<=start||result.some(x=>start<x.end))continue;
    result.push({start,end});
  }
  return result;
}

/**
 * Full names of Imam al-Shatibi and al-Hafiz al-Dani.
 * Match with or without vowel marks/tatweel, but return offsets in the ORIGINAL
 * text so printing never changes the sanad's letters or tashkeel.
 * They use Ibn al-Jazari's emphasized print treatment: Sakkal Kitab 10pt, primary color.
 */
const scholarsToEmphasize=[
 'إِمَامِ القُرَّاءِ أَبِي مُحَمَّدٍ القَاسِـمِ بنِ فِيرُّهْ الشَّاطِبِيِّ',
 'الحَافِظِ أَبِي عَمرٍو عُثمَانَ بنِ سَعِيدٍ الدَّانِيِّ',
] as const;
const plainScholarChar=(ch:string)=>
 ch.replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي');
const strippedScholar=(value:string)=>value
 .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/gu,'')
 .replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي')
 .replace(/\s+/gu,' ').trim();

export function scholarlyNameRanges(text:string,names:readonly string[]=scholarsToEmphasize):Array<{start:number;end:number}>{
 const letters:string[]=[];
 const index:number[]=[];
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/u.test(ch))continue;
  if(/\s/u.test(ch)){
   if(!letters.length||letters[letters.length-1]===' ')continue;
   letters.push(' ');index.push(i);
  }else{
   letters.push(plainScholarChar(ch));index.push(i);
  }
 }
 const plain=letters.join('');
 const found:Array<{start:number;end:number}>=[];
 for(const name of names){
  if(!name.trim())continue;
  const target=strippedScholar(name);
  let pos=0;
  while((pos=plain.indexOf(target,pos))!==-1){
   const start=index[pos],end=index[pos+target.length]??text.length;
   if(start!==undefined&&end>start)found.push({start,end});
   pos+=target.length;
  }
 }
 return found.sort((a,b)=>a.start-b.start);
}

/** The single Ibn al-Jazari name directly after "وهم على". */
export function jazariAfterWahumRanges(text:string):Array<{start:number;end:number}>{
 const name='إِمَامِ المُقرِئِينَ أَبِي الخَيرِ مُحَمَّدِ بنِ مُحَمَّدٍ الجَزَرِيِّ';
 const ranges:Array<{start:number;end:number}>=[];
 const marker='وهم على';
 let at=0;
 while((at=text.indexOf(marker,at))>=0){
   let start=at+marker.length;
   while(/\s/u.test(text[start]||''))start++;
   if(text.startsWith(name,start))ranges.push({start,end:start+name.length});
   at=start+1;
 }
 return ranges;
}

/** Display-only light vowel marks for the recognized qari/raawi identification.
 * Preserve narrator spellings and existing tashkeel, which may differ by source.
 * These are modest grammatical marks, not historical isnad proofreading. */
export function lightVocalizeTitle(input:string):string {
 return input
  .replace(/صاحب\s+الرواية/gu,'صَاحِبِ الرِّوَايَةِ')
  .replace(/صاحب\s+القراءة/gu,'صَاحِبِ القِرَاءَةِ')
  .replace(/الإمام(?![\u064b-\u065f])/gu,'الإِمَامِ')
  .replace(/(?<![\u064b-\u065f])أبي(?=\s)/gu,'أَبِي');
}
