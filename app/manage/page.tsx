import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { logout } from '../login/actions';
import { getLocale } from '../../lib/locale-server';
import { messages } from '../../lib/i18n';
export const dynamic = 'force-dynamic';
export default async function Manage() {
 const t=messages[await getLocale()];
 const client = await createClient();
 const { data, error } = await client.auth.getClaims();
 if (error || !data?.claims?.sub) redirect('/login');
 const { data: account, error: accountError } = await client.from('accounts').select('id,display_name,role,active').eq('auth_user_id',data.claims.sub).maybeSingle();
 if (accountError) return <section className="panel"><h1>{t.accountError}</h1><p role="alert">{t.connectionError}</p></section>;
 if (!account?.active) return <section className="panel"><h1>{t.pendingAccount}</h1><p>{t.activationHelp}</p><form action={logout}><button>{t.signOut}</button></form></section>;
 return <section className="panel"><h1>{t.welcome} <bdi>{account.display_name}</bdi></h1><p>{t.managementPreparing}</p><form action={logout}><button>{t.signOut}</button></form></section>;
}
