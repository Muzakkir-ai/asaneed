'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {composeStructuredSanad} from '../../legacy/lib/unifiedSanad';
import MatnFormatting,{MatnPreview} from '../../legacy/components/MatnFormatting';
import {renderRichSanadFlow} from '../../legacy/components/RichSanadFlow';
import CertificateHeading from '../../legacy/components/CertificateHeading';
import CertificateViewport from '../../legacy/components/CertificateViewport';
import {MatnHeadingControls} from '../../legacy/components/MatnHeadingControls';
import {DEFAULT_MATN_HEADING,headingTextTopMm} from '../../legacy/lib/matnPresentation';
import {certificateOverflows} from '../../legacy/lib/printOverflow';
import type {MatnFormat} from '../../legacy/lib/matnRichText';
import type {Artwork} from '../../legacy/lib/artworkCatalog';
import {applyAssets} from '../../legacy/lib/assets';
import '../../app/studio/studio.css';
const unifiedChain=composeStructuredSanad({id:'b',title:'كتاب تجريبي',author_id:'a',archived:false},{branches:[[]]} as any,{branches:[[{person_id:'x',route_source:true}],[{person_id:'y',route_source:true}]],continuation:'عن صاحب الرواية، عن الإمام، عن الصحابي، عن النبي ﷺ'} as any,[{id:'a',name:'صاحب الكتاب',display_name:'',archived:false},{id:'x',name:'الراوي الأول',display_name:'',archived:false},{id:'y',name:'الراوي الثاني',display_name:'',archived:false}],'بداية السند').text;
const sanad='قال أَحْمَدُ عن أَحْمَدُ كما أجازني الشيخ، وقرأ الطالب النص بإتقان.';
const catalog:Artwork[]=[{kind:'books',number:'02',line:'heading',path:'svg/books/02/heading.svg',label:'المقدمة الجزرية',width:186.29,height:48.19},{kind:'books',number:'02',line:'line-02',path:'svg/books/02/line-02.svg',label:'المقدمة الجزرية',width:184.97,height:19.84}];
const base='https://cdn.jsdelivr.net/gh/Muzakkir-ai/fonts@ac3a0a0f6e5f8fb96d84dc1bb7be41fc021f31a8';
export default function Review(){
 const [text,setText]=useState(sanad),[formats,setFormats]=useState<MatnFormat[]>([]),[heading,setHeading]=useState({...DEFAULT_MATN_HEADING}),[top,setTop]=useState(60),[overflow,setOverflow]=useState(false),[ready,setReady]=useState(false);
 const paper=useRef<HTMLDivElement>(null),header=useRef<HTMLDivElement>(null),body=useRef<HTMLDivElement>(null),footer=useRef<HTMLDivElement>(null);
 useEffect(()=>{applyAssets('https://github.com/Muzakkir-ai/fonts','main','ac3a0a0f6e5f8fb96d84dc1bb7be41fc021f31a8',catalog);setReady(true);},[]);
 useEffect(()=>{const check=()=>{const p=paper.current,h=header.current,b=body.current,f=footer.current;if(!p||!h||!b||!f)return;setTop(headingTextTopMm(h.offsetTop,h.offsetHeight,p.offsetWidth));setOverflow(certificateOverflows({page:p.getBoundingClientRect(),header:h.getBoundingClientRect(),body:b.getBoundingClientRect(),footer:f.getBoundingClientRect(),scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth}));};const observer=new ResizeObserver(check);[paper.current,header.current,body.current].forEach(n=>n&&observer.observe(n));check();return()=>observer.disconnect();},[heading,top]);
 return <div className="zite-app"><div className="review-editor" style={{maxWidth:900,margin:'30px auto',padding:16}}><MatnFormatting label="محرر النصوص" sanad={text} formats={formats} onChange={setText} onFormatsChange={setFormats} onSave={async()=>true}/><pre data-testid="state" style={{display:'none'}}>{JSON.stringify({text,formats,heading,top,overflow,ready})}</pre><details open><summary>تنسيق عنوان المتن</summary><MatnHeadingControls name="المقدمة الجزرية" value={heading} onChange={setHeading} artwork={catalog} base={base} primary="#926e35" secondary="#075f69"/></details>{ready&&<div data-testid="composed"><MatnPreview headingSettings={heading} bookName="المقدمة الجزرية" sanad={sanad}/></div>}</div>
 <div className="certificate-print-screen"><CertificateViewport><div ref={paper} className="review-print print-area" dir="rtl" style={{position:'relative',width:'297mm',height:'210mm',boxSizing:'border-box',padding:`${top}mm 16mm 24mm`,fontFamily:'KSA Regular',fontSize:'12pt',lineHeight:2,background:'white','--sanad-text-top':`${top}mm`} as CSSProperties}><CertificateHeading ref={header} heading="إجازة في المقدمة الجزرية" matnSettings={heading} primary="#926e35" secondary="#075f69" artwork={catalog} artworkBase={base}/><div ref={body}>{renderRichSanadFlow(unifiedChain+' '+sanad+' وبقية السند تتصل بهذا النص من دون فاصل.\nالفقرة الثانية كما قرأها الطالب.', '#926e35','#075f69',[{text:sanad,scope:sanad,start:0,end:sanad.length,font:'KSA Regular',size:12,color:'charcoal',rich:[{text:'أَحْمَدُ',start:4,end:12,bold:true,color:'primary',center:false,indent:0}]}],value=><>{value}</>)}</div><div ref={footer} style={{position:'absolute',bottom:'15mm',left:'16mm',right:'16mm'}}>تذييل تجريبي لفحص المساحة</div></div></CertificateViewport></div>
 <style>{`@page{size:A4 landscape;margin:0}@media print{.review-editor{display:none}.review-print{margin:0!important}body>main{max-width:none;padding:0}}`}</style></div>;
}
