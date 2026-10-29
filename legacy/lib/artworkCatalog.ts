import {z} from 'zod';

export const artworkSchema=z.object({kind:z.enum(['mashaykh','books','turuq']),number:z.string().regex(/^\d{2,4}$/),line:z.enum(['name','line-02','line-03','heading']),path:z.string().regex(/^svg\/(mashaykh|books|turuq)\/\d{2,4}\/(name|line-02|line-03|heading)\.svg$/),width:z.number().positive(),height:z.number().positive(),label:z.string().max(250).default('')});
export type Artwork=z.infer<typeof artworkSchema>;
export const artworkListSchema=z.array(artworkSchema).max(500);
export function numberedArtworkPath(path:string){
 const match=path.match(/^svg\/(mashaykh|books|turuq)\/(\d{2,4})\/(name|line-02|line-03|heading)\.svg$/);
 if(!match)return null;
 if(match[1]==='mashaykh'?match[3]==='heading':match[3]!=='heading')return null;
 return {kind:match[1] as Artwork['kind'],number:match[2],line:match[3] as Artwork['line']};
}
export function svgDimensions(svg:string){
 const root=svg.match(/<svg\b[^>]*>/i)?.[0]||'';
 const box=root.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1].trim().split(/[\s,]+/).map(Number);
 if(!box||box.length!==4||!box.every(Number.isFinite)||box[2]<=0||box[3]<=0)throw Error('SVG needs a valid viewBox');
 return {width:box[2],height:box[3]};
}
/** Fetch only recognized artwork, pinned to the commit saved by Refresh. */
export async function discoverArtwork(repo:string,revision:string):Promise<Artwork[]>{
 const options={headers:{Accept:'application/vnd.github+json'},cache:'no-store' as const,signal:AbortSignal.timeout(15000)};
 const response=await fetch(`https://api.github.com/repos/${repo}/git/trees/${revision}?recursive=1`,options);
 if(!response.ok)throw Error('تعذر قراءة فهرس ملفات GitHub');
 const tree=await response.json();if(tree.truncated)throw Error('GitHub artwork tree is too large');
 const files=(tree.tree as {path:string;type:string}[]).filter(x=>x.type==='blob'&&numberedArtworkPath(x.path));
 if(files.length>500)throw Error('Maximum 500 numbered SVGs');
 const labels:Record<string,string>={};
 if(tree.tree.some((x:{path:string})=>x.path==='svg/catalog.json')){
  const r=await fetch(`https://raw.githubusercontent.com/${repo}/${revision}/svg/catalog.json`,options);
  if(!r.ok)throw Error('Cannot read svg/catalog.json');
  const catalog=z.object({books:z.record(z.string().regex(/^\d{2,4}$/),z.string().max(250)).optional(),turuq:z.record(z.string().regex(/^\d{2,4}$/),z.string().max(250)).optional()}).parse(await r.json());
  for(const kind of ['books','turuq'] as const)for(const [number,label] of Object.entries(catalog[kind]||{}))labels[kind+'/'+number]=label;
 }
 const result:Artwork[]=[];
 for(let i=0;i<files.length;i+=5)result.push(...await Promise.all(files.slice(i,i+5).map(async file=>{
  const r=await fetch(`https://raw.githubusercontent.com/${repo}/${revision}/${file.path}`,options);
  if(!r.ok)throw Error('Cannot read '+file.path);
  const svg=await r.text();if(svg.length>2500000)throw Error('SVG too large: '+file.path);
  return {...numberedArtworkPath(file.path)!,path:file.path,...svgDimensions(svg),label:labels[numberedArtworkPath(file.path)!.kind+'/'+numberedArtworkPath(file.path)!.number]||''};
 })));
 return artworkListSchema.parse(result);
}
