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
 const existing=await (await createClient()).auth.getUser();if(existing.data.user)redirect('/studio');
 const t=messages[locale],a=authMessages[locale],usernameEnabled=Boolean(process.env.USERNAME_LOOKUP_KEY);
 return <AuthShell path="/login"><h1>{t.login}</h1><p>{a.loginIntro}</p>
 {error&&<p className="error" role="alert">{error==='google'?a.googleSetup:error==='expired'?a.expired:error==='request'?a.requestError:t.loginError}</p>}
 {notice&&<p className="auth-notice" role="status">{notice==='password'?a.passwordSaved:a.signupSent}</p>}
 <form action={googleLogin} className="google-signin">{google?<SubmitButton pendingLabel={a.working}>{a.google}</SubmitButton>:<><button type="button" disabled>{a.google}</button><p className="field-hint">{a.googleSetup}</p></>}</form>
 <div className="auth-divider"><span>{a.or}</span></div>
 <form action={login}>
 <label htmlFor="email">{usernameEnabled?a.emailOrUsername:t.email}</label><input id="email" name="email" type={usernameEnabled?'text':'email'} autoComplete="username" dir="ltr" required maxLength={254} autoCapitalize="none" spellCheck={false} aria-describedby={usernameEnabled?"identifier-hint":undefined}/>
 {usernameEnabled&&<p id="identifier-hint" className="field-hint">{a.identifierHint}</p>}
 <label htmlFor="password">{t.password}</label><PasswordField showLabel={a.showPassword} hideLabel={a.hidePassword}/>
 <SubmitButton pendingLabel={a.working}>{t.signIn}</SubmitButton></form>
 <nav className="auth-links"><Link href="/forgot-password">{a.forgot}</Link><Link href="/register">{a.register}</Link></nav>
 <p className="field-hint">{a.approval}</p></AuthShell>;
}
