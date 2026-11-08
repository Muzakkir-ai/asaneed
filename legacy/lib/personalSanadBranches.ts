import {preparedSanadGraph} from './preparedSanadGraph';
import {prepareSavedSanadPeople} from './preparedSanadPeople';

export type PersonalBranchNarrator={id:string;name:string};
export type PersonalParallelBranch={
 originId:string;
 joinId:string;
 narrators:PersonalBranchNarrator[];
};

/** Serialize multiple explicitly selected routes without inferring a historical narrator link. */
export function composePersonalSanadBranches(main:PersonalBranchNarrator[],branches:PersonalParallelBranch[]){
 if(!main.length||main.some(n=>!n.id||!n.name.trim()))throw Error('أكمل رواة السند الأساسي أولًا');
 if(new Set(main.map(n=>n.id)).size!==main.length)throw Error('لا تكرر راوياً في المسار الأساسي؛ استخدم الفروع');
 const mainIds=new Set(main.map(n=>n.id));
 let text='كما أخذته عن '+main.map(n=>n.name).join('، عن ');
 const ids=main.map(n=>n.id);
 for(const [index,branch] of branches.entries()){
  const origin=main.findIndex(n=>n.id===branch.originId),join=main.findIndex(n=>n.id===branch.joinId);
  if(origin<0||join<=origin+1)throw Error('الفرع '+(index+1)+': اختر موضع بداية الفرع ثم راوياً مشتركاً بعده في السند الأساسي');
  if(!branch.narrators.length||branch.narrators.some(n=>!n.id||!n.name.trim()))throw Error('الفرع '+(index+1)+': أضف راوياً محفوظاً واحداً على الأقل');
  const alternativeIds=branch.narrators.map(n=>n.id);
  if(new Set(alternativeIds).size!==alternativeIds.length||alternativeIds.some(id=>mainIds.has(id)))throw Error('الفرع '+(index+1)+': اختر الراوي المشترك في خانة نقطة الالتقاء، ولا تكرره داخل الفرع');
  const continuation=[...branch.narrators,...main.slice(join)];
  text+=' (ح). وقرأ '+main[origin].name+' أيضًا على '+continuation.map(n=>n.name).join('، عن ');
  ids.push(...alternativeIds,...main.slice(join).map(n=>n.id));
 }
 if(ids.length>100)throw Error('الحد الأقصى مئة خانة راوٍ بجميع الفروع');
 // The exact saved wording must remain understandable by the same review/diagram parser.
 if(branches.length){
  const prepared=prepareSavedSanadPeople(text,true,'end');
  const graph=prepared&&prepared.tokens.length===ids.length?preparedSanadGraph(prepared,prepared.tokens.map((token,index)=>({name:token.name,personId:ids[index]}))):null;
  if(!graph||graph.paths.length<branches.length+1)throw Error('تعذر تأكيد اتصالات الفروع؛ راجع نقطة بداية كل فرع والتقاءه');
 }
 return {text,ids};
}
