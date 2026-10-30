import type {BuilderLibrary} from './bookBuilder';
/** Membership uses stable person IDs, never a normalized-name merge. */
export function builderPersonRoutes(lib:BuilderLibrary,personId:string){
 return lib.chains.filter(c=>c.kind==='route'&&!c.archived).flatMap(route=>{
  const book=lib.books.find(b=>b.id===route.book_id&&!b.archived);
  const parent=lib.chains.find(c=>c.id===route.book_chain_id&&!c.archived);
  if(!book||!parent)return [];
  const nodes=[...parent.branches.flat(),...route.branches.flat()].filter(n=>n.person_id===personId);
  if(book.author_id!==personId&&!nodes.length)return [];
  return [{route,book,author:book.author_id===personId,levels:[...new Set(nodes.filter(n=>n.route_source).map(n=>n.source_level||'unclassified'))]}];
 });
}
