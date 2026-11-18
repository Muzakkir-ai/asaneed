import {QURRA} from './qurra';
import {buildNarratorDirectory} from './narratorDirectory';
import {sanadKey} from './unifiedSanad';
import type {AssemblyHolding,AssemblySection} from './assembleIjazah';
import type {SanadBranch} from './orderedSanads';

/** Source-based preview count, never an approval of transmission authenticity.
 * Join only a complete saved personal path at its explicit shared anchor.
 * Do not count words, merged prose, incomplete paths or a union of readings. */
export function sanadNarratorCount(holding:AssemblyHolding,branch:SanadBranch,sections:AssemblySection[]):number|null{
 if(!branch.paths.length)return null;
 const prophet=(name:string)=>/^(?:(?:النبي|رسول الله)(?: محمد بن عبد الله)?(?: ﷺ)?|محمد بن عبد الله رسول الله(?: ﷺ)?)$/u.test(sanadKey(name.replace(/ﷺ|صلى الله عليه وسلم/gu,'')));
 const complete=branch.paths.map(reversed=>{
  const path=[...reversed].reverse();
  if(new Set(path).size!==path.length||path.some(id=>!branch.names[id]))return null;
  const end=path.findIndex(id=>prophet(branch.names[id]));
  return end>0?end:null;
 });
 if(complete.every((length):length is number=>length!==null))return Math.max(...complete);
 if(holding.tariqNumber||holding.chainMode==='complete'||!holding.rawi)return null;
 const titles=new Set([`CHAIN:${holding.qariId}:${holding.rawi}`,`CHAIN:${holding.qariId}:sahaba`,`CHAIN:${holding.qariId}:prophet`]);
 if(QURRA.find(q=>q.id===holding.qariId)?.family==='seven')titles.add('من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة');
 if(branch.paths.some(path=>/(?:^|\s)ابراهيم العبيدي(?:$|\s)/u.test(sanadKey(branch.names[path[0]]||''))))titles.add('من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند');
 const scoped=sections.filter(section=>titles.has(section.title)&&section.body.trim());
 if([...titles].some(title=>scoped.filter(section=>section.title===title).length!==1))return null;
 const sourceKey=(text:string)=>sanadKey(text).replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/gu,' ').replace(/(^|\s)(و?)(?:ابو|ابي|ابا)(?=\s+(?!بن(?:\s|$)))/gu,'$1$2ابو').trim();
 // The legacy index includes hand-indexed branch templates. Refuse a count
 // if their named witnesses no longer occur in the current saved source.
 for(const section of scoped){
  const indexed=buildNarratorDirectory([section]);
  const body=sourceKey(section.body);
  for(const person of indexed.people){
   if(person.id==='anchor:jazari'&&section.title.includes('إلى الإمام الداني'))continue;
   if(person.id==='anchor:dani'&&section.title.startsWith('CHAIN:'))continue;
   if(person.id==='anchor:ubaidi')continue;
   if(person.id==='imam:'+holding.qariId&&section.title.endsWith(':sahaba'))continue;
   if(person.id==='anchor:jazari'&&/(?:ابن الجزري|محمد بن محمد (?:بن محمد )?الجزري)/u.test(body))continue;
   if(!body.includes(sourceKey(person.name)))return null;
  }
 }
 const directory=buildNarratorDirectory(scoped),people=new Map(directory.people.map(person=>[person.id,person]));
 const anchor=(name:string)=>{
  const key=sanadKey(name);
  return /(?:ابن الجزري|محمد بن محمد (?:بن محمد )?الجزري)/u.test(key)?'anchor:jazari':/(?:^|\s)ابراهيم العبيدي(?:$|\s)/u.test(key)?'anchor:ubaidi':null;
 };
 const lengths:number[]=[];
 for(const reversed of branch.paths){
  const path=[...reversed].reverse();
  if(!path.length||new Set(path).size!==path.length||path.some(id=>!branch.names[id]))return null;
  const end=anchor(branch.names[path.at(-1)!]||'');
  if(!end||!people.has(end))return null;
  let invalid=false,visited=0;
  const tails:number[]=[];
  function walk(id:string,trail:string[]){
   if(++visited>10000||trail.includes(id)||trail.length>=100){invalid=true;return;}
   const next=[...trail,id];
   if(id==='prophet'){tails.push(next.length-1);return;}
   const person=people.get(id);
   if(!person?.teachers.length){invalid=true;return;}
   for(const teacher of person.teachers)walk(teacher,next);
  }
  walk(end,[]);
  if(invalid||!tails.length)return null;
  lengths.push(path.length-1+Math.max(...tails));
 }
 return lengths.length?Math.max(...lengths):null;
}
