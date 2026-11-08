/** An explicit narrator-ID route is displayed from the shaykh back to its source.
 * These routes are stored in the opposite direction for the combined graph.
 * The preview never infers a new edge or alters the saved sanad prose.
 */
export function diagramSanadText(route:readonly string[],names:Readonly<Record<string,string>>):string|null{
 if(!route.length||new Set(route).size!==route.length)return null;
 const tokens=[...route].reverse().map(id=>{
  const original=names[id];
  if(!original)return null;
  const clean=original.trim().replace(/^(?:عن\s+)+/u,'').replace(/[\s،.؛]+$/u,'').trim();
  return clean&&!/[\n\r]/u.test(clean)?'عن '+clean:null;
 });
 return tokens.some(token=>!token)?null:tokens.join('، ');
}
