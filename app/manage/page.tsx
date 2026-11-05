import {readSetupCookie} from '../../lib/account-setup';
import {redirect} from 'next/navigation';
import {managementSession} from '../../lib/manage-session';
import {getLocale} from '../../lib/locale-server';
import {messages} from '../../lib/i18n';
import {logout} from '../login/actions';
export default async function Manage(){const [{account},locale]=await Promise.all([managementSession(),getLocale()]);if(account?.active)redirect('/studio');if(await readSetupCookie())redirect('/activate-account');const t=messages[locale];return <section className="panel"><h1>{t.pendingAccount}</h1><p>{t.activationHelp}</p><p><a href="/activate-account">{locale==='ar'?'لديك اسم دخول ورمز تفعيل؟':locale==='ur'?'فعال سازی کوڈ موجود ہے؟':'Have an account setup code?'}</a></p><form action={logout}><button>{t.signOut}</button></form></section>;}