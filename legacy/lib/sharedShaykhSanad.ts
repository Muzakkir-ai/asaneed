/** Only the original Sughra riwayah uses the shared prefix; a numbered route remains independent. */
export const usesSharedSughra=(profile:{sharedSughraSanad?:boolean},tariqNumber?:string)=>profile.sharedSughraSanad===true&&!tariqNumber;
