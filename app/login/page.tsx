import {activationMessages} from '../../lib/activation-i18n';
import {readSetupCookie} from '../../lib/account-setup';
import {redirect} from 'next/navigation';
import {createClient} from '../../lib/supabase/server';
import Link from 'next/link';
import { login, googleLogin } from './actions';
import { getLocale } from '../../lib/locale-server';
import { messages } from '../../lib/i18n';
import { authMessages } from '../../lib/auth-i18n';
import { googleEnabled } from '../../lib/auth';
import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
import PasswordField from '../password-field';
export async function generateMetadata() {
 const locale=await getLocale();
 return {title:`${messages[locale].login} | ${messages[locale].brand}`};
}
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}) {
 const [{error,notice},locale,google]=await Promise.all([searchParams,getLocale(),googleEnabled()]);
 const existing=await (await createClient()).auth.getUser();if(existing.data.user)redirect(await readSetupCookie()?'/activate-account':'/studio');
 const t=messages[locale],a=authMessages[locale];
 return <AuthShell path="/login"><h1>{t.login}</h1><p>{a.loginIntro}</p>
 {error&&<p className="error" role="alert">{error==='google'?a.googleSetup:error==='expired'?a.expired:error==='request'?a.requestError:t.loginError}</p>}
 {notice&&<p className="auth-notice" role="status">{notice==='password'?a.passwordSaved:a.signupSent}</p>}
 <form action={googleLogin} className="google-signin">{google?<SubmitButton pendingLabel={a.working}><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59A6 6 0 0 1 12 5.95Z"/></svg><span>{a.google}</span></SubmitButton>:<><button type="button" disabled>{a.google}</button><p className="field-hint">{a.googleSetup}</p></>}</form>
 <div className="auth-divider"><span>{a.or}</span></div>
 <form action={login}>
 <label htmlFor="email">{a.emailOrUsername}</label><input id="email" name="email" type="text" autoComplete="username" dir="ltr" required maxLength={254} autoCapitalize="none" spellCheck={false} aria-describedby="identifier-hint"/>
 <p id="identifier-hint" className="field-hint">{a.identifierHint}</p>
 <label htmlFor="password">{t.password}</label><PasswordField showLabel={a.showPassword} hideLabel={a.hidePassword}/>
 <SubmitButton pendingLabel={a.working}>{t.signIn}</SubmitButton></form>
 <nav className="auth-links"><Link href="/forgot-password">{a.forgot}</Link><Link href="/register">{a.register}</Link></nav>
 <p className="field-hint"><Link href="/activate-account">{activationMessages[locale].link}</Link></p><p className="field-hint">{a.approval}</p></AuthShell>;
}
