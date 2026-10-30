import {QURRA,displayRawi} from './qurra';
/** Display labels only: persisted technical titles are lookup keys. */
export function sectionDisplayTitle(title:string){
 const match=title.match(/^CHAIN:([^:]+):(.+)$/u);
 if(!match)return title;
 const q=QURRA.find(q=>q.id===match[1]);
 if(!q)return 'مقطع سند مشترك';
 return `${q.reading} — ${match[2]==='sahaba'?'السند إلى الصحابة':match[2]==='prophet'?'السند إلى النبي ﷺ':'رواية '+displayRawi(q.id,match[2])}`;
}
