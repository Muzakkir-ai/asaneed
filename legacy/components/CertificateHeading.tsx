import {MatnHeadingPreview} from './MatnHeadingControls';
import MatnHeading from './MatnHeading';
import type {MatnHeadingSettings} from '../lib/matnPresentation';
import type {QiraatHeadingSettings} from '../lib/qiraatHeadingSettings';
import {currentArtwork,assetBase} from '../lib/assets';
import {arabicSearchKey} from '../lib/arabicSearch';
import {isMatnHeading} from '../lib/matnCertificate';
import {sakkalPrintNodes} from '../lib/sakkalPrintNodes';
import type {Artwork} from '../lib/artworkCatalog';
import {forwardRef,type CSSProperties,type ReactNode} from 'react';
import {svgReadingParts,riwayahSvgWidthMm,riwayahSvgUrl,RIWAYAH_SVG_HEIGHT_MM} from '../lib/riwayahSvgHeading';

/** Keep legacy reading ligatures and the original print geometry in one renderer. */
function readingLine(value:string):ReactNode{
 const match=value.match(/^ب([\u064b-\u065f]*)ر([\u064b-\u065f]*)(?=و)/u);
 if(!match)return value;
 return <><span className="certificate-reading-glyph">{'\uFE91\u0640'}{match[1]}</span><span className="certificate-reading-glyph">{'\uFEAE'}{match[2]}</span><span>{value.slice(match[0].length)}</span></>;
}
type Props={qiraatSettings?:QiraatHeadingSettings;matnArtworkNumber?:string;matnSettings?:MatnHeadingSettings;matnHeightPt?:number;scalePercent?:number;useMatnArtwork?:boolean;heading:string;primary:string;secondary:string;readingStyle?:CSSProperties;preserveHistoricalRoute?:boolean;artwork?:Artwork[];artworkBase?:string};
const CertificateHeading=forwardRef<HTMLDivElement,Props>(function CertificateHeading({matnArtworkNumber,matnSettings,heading,primary,secondary,readingStyle,preserveHistoricalRoute=false,artwork,artworkBase,scalePercent=100,useMatnArtwork=true,matnHeightPt,qiraatSettings},ref){
 const matn=isMatnHeading(heading);
 const catalog=artwork??currentArtwork(),bookName=heading.replace(/^إجازة في\s*/u,'');
 const matches=matn&&useMatnArtwork?catalog.filter(a=>a.kind==='books'&&a.line==='heading'&&a.label&&arabicSearchKey(a.label)===arabicSearchKey(bookName)):[];
 const book=matches.length===1?matches[0]:undefined,second=book?catalog.find(a=>a.kind==='books'&&a.number===book.number&&a.line==='line-02'):undefined;
 const scale=scalePercent/100,bookScale=book?(matnHeightPt!==undefined?matnHeightPt*25.4/72/book.height:98.0244/book.width*scale):1;
 const titleWidth=qiraatSettings?.ijazahWidthMm??98.0244*scale;
 const titleHeight=titleWidth*19.4/98.0244;
 const secondHeight=qiraatSettings?.riwayahHeightMm??RIWAYAH_SVG_HEIGHT_MM*scale;
 const basmalahWidth=qiraatSettings?.basmalahWidthMm??34.18;
 const bookSvg=(a:Artwork,color:string)=><div key={a.path} role="img" aria-label={a.line==='heading'?bookName:bookName+' — السطر الثاني'} style={{width:`${a.width*bookScale}mm`,height:`${a.height*bookScale}mm`,marginInline:'auto',marginBlock:matnHeightPt!==undefined?(a.line==='heading'?'2mm 1mm':'0'):'2mm',backgroundColor:color,WebkitMaskImage:`url("${artworkBase??assetBase()}/${a.path}")`,maskImage:`url("${artworkBase??assetBase()}/${a.path}")`,WebkitMaskSize:'contain',maskSize:'contain',WebkitMaskRepeat:'no-repeat',maskRepeat:'no-repeat',WebkitMaskPosition:'center',maskPosition:'center'}}/>;
 if(matn&&matnSettings)return <div ref={ref} className="certificate-header-art" aria-label="البسملة وشهادة الإجازة" style={{'--certificate-primary':primary,'--certificate-secondary':secondary} as CSSProperties}><MatnHeading artworkNumber={matnArtworkNumber} name={bookName} settings={matnSettings} artwork={catalog} base={artworkBase??assetBase()} primary={primary} secondary={secondary}/></div>;
 const pieces=matn?null:svgReadingParts(heading,{preserveHistoricalRoute,catalog:artwork});
 return <div ref={ref} className="certificate-header-art" aria-label="البسملة وشهادة الإجازة" style={{'--certificate-primary':primary,'--certificate-secondary':secondary,
  ...(qiraatSettings&&!matn?{paddingBottom:`${qiraatSettings.afterGapMm??0}mm`}:{})} as CSSProperties}>
  <div className="certificate-basmalah-svg" role="img" aria-label="بسم الله الرحمن الرحيم" style={{
   ...(qiraatSettings&&!matn?{width:`${basmalahWidth}mm`,height:`${basmalahWidth*4.4/34.18}mm`,marginBottom:`${qiraatSettings.basmalahGapMm??3}mm`}:{}),
   ...(artworkBase?{WebkitMaskImage:`url("${artworkBase}/svg/basmalah.svg")`,maskImage:`url("${artworkBase}/svg/basmalah.svg")`}:{}),
  }}/>
  {book?bookSvg(book,primary):matn?<div style={{fontFamily:"Sakkal Kitab,serif",fontSize:"26pt",color:primary,marginBlock:"4mm"}}>إجازة بالسند</div>:<div className="certificate-ijazah-svg" role="img" aria-label="شهادة إجازة" style={{
   backgroundColor:primary,width:`${titleWidth}mm`,height:`${titleHeight}mm`,
   marginTop:qiraatSettings?`${qiraatSettings.ijazahOffsetMm??0}mm`:undefined,
   ...(artworkBase?{WebkitMaskImage:`url("${artworkBase}/svg/ijazah.svg")`,maskImage:`url("${artworkBase}/svg/ijazah.svg")`}:{})
  }}/> }
  {book?(second?bookSvg(second,secondary):null):heading&&(pieces?
   <div className="certificate-reading-svg-line" role="img" aria-label={heading} dir="rtl"
    style={qiraatSettings?{marginTop:`${(qiraatSettings.riwayahGapMm??2)+(qiraatSettings.riwayahOffsetMm??0)}mm`}:undefined}>
    {pieces.map((glyph,index)=><span key={glyph+'-'+index} aria-hidden="true" className="certificate-reading-svg-piece" style={{
     width:`${riwayahSvgWidthMm(glyph,artwork)*secondHeight/RIWAYAH_SVG_HEIGHT_MM}mm`,
     height:`${secondHeight}mm`,WebkitMaskImage:`url("${riwayahSvgUrl(glyph,artworkBase)}")`,
     maskImage:`url("${riwayahSvgUrl(glyph,artworkBase)}")`}}/>)}
   </div>:<div className="certificate-reading-label" style={{fontFamily:"'Sakkal Kitab',serif",fontSize:'11pt',color:secondary,...readingStyle,
    ...(qiraatSettings?{marginTop:`${(qiraatSettings.riwayahGapMm??2)+(qiraatSettings.riwayahOffsetMm??0)}mm`}:{}),
   }} dir="rtl">{sakkalPrintNodes(readingLine(heading),!readingStyle?.fontFamily||readingStyle.fontFamily.includes('Sakkal Kitab'))}</div>)}
 </div>;
});
export default CertificateHeading;

/** Scale the entire original heading uniformly; never squeeze separate SVGs. */
export function CertificateHeadingPreview(props:Props){
 return <MatnHeadingPreview paper positionedHeading borderNumber={props.matnSettings?.borderNumber} artwork={props.artwork} base={props.artworkBase} color={props.primary}><CertificateHeading {...props}/></MatnHeadingPreview>;
}
