import VerificationForm from './verification-form';
import LanguageSwitcher from './language-switcher';
import { getLocale } from '../lib/locale-server';
import { messages } from '../lib/i18n';
export default async function Home() {
 const locale=await getLocale();
 const t=messages[locale];
 return <div className="verification-page">
  <header className="site-header"><div className="brand"><div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 8c-4-3-8-3-12-2v19c4-1 8-1 12 2 4-3 8-3 12-2V6c-4-1-8-1-12 2Z"/><path d="M16 8v19M8 11c2-.3 3.5 0 5 1M8 16c2-.3 3.5 0 5 1M19 12c1.5-1 3-1.3 5-1M19 17c1.5-1 3-1.3 5-1"/></svg></div><div><span className="brand-name">{t.brand}</span><span className="brand-subtitle">{t.subtitle}</span></div></div><div className="site-header-actions"><a className="homepage-login" href="/login">{t.login}</a><LanguageSwitcher locale={locale}/></div></header>
  <section className="checker-intro"><h1>{t.heading}</h1><p className="intro-description">{t.introduction}</p></section>
  <VerificationForm/>
  <footer className="site-footer">{t.footer} · <a href="/studio">{t.login}</a> · <a href="/privacy">{locale==='ar'?'الخصوصية':locale==='ur'?'رازداری':'Privacy'}</a></footer>
 </div>;
}
