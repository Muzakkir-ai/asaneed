const marks='[\\u064b-\\u065f\\u0670]*';
const title='صاحب القراءة'.split('').map(c=>c===' '?'\\s+':c+marks).join('');
const qariStop=new RegExp('('+title+')[ \\t]*[.۔]+','gu');
const allah=new RegExp('ا'+marks+'ل'+marks+'ل'+marks+'ه'+marks+'(?![\\p{L}\\p{M}])','gu');
export const cleanAllahSpelling=(text:string)=>text.replace(allah,'الله');
/** Keep sentence stops, remove mixed separators, and continue directly after صاحب القراءة. */
export function cleanSanadPunctuation(text:string){
 return cleanAllahSpelling(text).replace(qariStop,'$1').replace(/([.۔])\s*[،,]+\s*/gu,'$1 ').replace(/[،,]\s*([.۔])/gu,'$1').replace(/([،,])\s*[،,]+/gu,'$1');
}
export const cleanSanadPartStart=(text:string)=>text.trim().replace(/^[،,.؛;\s]+/u,'');
