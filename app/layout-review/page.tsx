"use client";
import {useEffect,useState} from 'react';
import {MatnHeadingControls} from '../../legacy/components/MatnHeadingControls';
import {MatnPreview} from '../../legacy/components/MatnFormatting';
import MatnA4Preview from '../../legacy/components/MatnA4Preview';
import {DEFAULT_MATN_HEADING} from '../../legacy/lib/matnPresentation';
import {applyAssets} from '../../legacy/lib/assets';
import type {Artwork} from '../../legacy/lib/artworkCatalog';
import '../studio/studio.css';
const catalog:Artwork[]=[{kind:'books',number:'02',line:'heading',path:'svg/books/02/heading.svg',label:'المقدمة الجزرية',width:186.29,height:48.19},{kind:'books',number:'02',line:'line-02',path:'svg/books/02/line-02.svg',label:'المقدمة الجزرية',width:184.97,height:19.84}];
export default function Review(){const [heading,H]=useState(DEFAULT_MATN_HEADING);useEffect(()=>{applyAssets('https://github.com/Muzakkir-ai/fonts','main','ac3a0a0f6e5f8fb96d84dc1bb7be41fc021f31a8',catalog)},[]);return <main className="zite-app" dir="rtl" style={{maxWidth:1000,margin:'24px auto',padding:20}}><h1>فحص تنسيق المتن — بيانات تجريبية</h1><MatnHeadingControls name="المقدمة الجزرية" value={heading} onChange={H} artwork={catalog}/><MatnA4Preview borderNumber={heading.borderNumber}><MatnPreview headingSettings={heading} bookName="المقدمة الجزرية" intro="الحمد لله رب العالمين." wording="أجزت الطالب بما تلقيته عن شيوخي." sanad="قرأت على شيخي، عن شيخه، بالسند المذكور." end="والله ولي التوفيق." formats={[]}/></MatnA4Preview></main>}
