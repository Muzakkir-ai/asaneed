import Link from 'next/link';
import { login, googleLogin } from './actions';
import { getLocale } from '../../lib/locale-server';
import { messages } from '../../lib/i18n';
import { authMessages } from '../../lib/auth-i18n';
import { googleEnabled } from '../../lib/auth';
import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}) {
 const [{error,notice},locale,google]=await Promise.all([searchParams,getLocale(),googleEnabled()]);
 const t=messages[locale],a=authMessages[locale];
 return <AuthShell path="/login"><h1>{t.login}</h1><p>{a.loginIntro}</p>
 {error&&<p className="error" role="alert">{error==='google'?a.googleSetup:error==='expired'?a.expired:error==='request'?a.requestError:t.loginError}</p>}
 {notice&&<p className="auth-notice" role="status">{notice==='password'?a.passwordSaved:a.signupSent}</p>}
 <form action={googleLogin}>{google?<SubmitButton pendingLabel={a.working}>{a.google}</SubmitButton>:<><button type="button" disabled>{a.google}</button><p className="field-hint">{a.googleSetup}</p></>}</form>
 <form action={login}>
 <label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="username" dir="ltr" required maxLength={254}/>
 <label htmlFor="password">{t.password}</label><input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required maxLength={1024}/>
 <SubmitButton pendingLabel={a.working}>{t.signIn}</SubmitButton></form>
 <nav className="auth-links"><Link href="/forgot-password">{a.forgot}</Link><Link href="/register">{a.register}</Link></nav>
 <p className="field-hint">{a.approval}</p></AuthShell>;
}
