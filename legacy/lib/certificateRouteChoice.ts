/** Display grouping only; issuance continues to use the selected saved route number. */
export const certificateRouteBook=(name:string)=>name.split(/\s*[—–]\s*/u)[0].trim();
export const certificateRouteDetail=(name:string)=>name.split(/\s*[—–]\s*/u).slice(1).join(' — ').replace(/^طريق\s+/u,'').trim()||name;
export function guestRouteChoice(value:string){
 const parts=value.split(':');
 if(parts.length!==4||parts[0]!=='guest-route')return null;
 try{return {tariqNumber:decodeURIComponent(parts[1]),qariId:parts[2],rawi:decodeURIComponent(parts[3])};}catch{return null;}
}
