import {useMemo,type ReactNode} from 'react';
import QRCode from 'qrcode';

type Props={url:string;primary:string;secondary:string};
const luminance=(hex:string)=>{
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
const legible=(hex:string)=>/^#[0-9a-f]{6}$/i.test(hex)&&((1.05)/(luminance(hex)+.05)>=4.5)?hex:'#203454';

/** Actual scannable two-color QR. Nothing is drawn behind it: the certificate
 * already supplies the white paper and the four-module quiet zone is empty. */
export default function CertificateQR({url,primary,secondary}:Props){
 const qr=useMemo(()=>QRCode.create(url,{errorCorrectionLevel:'H'}),[url]);
 const size=qr.modules.size;
 const points=qr.modules.data;
 const ink=legible(primary);
 const corner=legible(secondary);
 const rects:ReactNode[]=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   if(!points[y*size+x])continue;
   const finder=(x<7&&y<7)||(x>=size-7&&y<7)||(x<7&&y>=size-7);
   rects.push(<rect key={y*size+x} x={x+4} y={y+4} width="1" height="1" fill={finder?corner:ink}/>);
 }
 return <svg className="certificate-qr-code" viewBox={`0 0 ${size+8} ${size+8}`} shapeRendering="crispEdges"
  width="20mm" height="20mm" role="img" aria-label="رمز التحقق من الشهادة" xmlns="http://www.w3.org/2000/svg">
  {rects}
 </svg>;
}
