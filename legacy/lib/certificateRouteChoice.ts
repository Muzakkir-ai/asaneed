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
