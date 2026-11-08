import {prepareSavedSanadPeople} from './preparedSanadPeople';
import {preparedSanadGraph} from './preparedSanadGraph';

type NamedNode={key:string;name:string;personId?:string};
export type PersonalSanadBranch={id:string;origin:string;join:string;nodes:NamedNode[]};

/**
 * Serialize connected paths to the reviewed (ح) grammar. Preserve person IDs in
 * text-token order so saved diagrams are recoverable after a page reload.
 */
export function assemblePersonalSanadBranches(main:NamedNode[],branches:PersonalSanadBranch[]){
 if(!main.length||main.some(node=>!node.personId||!node.name.trim()))throw Error('اختر جميع الرواة في السند الرئيسي أولًا');
 const parts=['كما أخذته عن '+main.map(node=>node.name.trim()).join('، عن ')];
 const ids=[...main.map(node=>node.personId!)];
 const seenPaths=new Set<string>([main.map(node=>node.personId).join('|')]);
 for(const [i,branch] of branches.entries()){
  const origin=main.findIndex(node=>node.key===branch.origin);
  const join=main.findIndex(node=>node.key===branch.join);
  if(origin<0||join<=origin)throw Error('اختر راوِي البداية ونقطة الالتقاء للفرع '+(i+1));
  if(!branch.nodes.length||branch.nodes.some(node=>!node.personId||!node.name.trim()))throw Error('أكمل رواة الفرع '+(i+1)+' قبل اعتماد السند');
  const route=[...main.slice(0,origin+1),...branch.nodes,...main.slice(join)];
  const pathKey=route.map(node=>node.personId).join('|');
  if(seenPaths.has(pathKey))throw Error('هذا الفرع مكرر. عدّله أو احذفه');
  seenPaths.add(pathKey);
  if(new Set(route.map(node=>node.personId)).size!==route.length)throw Error('كرر الفرع راوياً في المسار نفسه؛ اختر نقطة الالتقاء بدل تكرار الاسم');
  const continuation=[...branch.nodes,...main.slice(join)];
  parts.push('(ح). وقرأ '+main[origin].name.trim()+' أيضًا على '+continuation.map(node=>node.name.trim()).join('، عن '));
  ids.push(...continuation.map(node=>node.personId!));
 }
 if(ids.length>100)throw Error('لا يمكن تجاوز مئة خانة راوٍ في السند بفروعه');
 const text=parts.join(' ');
 const parsed=prepareSavedSanadPeople(text,true,'end');
 const graph=parsed?.tokens.length===ids.length?preparedSanadGraph(parsed,parsed.tokens.map((token,i)=>({name:token.name,personId:ids[i]}))):null;
 if(!graph||graph.paths.length!==branches.length+1)throw Error('راجع ترتيب الفروع ونقطة الالتقاء قبل الاعتماد');
 return {text,ids,paths:graph.paths};
}
