import {QURRA} from './qurra';
type HeldReading={qariId:string;rawi?:string;tariqNumber?:string};
/** Aggregate labels describe coverage; they never merge or replace sanad records. */
export function ijazahCoverage(holdings:HeldReading[]){
 const covered=QURRA.filter(q=>holdings.some(h=>h.qariId===q.id&&!h.tariqNumber&&!h.rawi)||q.rawis.every(rawi=>holdings.some(h=>h.qariId===q.id&&!h.tariqNumber&&h.rawi===rawi)));
 const seven=covered.filter(q=>q.family==='seven').length;
 const three=covered.filter(q=>q.family!=='seven').length;
 return {count:covered.length,label:covered.length===10?'القراءات العشر الصغرى':seven===7?'القراءات السبع من الشاطبية':three===3?'القراءات الثلاث من الدرة':'',ids:covered.map(q=>q.id)};
}
