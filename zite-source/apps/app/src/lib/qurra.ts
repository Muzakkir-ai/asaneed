/** The ten imams and two transmitters, using the user's preferred isnad names. */
import readingCatalog from './readingCatalog.json';

/** One Arabic-name catalog shared with Muzakkir-ai/fonts/svg/riwayah-aimma.
 * Legacy stored qari IDs and rawi keys remain stable. */
export const QURRA = readingCatalog.qurra;
/** Short, unvowelled names for selection/list interfaces (not certificate prose). */
export const plainReadingName=(name:string)=>name.replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/gu,'').replace(/^الإمام\s+/u,'').replace(/خلف\s+العاشر/gu,'خلف البزار').trim();
export const routeFor = (ids: string[]) => {
  const selected=QURRA.filter(q=>ids.includes(q.id));
  const seven=selected.some(q=>q.family==='seven');
  const three=selected.some(q=>q.family==='three');
  return [seven?'مِن طَرِيقَيِ الشَّاطِبِيَّةِ وَالتَّيسِيرِ':'',three?'من طَرِيقَيِ الدُّرَّةِ والتَّحْبِيرِ':''].filter(Boolean).join('، و');
};
export type ReadingSelection = {qariId:string; rawi?:string};
/** Display-only distinction: both readers retain the same historical rāwī
 * identifier in the database, but Abu Amr calls him الدوري in headings. */
export const displayRawi=(qariId:string,rawi:string)=>
  ((QURRA.find(q=>q.id===qariId)?.displayRawis||{}) as Record<string,string>)[rawi]||rawi;
/** Also normalize old unvowelled certificate headings without changing the sanad text. */
export const displayReadingLabel=(label:string)=>{
  if(!/(?:الإمام أبو عمرو البصري|أبي عمرو البصري|الإِمَامِ أَبِي عَمْرٍو البَصْرِيِّ)/u.test(label))return label;
  return label.replace(/(?<=رواية\s|رِوَايَةِ\s|بروايتي\s|و)حفص الدوري(?=\s|$|،)/gu,'الدوري')
    .replace(/(?<=رِوَايَةِ\s|رواية\s)حَفْصٍ الدُّورِيِّ(?=\s|$|،)/gu,'الدُّورِيِّ');
};
export const readingText=(s:ReadingSelection) => {
  const q=QURRA.find(x=>x.id===s.qariId);
  if(!q) return '';
  if(s.rawi) return `برواية ${displayRawi(q.id,s.rawi)} عن ${q.imam}`;
  return `بقراءة ${q.reading} بروايتي ${displayRawi(q.id,q.rawis[0])} و${displayRawi(q.id,q.rawis[1])}`;
};
