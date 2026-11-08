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
 return appendPersonalSanadBranches('كما أخذته عن '+main.map(n=>n.name).join('، عن '),main.map(n=>n.id),main,branches);
}

/** Add new alternative routes to an already reviewed, branched personal sanad. */
export function appendPersonalSanadBranches(originalText:string,originalIds:string[],route:PersonalBranchNarrator[],branches:PersonalParallelBranch[]){
 const baseline=prepareSavedSanadPeople(originalText,true,'end');
 const baselineGraph=baseline&&baseline.tokens.length===originalIds.length?preparedSanadGraph(baseline,baseline.tokens.map((t,i)=>({name:t.name,personId:originalIds[i]}))):null;
 if(!baselineGraph)throw Error('راجع أسماء السند المحفوظ قبل إضافة فرع جديد');
 if(!route.length||route.some(person=>!person.id||!person.name.trim())||new Set(route.map(n=>n.id)).size!==route.length)throw Error('اختر مسارًا محفوظًا متصلًا لإضافة الفرع');
 if(!baselineGraph.paths.some(path=>route.every((n,i)=>path[i]===n.id)&&path.length===route.length))throw Error('المسار الأساسي المحدد لا يطابق السند المحفوظ');
 const baseIds=new Set(baselineGraph.nodes.map(n=>n.id));
 let text=originalText.trim().replace(/[.،؛]+$/u,'');
 const ids=[...originalIds];
 for(const [index,branch] of branches.entries()){
  const origin=route.findIndex(n=>n.id===branch.originId),join=route.findIndex(n=>n.id===branch.joinId);
  if(origin<0||join<=origin+1)throw Error('الفرع '+(index+1)+': اختر موضع بداية الفرع ثم راوياً مشتركاً بعده في السند الأساسي');
  if(!branch.narrators.length||branch.narrators.some(n=>!n.id||!n.name.trim()))throw Error('الفرع '+(index+1)+': أضف راوياً محفوظاً واحداً على الأقل');
  const alternatives=branch.narrators.map(n=>n.id);
  if(new Set(alternatives).size!==alternatives.length||alternatives.some(id=>baseIds.has(id)))throw Error('الفرع '+(index+1)+': اختر الراوي المشترك في خانة نقطة الالتقاء، ولا تكرره داخل الفرع');
  const continuation=[...branch.narrators,...route.slice(join)];
  text+=' (ح). وقرأ '+route[origin].name+' أيضًا على '+continuation.map(n=>n.name).join('، عن ');
  ids.push(...alternatives,...route.slice(join).map(n=>n.id));
 }
 if(ids.length>100)throw Error('الحد الأقصى مئة خانة راوٍ بجميع الفروع');
 if(branches.length){
  const prepared=prepareSavedSanadPeople(text,true,'end');
  const graph=prepared&&prepared.tokens.length===ids.length?preparedSanadGraph(prepared,prepared.tokens.map((token,index)=>({name:token.name,personId:ids[index]}))):null;
  if(!graph||graph.paths.length<baselineGraph.paths.length+branches.length)throw Error('تعذر تأكيد اتصالات الفروع؛ راجع نقطة بداية كل فرع والتقاءه');
 }
 return {text,ids};
}
