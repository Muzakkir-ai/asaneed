import {useEffect,useRef,useState} from 'react';
import type {Artwork} from '../lib/artworkCatalog';
import {printSvg} from '../lib/printSvg';
export type ArtworkStatus='loading'|'ready'|'error';
export default function PrintSafeIssuerArtwork({artwork,base,primary,secondary,onStatus,retry=0}:{artwork:Artwork[];base:string;primary:string;secondary:string;onStatus:(status:ArtworkStatus)=>void;retry?:number}){
 const items=artwork.map(a=>({path:a.path,line:a.line,width:a.width/artwork[0].height*10.5,height:a.height/artwork[0].height*10.5,color:a.line==='line-03'?secondary:primary}));
 const signature=JSON.stringify([base,items,retry]);
 const [prepared,P]=useState<{key:string;images:string[]}>({key:'',images:[]});
 const loaded=useRef(new Set<number>()),activeKey=useRef(signature);activeKey.current=signature;
 useEffect(()=>{let active=true;loaded.current=new Set();onStatus('loading');const [source,entries]=JSON.parse(signature) as [string,typeof items,number];
  Promise.all(entries.map(a=>printSvg(source+'/'+a.path,a.width,a.height,a.color))).then(images=>{if(active)P({key:signature,images});}).catch(()=>{if(active){P({key:'',images:[]});onStatus('error');}});
  return()=>{active=false;};
 },[signature,onStatus]);
 return <>{items.map((a,index)=>prepared.key===signature?<img key={a.path} alt="" aria-hidden="true" data-issuer-artwork={a.line} src={prepared.images[index]} style={{display:'block',width:a.width+'mm',height:a.height+'mm',maxWidth:'100%',objectFit:'contain',border:0,boxShadow:'none'}} onLoad={()=>{if(activeKey.current!==signature)return;loaded.current.add(index);if(loaded.current.size===items.length)onStatus('ready');}} onError={()=>{if(activeKey.current!==signature)return;P({key:'',images:[]});onStatus('error');}}/>:<span key={a.path} aria-hidden="true" style={{display:'block',width:a.width+'mm',height:a.height+'mm',maxWidth:'100%',backgroundColor:a.color,maskImage:`url("${base}/${a.path}")`,WebkitMaskImage:`url("${base}/${a.path}")`,maskSize:'contain',WebkitMaskSize:'contain',maskPosition:'center',WebkitMaskPosition:'center',maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat'}}/>)}</>;
}
