'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="panel"><h1>تعذر تحميل الصفحة</h1><p role="alert">يرجى المحاولة مجددًا.</p><button onClick={reset}>إعادة المحاولة</button></section>; }
