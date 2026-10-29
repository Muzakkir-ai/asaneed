import type {Artwork} from '../lib/artworkCatalog';
import {forwardRef,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {svgReadingParts,riwayahSvgWidthMm,riwayahSvgUrl,RIWAYAH_SVG_HEIGHT_MM} from '../lib/riwayahSvgHeading';

/** Keep legacy reading ligatures and the original print geometry in one renderer. */
function readingLine(value:string):ReactNode{
 const match=value.match(/^ب([\u064b-\u065f]*)ر([\u064b-\u065f]*)(?=و)/u);
 if(!match)return value;
 return <><span className="certificate-reading-glyph">{'\uFE91'}{match[1]}</span><span className="certificate-reading-glyph">{'\uFEAE'}{match[2]}</span><span>{value.slice(match[0].length)}</span></>;
}
type Props={heading:string;primary:string;secondary:string;readingStyle?:CSSProperties;preserveHistoricalRoute?:boolean;artwork?:Artwork[];artworkBase?:string};
const CertificateHeading=forwardRef<HTMLDivElement,Props>(function CertificateHeading({heading,primary,secondary,readingStyle,preserveHistoricalRoute=false,artwork,artworkBase},ref){
 const pieces=svgReadingParts(heading,{preserveHistoricalRoute,catalog:artwork});
 return <div ref={ref} className="certificate-header-art" aria-label="البسملة وشهادة الإجازة" style={{'--certificate-primary':primary,'--certificate-secondary':secondary} as CSSProperties}>
  <div className="certificate-basmalah-svg" role="img" aria-label="بسم الله الرحمن الرحيم" style={artworkBase?{WebkitMaskImage:`url("${artworkBase}/svg/basmalah.svg")`,maskImage:`url("${artworkBase}/svg/basmalah.svg")`}:undefined}/>
  <div className="certificate-ijazah-svg" role="img" aria-label="شهادة إجازة" style={{backgroundColor:primary,...(artworkBase?{WebkitMaskImage:`url("${artworkBase}/svg/ijazah.svg")`,maskImage:`url("${artworkBase}/svg/ijazah.svg")`}:{})}}/>
  {heading&&(pieces?<div className="certificate-reading-svg-line" role="img" aria-label={heading} dir="rtl">{pieces.map((glyph,index)=><span key={glyph+'-'+index} aria-hidden="true" className="certificate-reading-svg-piece" style={{width:`${riwayahSvgWidthMm(glyph,artwork)}mm`,height:`${RIWAYAH_SVG_HEIGHT_MM}mm`,WebkitMaskImage:`url("${riwayahSvgUrl(glyph,artworkBase)}")`,maskImage:`url("${riwayahSvgUrl(glyph,artworkBase)}")`}}/>)}</div>:<div className="certificate-reading-label" style={{fontFamily:"'Sakkal Kitab',serif",fontSize:'11pt',color:secondary,...readingStyle}} dir="rtl">{readingLine(heading)}</div>)}
 </div>;
});
export default CertificateHeading;

/** Scale the entire original heading uniformly; never squeeze separate SVGs. */
export function CertificateHeadingPreview(props:Props){
 const frame=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null);
 const [layout,setLayout]=useState({scale:1,height:150});
 const pieces=svgReadingParts(props.heading,{preserveHistoricalRoute:props.preserveHistoricalRoute,catalog:props.artwork});
 const widthMm=pieces?Math.max(98.0244,pieces.reduce((sum,p)=>sum+riwayahSvgWidthMm(p,props.artwork),0)):208.2;
 useEffect(()=>{const f=frame.current,s=stage.current;if(!f||!s)return;const update=()=>{const scale=Math.min(1,Math.max(0,(f.clientWidth-24)/s.offsetWidth));setLayout({scale,height:s.offsetHeight*scale+24});};update();const observer=new ResizeObserver(update);observer.observe(f);observer.observe(s);return()=>observer.disconnect();},[widthMm,props.heading]);
 return <div ref={frame} className="certificate-heading-preview" style={{height:layout.height}}><div ref={stage} className="certificate-heading-stage" style={{width:`${widthMm}mm`,transform:`translateX(-50%) scale(${layout.scale})`}}><CertificateHeading {...props}/></div></div>;
}
