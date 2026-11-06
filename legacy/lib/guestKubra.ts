import {builderRouteName,compactRouteBook,type BuilderLibrary} from './bookBuilder';

export function usesLibraryKubra(profile:{libraryKubra?:boolean;issuerCode?:string}) {
 return profile.libraryKubra ?? profile.issuerCode==='01';
}

export function guestKubraRoutes(library:BuilderLibrary) {
 return library.chains.flatMap(route=>{
  if(route.kind!=='route'||!route.confirmed||route.archived||!route.route_code||route.reading_scope==='sughra')return [];
  const book=library.books.find(b=>b.id===route.book_id&&!b.archived);
  const parent=library.chains.find(c=>c.id===route.book_chain_id&&!c.archived&&c.kind==='book');
  if(!book||!parent||['الشاطبية والتيسير','الدرة والتحبير'].includes(compactRouteBook(book.title)))return [];
  return [{route,book,parent,qariId:route.qari_id,rawi:route.rawi,tariqNumber:route.route_code,tariqName:builderRouteName(book,route),automatic:true as const}];
 });
}
