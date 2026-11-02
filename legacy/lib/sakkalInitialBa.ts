/** Print-only alternate ba for bin and initial bk/br/bz with a third letter. */
export function sakkalInitialBa(text:string):string{
 const plain=text.replace(/\uFE91(\p{M}*)\u0640?/gu,'ب$1').replace(/ب\u0640(?=\p{M})/gu,'ب');
 return plain.replace(/(^|[^\p{L}\p{M}\u0640\u200c\u200d])ب(\p{M}*)(?=ن\p{M}*(?:$|[^\p{L}\p{M}\u0640])|[كرز]\p{M}*[آأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيٱپچژکگںھہے])/gu,'$1\uFE91\u0640$2');
}
