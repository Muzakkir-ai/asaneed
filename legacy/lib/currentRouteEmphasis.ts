import {builderNameKey,type BuilderBook,type BuilderChain,type BuilderPerson} from './bookBuilder';

type Route=Pick<BuilderChain,'id'|'book_id'|'route_code'|'qari_id'|'rawi'|'kind'|'archived'|'confirmed'|'reading_scope'>;
type SourceNode={chain_id:string;branch:number;position:number;person_id:string;route_source:boolean};
/** Resolve display roles only: never rewrite a copied transmission or finalized snapshot. */
export function currentRouteEmphasis(library:{books:BuilderBook[];chains:Route[];people:BuilderPerson[];nodes:SourceNode[]},identity:{routeId?:string;routeCode?:string;qariId:string;rawi:string}){
 const available=library.chains.filter(c=>c.kind==='route'&&!c.archived&&c.confirmed&&library.books.some(b=>b.id===c.book_id&&!b.archived));
 const matches=available.filter(c=>identity.routeId?c.id===identity.routeId:identity.routeCode?c.route_code===identity.routeCode:c.reading_scope==='sughra'&&c.qari_id===identity.qariId&&builderNameKey(c.rawi)===builderNameKey(identity.rawi));
 if(matches.length!==1)return null;
 const route=matches[0],book=library.books.find(b=>b.id===route.book_id)!;
 const author=library.people.find(p=>p.id===book.author_id)?.name;
 if(!author)return null;
 const nodes=library.nodes.filter(n=>n.chain_id===route.id&&n.route_source).sort((a,b)=>a.branch-b.branch||a.position-b.position);
 const sources=[...new Set(nodes.map(n=>library.people.find(p=>p.id===n.person_id)?.name||'').filter(Boolean))];
 return {bookAuthor:author,routeSource:sources.join('، '),routeSources:sources};
}
