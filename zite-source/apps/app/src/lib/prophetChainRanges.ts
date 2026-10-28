/**
 * Locate the CHAIN:<qari>:prophet segment in an already assembled sanad.
 * All ten source chains begin with one of these three expressions and end
 * after عَنْ رَبِّ الْعَالَمِينَ plus the KFGQPC 'b' symbol.
 * Match only the final documented section; never change the source text.
 */
export function prophetChainRanges(text:string):Array<{start:number;end:number}>{
 const starters=['وَقَرَأَ أُبَيُّ','وَهَؤُلَاءِ','وَهَذَانِ'] as const;
 const ending=/عَنْ رَبِّ الْعَالَمِينَ\s*b[.،]?/gu;
 const found:Array<{start:number;end:number}>=[];
 let after=0;
 for(const match of text.matchAll(ending)){
  const end=match.index+match[0].length;
  const begin=Math.max(...starters.map(start=>text.lastIndexOf(start,match.index)));
  if(begin<after||begin<0||end-begin>950)continue;
  const segment=text.slice(begin,end);
  if(/\n\s*\n/u.test(segment))continue;
  found.push({start:begin,end});
  after=end;
 }
 return found;
}
