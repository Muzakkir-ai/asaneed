/**
 * Display-only grouping for near-identical reviewed isnad paths.
 *
 * Two paths may be shown as ONE masar with alternate narrator branches only
 * when they have the same endpoint identities and exactly one contiguous
 * diverging span, containing at most two differing narrators on EACH side.
 *
 * This does not deduplicate any saved edges, routes, or source witnesses.
 * A pairwise match (rather than transitive clustering) prevents long chains
 * of individually-small changes from hiding a materially different route.
 */
export function groupSimilarSanadRoutes(paths:readonly (readonly string[])[]):number[][]{
 const near=(left:readonly string[],right:readonly string[])=>{
  if(left.length===right.length&&left.every((id,i)=>id===right[i]))return true;
  if(left.length<2||right.length<2||left[0]!==right[0]||left.at(-1)!==right.at(-1))return false;
  let before=0;
  while(before<left.length&&before<right.length&&left[before]===right[before])before++;
  let after=0;
  while(after<left.length-before&&after<right.length-before
   &&left[left.length-1-after]===right[right.length-1-after])after++;
  if(!before||!after)return false;
  const changedLeft=left.length-before-after,changedRight=right.length-before-after;
  return changedLeft<=2&&changedRight<=2&&(changedLeft>0||changedRight>0);
 };
 const grouped:number[][]=[];
 paths.forEach((path,index)=>{
  const group=grouped.find(indices=>indices.every(other=>near(path,paths[other])));
  if(group)group.push(index);else grouped.push([index]);
 });
 return grouped;
}
