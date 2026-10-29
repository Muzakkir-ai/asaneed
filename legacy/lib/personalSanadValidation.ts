/** Ensure a personal chain reaches the declared junction before issuing or printing. */
export type PersonalChainHolding={chainMode?:'junction'|'complete';tariqNumber?:string;tariqName?:string;ownerId?:string;personalChain?:string;junction?:string;personalSanadConfirmed?:boolean;qariId?:string;rawi?:string};
const unvoweled=(text:string)=>(text||'').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/gu,'').replace(/[أإآ]/gu,'ا').replace(/\s+/gu,' ').trim();
export function reachesJunction(holding:PersonalChainHolding):boolean {
 const chain=unvoweled(holding.personalChain||'');
 if(!chain||chain.length<25)return false;
 return holding.junction==='ubaydi'?/ابراهيم\s+العبيدي/u.test(chain):holding.junction==='jazari'?/(?:ابن\s+الجزري|محمد\s+بن\s+محمد\s+(?:بن\s+محمد\s+)?الجزري)/u.test(chain):false;
}
export function canUsePersonalSanad(holding:PersonalChainHolding):boolean {
 return (holding.chainMode==='complete'||holding.tariqNumber&&holding.tariqName)?(holding.personalChain||'').trim().length>=100:reachesJunction(holding);
}
export function sanadInChain(chain:string,personal:string):boolean {
 const required=unvoweled(personal);
 return required.length>=25&&unvoweled(chain).includes(required);
}
export const sanadBlockMessage='يرجى إضافة سند يصل إلى إبراهيم العُبيدي أو الإمام ابن الجزري قبل إصدار الشهادة أو طباعتها.';
