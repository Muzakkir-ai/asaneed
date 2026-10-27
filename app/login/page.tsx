import { login } from './actions';
import { getLocale } from '../../lib/locale-server';
import { messages } from '../../lib/i18n';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
 const { error } = await searchParams;
 const t=messages[await getLocale()];
 return <section className="panel"><h1>{t.login}</h1><p>{t.loginIntro}</p><form action={login}>
 {error && <p className="error" role="alert">{t.loginError}</p>}
 <label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="username" dir="ltr" required maxLength={254}/>
 <label htmlFor="password">{t.password}</label><input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required maxLength={1024}/>
 <button type="submit">{t.signIn}</button></form></section>;
}
