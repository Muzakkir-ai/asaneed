import {arabicDigits} from './arabicDigits';
import {QURRA} from './qurra';
type HeldReading={qariId:string;rawi?:string;tariqNumber?:string};
/** Aggregate labels describe coverage; they never merge or replace sanad records. */
export function ijazahCoverage(holdings:HeldReading[]){
 const covered=QURRA.filter(q=>holdings.some(h=>h.qariId===q.id&&!h.tariqNumber&&!h.rawi)||q.rawis.every(rawi=>holdings.some(h=>h.qariId===q.id&&!h.tariqNumber&&h.rawi===rawi)));
 const seven=covered.filter(q=>q.family==='seven').length;
 const three=covered.filter(q=>q.family!=='seven').length;
 const standalone=QURRA.reduce((n,q)=>n+(covered.some(c=>c.id===q.id)?0:new Set(holdings.filter(h=>h.qariId===q.id&&!h.tariqNumber&&h.rawi).map(h=>h.rawi)).size),0);
 return {standalone,count:covered.length,label:covered.length===10?'القراءات العشر الصغرى':seven===7?'القراءات السبع من الشاطبية':three===3?'القراءات الثلاث من الدرة':'',ids:covered.map(q=>q.id)};
}

export function compactReadingCount(holdings:HeldReading[]){const c=ijazahCoverage(holdings);if(c.label&&c.count===10)return c.label;return [c.count?arabicDigits(c.count)+' قراءة':'',c.standalone?arabicDigits(c.standalone)+' رواية':''].filter(Boolean).join(' · ')||'لا توجد قراءات';}
