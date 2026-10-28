import {assetBase} from './assets';
import {QURRA,displayRawi} from './qurra';
import readingCatalog from './readingCatalog.json';
import {SVG_RIWAYAH_WIDTHS,SVG_RIWAYAH_VIEWBOX_HEIGHT} from './riwayahSvgAssets';

export type RiwayahSvgName=string;
export const RIWAYAH_SVG_HEIGHT_MM=8.445;
// Canonical role-scoped SVG filenames and their original viewBox widths
// come from one verified catalog shared with the GitHub fonts repository.
const legacyWidthKey:Record<string,keyof typeof SVG_RIWAYAH_WIDTHS>={};
for(const q of readingCatalog.qurra){
 legacyWidthKey[q.qariSvg]=q.qariSource.replace('.svg','') as keyof typeof SVG_RIWAYAH_WIDTHS;
 for(const rawi of q.rawis){
  const file=(q.rawiSvgs as unknown as Record<string,string>)[rawi];
  const source=(q.rawiSources as unknown as Record<string,string>)[rawi];
  if(!file||!source)throw new Error('Incomplete rawi SVG catalog: '+q.id+'/'+rawi);
  legacyWidthKey[file]=source.replace('.svg','') as keyof typeof SVG_RIWAYAH_WIDTHS;
 }
}
for(const [name,path] of Object.entries(readingCatalog.common))
 legacyWidthKey[path]=name as keyof typeof SVG_RIWAYAH_WIDTHS;
export const riwayahSvgWidthMm=(file:RiwayahSvgName)=>{
 const key=legacyWidthKey[file];
 if(!key)throw new Error('Unknown canonical SVG: '+file);
 return SVG_RIWAYAH_WIDTHS[key]/SVG_RIWAYAH_VIEWBOX_HEIGHT*RIWAYAH_SVG_HEIGHT_MM;
};
export const riwayahSvgUrl=(file:RiwayahSvgName)=>`${assetBase()}/svg/riwayah-aimma/${file}`;

const qariMarker:Record<string,string>={
 nafi:'نافع',ibnkathir:'ابن كثير',abiamr:'عمرو البصري',
 ibnamir:'ابن عامر',asim:'عاصم',hamza:'حمزة',kisai:'الكسائي',
 abujafar:'جعفر',yaqub:'يعقوب',khalaf:'خلف البزار'
};
const simple=(s:string)=>s.normalize('NFKC')
 .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/gu,'')
 .replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي')
 .replace(/(^|\s)ابي(?=\s|$)/gu,'$1ابو')
 .replace(/\s+/gu,' ').trim();

/** Identify the canonical stored qari and rawi from vocalized and legacy
 * certificate headings. Shared by the SVG heading and the color palette lookup. */
export function readingIdentityFromHeading(heading:string):{qariId:string;rawi:string}|null{
 const label=simple(heading);
 const split=label.match(/\s+عن\s+/u);
 if(!split||split.index===undefined)return null;
 const rawiPart=label.slice(0,split.index);
 const imamPart=label.slice(split.index+split[0].length);
 const q=QURRA.find(x=>imamPart.includes(simple(qariMarker[x.id]))||(x.id==='khalaf'&&imamPart.includes(simple('خلف العاشر'))));
 if(!q)return null;
 const rawi=q.rawis.find(x=>rawiPart.includes(simple(displayRawi(q.id,x)))||
   rawiPart.includes(simple(x)));
 if(!rawi)return null;
 return {qariId:q.id,rawi};
}

/** Five adjacent original SVGs, with names and roles from the shared catalog. */
export function svgReadingParts(heading:string):RiwayahSvgName[]|null{
 const identity=readingIdentityFromHeading(heading);
 if(!identity)return null;
 const q=QURRA.find(q=>q.id===identity.qariId);
 if(!q)return null;
 const rawiSvg=(q.rawiSvgs as unknown as Record<string,string>)[identity.rawi];
 if(!rawiSvg)return null;
 return [readingCatalog.common.riwayah,
  rawiSvg,
  readingCatalog.common.imam,
  q.qariSvg,
  q.family==='seven'?readingCatalog.common.shatbiyah:readingCatalog.common.durrah];
}
