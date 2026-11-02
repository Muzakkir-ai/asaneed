/** Print-only glyph choice. Keep vowels and the next letter's joining behavior. */
export function sakkalInitialBa(text:string):string{
 return text.replace(/(\uFE91)(\p{M}+)(\u0640)/gu,'$1$3$2').replace(/(^|[^\p{L}\p{M}\u0640\u200c\u200d])ب(\p{M}*)(?=[آأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيٱپچژکگںھہے])/gu,'$1\uFE91\u0640$2');
}
