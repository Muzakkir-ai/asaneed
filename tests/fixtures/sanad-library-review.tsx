'use client';
import SharedContentPage from '../../legacy/components/SharedContentPage';
import BookTariqBuilder from '../../legacy/components/BookTariqBuilder';
import '../../app/studio/studio.css';
export default function Review(){return <div className="zite-app min-h-screen bg-background text-foreground" dir="rtl" style={{minHeight:'100vh'}}><main className="mx-auto max-w-5xl p-4 space-y-4"><SharedContentPage/><details><summary>مكتبة الكتب والطرق</summary><BookTariqBuilder inline/></details></main></div>;}
