/** Standard readings can share a personal prefix. Numbered routes carry complete chains. */
export function usesSharedSughra(profile: {sharedSughraSanad?: boolean}, tariqNumber?: string) {
 return profile.sharedSughraSanad === true && !tariqNumber;
}

/** A legacy unnamed, unnumbered row can be an inherited copy of the shared prefix. */
export function isInheritedPersonalSanad(shared:string,reading:{sanadText:string;tariqNumber?:string;variantName?:string;unifiedSanad?:unknown;continuationId?:string|null;personalPersonIds?:string[]},sharedIds:string[]=[]){
 if(reading.tariqNumber||reading.variantName||reading.unifiedSanad||reading.continuationId||!shared.trim())return false;
 const clean=(text:string)=>text.trim().replace(/[.،؛\s]+$/u,'');
 const prefix=clean(reading.sanadText),whole=clean(shared);
 if(!prefix||!(whole===prefix||whole.startsWith(prefix+'،')))return false;
 return !reading.personalPersonIds?.length||reading.personalPersonIds.every((id,index)=>id===sharedIds[index]);
}
