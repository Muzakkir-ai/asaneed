/** Compress only structurally proven common prefixes/tails; never parse free-text branches. */
export function renderBranchedSanad(paths:string[][],name:(id:string)=>string,subject:(id:string)=>string,prefix:string,continuation:string){
 const head=prefix.trim().replace(/[،.\s]+$/u,''),tail=continuation.trim();
 const chain=(ids:string[])=>ids.map(id=>'عن '+name(id)).join('، ');
 const join=(...parts:string[])=>parts.filter(Boolean).join('، ');
 const complete=()=>paths.map(ids=>join(head,chain(ids),tail)).join('\n\n(ح)\n\n');
 if(paths.length<2)return complete();
 let common=0;
 while(paths.every(p=>p[common]!==undefined&&p[common]===paths[0][common]))common++;
 if(!common)return complete();
 let suffix=0;
 while(paths.every(p=>p.length-suffix-1>=common&&p[p.length-suffix-1]===paths[0][paths[0].length-suffix-1]))suffix++;
 const middle=paths.map(p=>p.slice(common,suffix?p.length-suffix:undefined));
 if(middle.some(p=>!p.length))return complete();
 // Overlapping interiors require a more complex graph than this prose form supports.
 if(middle.some((p,i)=>middle.some((q,j)=>i!==j&&p.some(id=>q.includes(id)))))return complete();
 if(!suffix&&!/^عن\s+/u.test(tail))return complete();
 const shared=paths[0].slice(0,common),pivot=shared[shared.length-1];
 let text=join(head,chain([...shared,...middle[0]]));
 for(const branch of middle.slice(1))text+=' (ح). وقرأ '+subject(pivot)+' أيضًا على '+name(branch[0])+(branch.length>1?'، '+chain(branch.slice(1)):'');
 const readers=middle.map(p=>subject(p[p.length-1])).join(' و');
 const rest=suffix?join(chain(paths[0].slice(-suffix)),tail):tail;
 return text.replace(/[،.\s]+$/u,'')+'. وقرأ '+readers+' على '+rest.replace(/^عن\s+/u,'');
}
/** Saved familiar name when available; change the explicit Abu genitive for a verb subject. */
export const sanadSubjectName=(name:string)=>(name.match(/(?:المعروف|الشهير)\s+بـ?\s+(.+)$/u)?.[1]||name).replace(/^أَبِي(?=\s)/u,'أَبُو').replace(/^أبي(?=\s)/u,'أبو');
