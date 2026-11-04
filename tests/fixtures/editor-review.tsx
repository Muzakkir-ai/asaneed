'use client';
import {useEffect,useState} from 'react';
import MatnFormatting from '../../legacy/components/MatnFormatting';
import {renderRichSanadFlow} from '../../legacy/components/RichSanadFlow';
import type {MatnFormat} from '../../legacy/lib/matnRichText';
import {applyAssets} from '../../legacy/lib/assets';
import '../studio/studio.css';
const sanad='قال أَحْمَدُ عن أَحْمَدُ كما أجازني الشيخ، وقرأ الطالب النص بإتقان.';
export default function Review(){const [text,setText]=useState(sanad),[formats,setFormats]=useState<MatnFormat[]>([]);useEffect(()=>applyAssets('https://github.com/Muzakkir-ai/fonts','main'),[]);return <div className="zite-app"><div className="review-editor" style={{maxWidth:900,margin:'30px auto',padding:16}}><MatnFormatting label="محرر النصوص" sanad={text} formats={formats} onChange={setText} onFormatsChange={setFormats} onSave={async()=>true}/><pre data-testid="state" style={{display:'none'}}>{JSON.stringify({text,formats})}</pre></div><div className="review-print print-area" dir="rtl" style={{fontFamily:'KSA Regular',fontSize:'12pt',lineHeight:2,width:'260mm',margin:'15mm auto'}}>{renderRichSanadFlow('بداية السند '+sanad+' وبقية السند تتصل بهذا النص من دون فاصل.\nالفقرة الثانية كما قرأها الطالب.', '#0f6469','#D4A75B',[{text:sanad,scope:sanad,start:0,end:sanad.length,font:'KSA Regular',size:12,color:'charcoal',rich:[{text:'أَحْمَدُ',start:4,end:12,bold:true,color:'primary',center:false,indent:0}]}],value=><>{value}</>)}</div><style>{`@page{size:A4 landscape;margin:0}@media screen{.review-print{display:none}}@media print{.review-editor{display:none}.review-print{display:block!important;margin:0!important}body>main{max-width:none;padding:0}}`}</style></div>}
