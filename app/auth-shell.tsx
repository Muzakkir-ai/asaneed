import Link from 'next/link';
import LanguageSwitcher from './language-switcher';
import { getLocale } from '../lib/locale-server';
import { authMessages } from '../lib/auth-i18n';
import {messages} from '../lib/i18n';
export default async function AuthShell({children,path}:{children:React.ReactNode;path:string}) {
 const locale=await getLocale();
 return <section className="panel auth-panel"><header className="auth-brand"><Link href="/" className="auth-brand-name">{messages[locale].brand}</Link><LanguageSwitcher locale={locale} returnTo={path}/></header><div className="auth-content">{children}<p className="auth-back"><Link href="/">{authMessages[locale].back}</Link> · <Link href="/privacy">{locale==='ar'?'الخصوصية':locale==='ur'?'رازداری':'Privacy'}</Link></p></div></section>;
}
