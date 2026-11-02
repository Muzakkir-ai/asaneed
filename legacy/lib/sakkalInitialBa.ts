/** Print-only glyph choice. Keep vowels and the next letter's joining behavior. */
export function sakkalInitialBa(text:string):string{
 return text.replace(/([ب\uFE91])(\p{M}+)(\u0640)/gu,'$1$3$2')
  .replace(/(^|[^\p{L}\p{M}\u0640\u200c\u200d])ب(\p{M}*)(?=[آأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيٱپچژکگںھہے])/gu,'$1\uFE91\u0640$2')
  // Vowelled ba within a word keeps contextual shaping, with its marks on tatweel.
  .replace(/ب(\p{M}+)(?=[آأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيٱپچژکگںھہے])/gu,'ب\u0640$1');
}
