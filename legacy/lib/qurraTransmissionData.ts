import {QURRA} from './qurra';
import {builderNameKey,type BuilderLibrary,type BuilderChain} from './bookBuilder';

/** Historical segments are assembled ONLY from saved explicit narrator IDs
 * and the book -> parent-chain -> route-chain references. None of the
 * displayed segments proves an onward link past its final saved narrator.
 */
export type QurraStage='jazari-dani'|'dani-seven'|'jazari-three'|'other-seven';
export type QurraWitness={
 id:string;stage:QurraStage;qariId:string;rawi:string;
 bookId:string;routeId:string;title:string;book:string;
 ids:string[];parentConfirmed:boolean;routeConfirmed:boolean;completeToRawi:false;
};
export type QurraTransmissionData={
 witnesses:QurraWitness[];
 names:Record<string,string>;
 jazariId:string|null;
 daniId:string|null;
 skipped:number;
};

const noRepeats=(ids:readonly string[])=>new Set(ids).size===ids.length;
const isDani=(name:string)=>/(?:^|\s)الداني$/u.test(builderNameKey(name));
const isJazari=(name:string)=>/الجزري$/u.test(builderNameKey(name))&&builderNameKey(name).includes('محمد');

export function buildQurraTransmissionData(lib:BuilderLibrary):QurraTransmissionData{
 const active=lib.people.filter(p=>!p.archived),names=Object.fromEntries(active.map(p=>[p.id,p.name]));
 const daniCandidates=active.filter(p=>isDani(p.name));
 const daniId=daniCandidates.length===1?daniCandidates[0].id:null;
 // A book authored by Ibn al-Jazari identifies the same saved narrator
 // used in the other book chains, without inventing a person or a new ID.
 const threeAuthors=[...new Set(lib.chains.filter(c=>!c.archived&&c.kind==='route'&&QURRA.some(q=>q.id===c.qari_id&&q.family==='three'))
  .map(c=>lib.books.find(b=>b.id===c.book_id&&!b.archived)?.author_id).filter((id):id is string=>!!id))];
 const jazariCandidates=threeAuthors.filter(id=>names[id]&&isJazari(names[id]));
 const jazariId=jazariCandidates.length===1?jazariCandidates[0]:null;
 const witnesses:QurraWitness[]=[];
 let skipped=0;
 const parentPaths=(chain:BuilderChain,author:string):string[][]=>{
  const branches=chain.branches.length?chain.branches:[[]];
  return branches.map(branch=>{
   const path=[...(jazariId?[jazariId]:[]),...branch.map(n=>n.person_id),author]
    .filter((id,i,ids)=>i===0||id!==ids[i-1]);
   return path;
  }).filter(ids=>!!jazariId&&ids[0]===jazariId&&ids.every(id=>!!names[id])&&noRepeats(ids));
 };
 // Display saved drafts too, explicitly flagged for review. Editing an
 // approved path invalidates its approval; hiding drafts would make the
 // path disappear immediately after a user saves a new narrator.
 for(const route of lib.chains.filter(c=>c.kind==='route'&&!c.archived)){
  const q=QURRA.find(q=>q.id===route.qari_id);
  if(!q)continue;
  const book=lib.books.find(b=>b.id===route.book_id&&!b.archived);
  const parent=lib.chains.find(c=>c.id===route.book_chain_id&&c.kind==='book'&&!c.archived&&c.book_id===route.book_id);
  if(!book||!parent||!names[book.author_id]){skipped++;continue;}
  const prefixes=parentPaths(parent,book.author_id);
  const branches=route.branches.filter(b=>b.length).map(branch=>[book.author_id,...branch.map(n=>n.person_id)])
   .filter(ids=>ids.every(id=>!!names[id])&&noRepeats(ids));
  if(!branches.length){skipped++;continue;}
  const push=(stage:QurraStage,ids:string[],index:number)=>{
   if(ids.length<2||!noRepeats(ids))return;
   witnesses.push({
    id:route.id+':'+stage+':'+index,stage,qariId:route.qari_id,rawi:route.rawi,
    bookId:book.id,routeId:route.id,title:route.title,book:book.title,
    ids,parentConfirmed:parent.confirmed,routeConfirmed:route.confirmed,completeToRawi:false,
   });
  };
  branches.forEach((branch,branchIndex)=>{
   // Stage 2: follow only the saved route edges from al-Dani onward.
   if(q.family==='seven'){
    const cut=daniId?branch.indexOf(daniId):-1;
    if(cut>=0&&cut<branch.length-1)push('dani-seven',branch.slice(cut),branchIndex);
    else push('other-seven',branch,branchIndex);
   }
   // Stages 1 and 3 need a saved parent book segment from Ibn al-Jazari.
   prefixes.forEach((prefix,prefixIndex)=>{
    const full=[...prefix,...branch.slice(1)];
    const index=prefixIndex*branches.length+branchIndex;
    if(!noRepeats(full)){skipped++;return;}
    if(q.family==='seven'&&daniId){
     const cut=full.indexOf(daniId);
     if(cut>0)push('jazari-dani',full.slice(0,cut+1),index);
    }
    if(q.family==='three')push('jazari-three',full,index);
   });
  });
 }
 return {witnesses,names,jazariId,daniId,skipped};
}
