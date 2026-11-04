import {z} from 'zod';
import type {MatnFormat} from './matnRichText';
import type {Artwork} from './artworkCatalog';
import {arabicSearchKey} from './arabicSearch';
export const matnHeadingSchema=z.object({version:z.literal(1),bodyWidthMm:z.number().min(100).max(265).optional(),bodyScalePercent:z.number().min(50).max(200).optional(),basmalahGapMm:z.number().min(0).max(30).optional(),borderNumber:z.string().regex(/^(?:default|none|\d{2,4})$/).optional(),sectionBreaks:z.object({afterIntro:z.boolean(),afterWording:z.boolean(),afterSanad:z.boolean()}).optional(),mainWidthMm:z.number().min(5).max(250).optional(),secondaryWidthMm:z.number().min(5).max(250).optional(),mainHeightPt:z.number().min(5).max(150),secondaryHeightPt:z.number().min(1).max(120),lineGapMm:z.number().min(0).max(15),afterGapMm:z.number().min(0).max(20)});
export type MatnHeadingSettings=z.infer<typeof matnHeadingSchema>;
export const DEFAULT_MATN_HEADING:MatnHeadingSettings={version:1,mainHeightPt:42,secondaryHeightPt:24,lineGapMm:2,afterGapMm:4};
export function matnArtwork(name:string,catalog:Artwork[],number?:string){const matches=catalog.filter(a=>a.kind==='books'&&a.line==='heading'&&(number?a.number===number:a.label&&arabicSearchKey(a.label)===arabicSearchKey(name)));const main=matches.length===1?matches[0]:undefined;return {main,secondary:main?catalog.find(a=>a.kind==='books'&&a.number===main.number&&a.line==='line-02'):undefined};}
export function readMatnPresentation(raw?:string){try{const value=JSON.parse(raw||'[]');return {formats:(Array.isArray(value)?value:Array.isArray(value.formats)?value.formats:[]) as MatnFormat[],heading:matnHeadingSchema.safeParse(value.heading).data};}catch{return {formats:[] as MatnFormat[],heading:undefined};}}
/** Keep legacy arrays until a heading is deliberately saved; retain unknown envelope keys. */
export function writeMatnPresentation(raw:string|undefined,formats:MatnFormat[],heading?:MatnHeadingSettings){let value:any;try{value=JSON.parse(raw||'[]');}catch{}const resolved=heading??readMatnPresentation(raw).heading;return resolved?JSON.stringify({...(!Array.isArray(value)&&value&&typeof value==='object'?value:{}),version:2,formats,heading:matnHeadingSchema.parse(resolved)}):JSON.stringify(formats);}
export function resolveMatnHeading(defaults:MatnHeadingSettings|undefined,override:MatnHeadingSettings|null|undefined,legacy:{svgHeightPt?:number;headingGapMm?:number;scalePercent?:number}|undefined,art:{main?:Artwork;secondary?:Artwork}):MatnHeadingSettings{
 if(override)return matnHeadingSchema.parse(override);
 if(override===null)return defaults??DEFAULT_MATN_HEADING;
 if(legacy&&(legacy.svgHeightPt!==undefined||legacy.headingGapMm!==undefined||legacy.scalePercent!==undefined)){
  const main=legacy.svgHeightPt??(art.main?98.0244*(legacy.scalePercent??100)/100/art.main.width*art.main.height*72/25.4:42);
  const secondary=art.main&&art.secondary?main/art.main.height*art.secondary.height:24;
  return {...DEFAULT_MATN_HEADING,mainHeightPt:Math.max(5,Math.min(150,main)),secondaryHeightPt:Math.max(1,Math.min(120,secondary)),lineGapMm:legacy.svgHeightPt!==undefined?1:4,afterGapMm:legacy.headingGapMm??2};
 }
 return defaults??DEFAULT_MATN_HEADING;
}

export const headingTextTopMm=(top:number,height:number,paperWidth:number)=>(top+height)/paperWidth*297;
