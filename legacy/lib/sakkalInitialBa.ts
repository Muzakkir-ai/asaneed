/** Print-only glyph choice. Keep vowels and the next letter's joining behavior. */
export function sakkalInitialBa(text:string):string{
 return text.replace(/(^|[^\p{L}\p{M}\u0640\u200c\u200d])ب(?=\p{M}*[آأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيٱپچژکگںھہے])/gu,'$1\uFE91\u200D');
}
