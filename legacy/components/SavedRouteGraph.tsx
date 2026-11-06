import ConnectedChainEditor from './ConnectedChainEditor';
import type {BuilderChain,BuilderLibrary} from '../lib/bookBuilder';
import {displayRawi} from '../lib/qurra';

/** Display only the identity-backed segments of a saved route. The full prose stays alongside. */
export default function SavedRouteGraph({library,route}:{library:BuilderLibrary;route:BuilderChain}){
 const book=library.books.find(b=>b.id===route.book_id&&!b.archived);
 const parent=library.chains.find(c=>c.id===route.book_chain_id&&!c.archived);
 if(!book||!parent)return null;
 const names=new Map(library.people.map(person=>[person.id,person.name]));
 const author=names.get(book.author_id)||'راوٍ غير متاح';
 const branches=(chain:BuilderChain)=>chain.branches.map(branch=>branch.map(node=>({
  personId:node.person_id,name:names.get(node.person_id)||'راوٍ غير متاح',source:node.route_source,sourceLevel:node.source_level,
 })));
 return <div className="space-y-3">
  <ConnectedChainEditor lib={library} branches={branches(parent)} start="الإمام ابن الجزري" end={author} endId={book.author_id}/>
  <ConnectedChainEditor lib={library} branches={branches(route)} start={author} startId={book.author_id} end={displayRawi(route.qari_id,route.rawi)} roles/>
 </div>;
}
