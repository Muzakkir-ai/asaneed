export type PreparedSanadPeople={version:1;tokens:{before:string;name:string}[];suffix:string;reviewed:boolean};
export const preparedSanadText=(value:PreparedSanadPeople,names=value.tokens.map(t=>t.name))=>value.tokens.map((t,i)=>t.before+names[i]).join('')+value.suffix;
/** Opt-in review preparation only. Keep every source connector and the entire lower sanad verbatim. */
export function prepareSavedSanadPeople(source:string,reviewed=false):PreparedSanadPeople|null{
 let normalized='',positions:number[]=[];
 for(let i=0;i<source.length;i++){const part=source[i].normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/gu,'').replace(/[أإآٱ]/gu,'ا');normalized+=part;for(let j=0;j<part.length;j++)positions.push(i);}
 const anchor=/ابراهيم\s+العبيدي/u.exec(normalized);if(!anchor)return null;
 let end=positions[anchor.index+anchor[0].length-1]+1;while(/[\u064b-\u065f\u0670]/u.test(source[end]||''))end++;
 const prefix=source.slice(0,end),tokens:PreparedSanadPeople['tokens']=[];
 for(const [i,clause] of prefix.split('،').entries()){
  const relation=/^(\s*(?:(?:كما أخذت ذلك|كما أخذته)\s+عن|وهما\s+عن|عن)\s+)(.+)$/u.exec(clause);
  if(!relation)return null;
  const before=(i?'،':'')+relation[1],body=relation[2],joint=body.indexOf(' والشيخة ');
  if(joint>=0){tokens.push({before,name:body.slice(0,joint)},{before:' و',name:body.slice(joint+2)});}
  else tokens.push({before,name:body});
 }
 if(!tokens.length||tokens.length>100||tokens.some(t=>!t.name.trim()||t.name.length>250))return null;
 const prepared:PreparedSanadPeople={version:1,tokens,suffix:source.slice(end),reviewed};
 return preparedSanadText(prepared)===source?prepared:null;
}
