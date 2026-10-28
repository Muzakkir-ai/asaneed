import Link from 'next/link';
import LanguageSwitcher from './language-switcher';
import { getLocale } from '../lib/locale-server';
import { authMessages } from '../lib/auth-i18n';
export default async function AuthShell({children,path}:{children:React.ReactNode;path:string}) {
 const locale=await getLocale();
 return <section className="panel auth-panel"><LanguageSwitcher locale={locale} returnTo={path}/>{children}<p className="auth-back"><Link href="/">{authMessages[locale].back}</Link></p></section>;
}
