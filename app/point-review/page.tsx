"use client";
import {useState} from 'react';
import MatnFormatting,{MatnPreview,type MatnFormat} from '../../legacy/components/MatnFormatting';
import {MatnHeadingControls} from '../../legacy/components/MatnHeadingControls';
import {DEFAULT_MATN_HEADING} from '../../legacy/lib/matnPresentation';
import MatnA4Preview from '../../legacy/components/MatnA4Preview';
import '../studio/studio.css';
export default function Review(){const [text,T]=useState('أجزت الطالب بالسند المذكور.\nهذا نص الفقرة الثانية.'),[formats,F]=useState<MatnFormat[]>([]),[heading,H]=useState(DEFAULT_MATN_HEADING);return <div className="zite-app" dir="rtl" style={{padding:24,maxWidth:1100,margin:'auto'}}><h1>فحص حجم النص — بيانات تجريبية</h1><MatnFormatting label="السند التجريبي" baseSize={12} sanad={text} onChange={T} formats={formats} onFormatsChange={F}/><MatnHeadingControls name="متن تجريبي" value={heading} onChange={H} showPreview={false}/><MatnA4Preview borderNumber="none"><MatnPreview bookName="متن تجريبي" sanad={text} formats={formats} headingSettings={heading}/></MatnA4Preview></div>}
