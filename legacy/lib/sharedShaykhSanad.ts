import {ijazahCoverage} from './ijazahCoverage';
type Reading={qariId:string;rawi?:string;tariqNumber?:string};
export const hasSharedSughraCoverage=(readings:Reading[])=>ijazahCoverage(readings).count===10;
export function profileHasSharedSughraCoverage(profile:{readingsJson?:string;readings?:Reading[]}){try{const readings=profile.readings??JSON.parse(profile.readingsJson||'[]');return Array.isArray(readings)&&hasSharedSughraCoverage(readings);}catch{return false;}}
/** Only complete original Sughra coverage uses the optional shared prefix; numbered routes remain independent. */
export const usesSharedSughra=(profile:{sharedSughraSanad?:boolean;readingsJson?:string;readings?:Reading[]},tariqNumber?:string)=>profile.sharedSughraSanad===true&&!tariqNumber&&profileHasSharedSughraCoverage(profile);
