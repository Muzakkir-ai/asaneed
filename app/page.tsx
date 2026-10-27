import VerificationForm from './verification-form';
export default function Home() {
 return <div className="verification-page">
  <header className="site-header"><div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 8c-4-3-8-3-12-2v19c4-1 8-1 12 2 4-3 8-3 12-2V6c-4-1-8-1-12 2Z"/><path d="M16 8v19M8 11c2-.3 3.5 0 5 1M8 16c2-.3 3.5 0 5 1M19 12c1.5-1 3-1.3 5-1M19 17c1.5-1 3-1.3 5-1"/></svg></div><div><span className="brand-name">الأسانيد</span><span className="brand-subtitle">توثيق الإجازات</span></div></header>
  <section className="checker-intro"><p className="eyebrow">سجل الإجازات</p><h1>التحقق من الإجازة</h1><p className="intro-description">أدخل رقم الإجازة للاطلاع على بياناتها والتحقق من اعتمادها.</p></section>
  <VerificationForm/>
  <footer className="site-footer">منصة الأسانيد والإجازات</footer>
 </div>;
}
