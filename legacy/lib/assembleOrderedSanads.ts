import {assembleIjazah,type AssemblySection} from './assembleIjazah';
import {assembleHoldingIjazah,type UnifiedHolding} from './assembleHoldingIjazah';
import {joinOrderedSanads,type SanadBranch} from './orderedSanads';
import type {BuilderLibrary} from './bookBuilder';

export async function assembleOrderedSanads(sources:{holding:UnifiedHolding;branch:SanadBranch}[],sections:AssemblySection[],library?:BuilderLibrary) {
 const first=sources[0]?.holding;
 if(!first)throw Error('اختر سندًا محفوظًا');
 if(sources.some(({holding})=>holding.qariId!==first.qariId||holding.rawi!==first.rawi||
  (holding.tariqNumber||'')!==(first.tariqNumber||'')||(holding.tariqName||'')!==(first.tariqName||''))) {
  throw Error('اختر أسانيد تشترك في الرواية والطريق لعنوان إجازة واحد');
 }
 const results=await Promise.all(sources.map(({holding})=>assembleHoldingIjazah(holding,sections,library)));
 for(const result of results)if(result.missing.length||!result.isnad)throw Error('أكمل السند قبل الدمج: '+result.missing.join('، '));
 const assembled=sources.length===1?results[0]:assembleIjazah({
  ...first,chainMode:'complete',personalChain:joinOrderedSanads(results.map(result=>result.isnad)),
 },sections);
 if(assembled.missing.length)throw Error('أكمل السند قبل الدمج: '+assembled.missing.join('، '));
 return {...assembled,branches:sources.map(({branch})=>branch)};
}
