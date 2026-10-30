/** Display grouping only; issuance continues to use the selected saved route number. */
export const certificateRouteBook=(name:string)=>name.split(/\s*[—–]\s*/u)[0].trim();
export const certificateRouteDetail=(name:string)=>name.split(/\s*[—–]\s*/u).slice(1).join(' — ').replace(/^طريق\s+/u,'').trim()||name;
export function guestRouteChoice(value:string){
 const parts=value.split(':');
 if(parts.length!==4||parts[0]!=='guest-route')return null;
 try{return {tariqNumber:decodeURIComponent(parts[1]),qariId:parts[2],rawi:decodeURIComponent(parts[3])};}catch{return null;}
}

/** Only explicitly identified kubra books receive the Tayyibah wording. */
export function certificateRoutePhrase(name:string){return 'من طريق '+certificateRouteBook(name);}
export function certificateRouteWording(name:string){
 const book=certificateRouteBook(name);
 const normalized=book.replace(/[\u064b-\u065f\u0670\u0640]/gu,'');
 const kubra=['المستنير','المصباح'].includes(normalized);
 return 'من طريق '+book+(kubra?' وهي إحدى طرق طيبة النشر':'');
}

/** Update only the reading marker and opening wording of a preserved custom sanad. */
export function currentPreservedRouteText(chain:string,name:string){
 if(!name.trim())return chain;
 const marks='[\\u064b-\\u065f\\u0670\\u0640]*';
 const pattern=(text:string)=>text.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/gu,'').split('').map(c=>/\s/u.test(c)?'\\s+':c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+marks).join('');
 const phrase=new RegExp(pattern('من طريق '+name)+'(?:'+pattern(' وهي إحدى طرق طيبة النشر')+'|'+pattern(' وهي من طرق طيبة النشر')+')?','u');
 const marker=chain.match(/^【بيان القراءة:([^】]+)】/u);
 let body=marker?chain.slice(marker[0].length):chain;
 const boundary=new RegExp(pattern('كما أخذته'),'u').exec(body);
 // Without a known opening boundary, keep the preserved text untouched.
 if(!boundary)return chain;
 const opening=body.slice(0,boundary.index);
 body=opening.replace(phrase,()=>certificateRouteWording(name))+body.slice(boundary.index);
 const heading=marker?'【بيان القراءة:'+marker[1].replace(phrase,()=>certificateRoutePhrase(name))+'】':'';
 return heading+body;
}
