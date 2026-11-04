'use client';
import {useState} from 'react';
import EditorPage from '../../legacy/components/EditorPage';
import MatnDocumentEditor from '../../legacy/components/MatnDocumentEditor';
import {MatnPreview,type MatnFormat} from '../../legacy/components/MatnFormatting';
import {Button} from '../../legacy-ui/ui/button';
import '../../app/studio/studio.css';
export default function Review(){
 const [sanad,S]=useState('قرأت هذا المتن على شيخي بالسند المحفوظ.'),[wording,W]=useState('أجزت الطالب برواية هذا المتن.'),[formats,F]=useState<MatnFormat[]>([]),[open,O]=useState(true),[revision,R]=useState(0);
 return <div className="zite-app"><main className="p-4 sm:p-8 space-y-4" dir="rtl"><p>واجهة تجريبية — لا تحفظ بيانات حقيقية</p><Button variant="outline" onClick={()=>document.documentElement.classList.toggle('dark')}>تبديل المظهر</Button>{open?<EditorPage title="المقدمة الجزرية" context="الشيخ: مثال تجريبي / المتون العلمية" backLabel="العودة إلى المتون" onBack={()=>O(false)} onSave={async()=>{R(v=>v+1);return true;}} saveRevision={revision} dirtyKey={JSON.stringify([sanad,wording,formats])}><MatnDocumentEditor sanad={sanad} wording={wording} formats={formats} onSanadChange={S} onWordingChange={W} onFormatsChange={F} templates={[]} onSave={async()=>true} saving={false} saveRevision={revision} draftKey="synthetic-preview-only" heading={<p>إعدادات عنوان المتن</p>} preview={<MatnPreview sanad={sanad} wording={wording} bookName="المقدمة الجزرية" formats={formats}/>}/></EditorPage>:<Button onClick={()=>O(true)}>فتح المحرر</Button>}</main></div>;
}