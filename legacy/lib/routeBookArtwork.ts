import type {Artwork} from './artworkCatalog';
type Book={title:string;artwork_number:string|null;archived:boolean};
export const routeBookDirectory=(books:Book[])=>books.filter(b=>!b.archived&&b.artwork_number).map(b=>({number:b.artwork_number!,name:b.title,path:'svg/turuq/'+b.artwork_number+'/heading.svg'})).sort((a,b)=>Number(a.number)-Number(b.number));
export const labelRouteBookArtwork=(items:Artwork[],books:Book[])=>items.map(a=>{const book=a.kind==='turuq'?books.find(b=>b.artwork_number===a.number):undefined;return book?{...a,label:book.title}:a;});
