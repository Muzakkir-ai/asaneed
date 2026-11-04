import {assetBase,currentArtwork} from '../lib/assets';
import type {Artwork} from '../lib/artworkCatalog';
/** Render only catalogued, pinned artwork; never an arbitrary user URL. */
export default function CertificateBorder({number,color,artwork=currentArtwork(),base=assetBase()}:{number?:string;color:string;artwork?:Artwork[];base?:string}){
 if(number==='none')return null;
 if(!number||number==='default')return <div aria-hidden="true" className="certificate-ornament" style={{backgroundColor:color}}/>;
 const border=artwork.find(item=>item.kind==='borders'&&item.number===number&&item.line==='frame');
 if(!border)return <div aria-hidden="true" className="certificate-ornament" style={{backgroundColor:color}}/>;
 return <div aria-hidden="true" className="certificate-custom-border" style={{position:'absolute',inset:'2mm',pointerEvents:'none',zIndex:0,backgroundColor:color,maskImage:`url("${base}/${border.path}")`,WebkitMaskImage:`url("${base}/${border.path}")`,maskSize:'contain',WebkitMaskSize:'contain',maskPosition:'center',WebkitMaskPosition:'center',maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat'}}/>;
}
