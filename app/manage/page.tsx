import {redirect} from 'next/navigation';
import {managementSession} from '../../lib/manage-session';
import {getLocale} from '../../lib/locale-server';
import {messages} from '../../lib/i18n';
import {logout} from '../login/actions';
export default async function Manage(){const [{account},locale]=await Promise.all([managementSession(),getLocale()]);if(account?.active)redirect('/studio');const t=messages[locale];return <section className="panel"><h1>{t.pendingAccount}</h1><p>{t.activationHelp}</p><form action={logout}><button>{t.signOut}</button></form></section>;}