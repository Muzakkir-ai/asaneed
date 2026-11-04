import {useEffect,useRef,useState,type ReactNode} from 'react';
import CertificateViewport from './CertificateViewport';
import CertificateBorder from './CertificateBorder';
/** Same physical A4 landscape dimensions as issued certificates. Viewer zoom is external. */
export default function MatnA4Preview({children,borderNumber}:{children:ReactNode;borderNumber?:string}){
 const page=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null),[overflow,setOverflow]=useState(false);
 useEffect(()=>{const p=page.current,c=content.current;if(!p||!c)return;const check=()=>setOverflow(c.scrollHeight>c.clientHeight+1||c.scrollWidth>c.clientWidth+1);const observer=new ResizeObserver(check);observer.observe(c);observer.observe(p);check();return()=>observer.disconnect();},[children]);
 return <div className="space-y-3"><p className="text-sm text-muted-foreground">معاينة A4 أفقية — ٢٩٧ × ٢١٠ مم. التكبير يغيّر العرض فقط.</p>{overflow&&<p role="alert" className="text-sm text-destructive">النص يتجاوز مساحة الصفحة. راجع الحجم أو المسافات؛ لم يُصغّر النص تلقائيًا.</p>}<CertificateViewport><div ref={page} className="matn-a4-paper" style={{position:'relative',width:'297mm',height:'210mm',boxSizing:'border-box',background:'#fffdf9',color:'#202020',padding:'14mm 16mm'}}><CertificateBorder number={borderNumber} color="var(--matn-primary,#926e35)"/><div ref={content} style={{position:'relative',zIndex:1,height:'100%',overflow:'auto'}}>{children}</div></div></CertificateViewport></div>;
}
