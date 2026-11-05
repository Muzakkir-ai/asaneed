import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
import PasswordField from '../password-field';
import Link from 'next/link';
import {getLocale} from '../../lib/locale-server';
import {activationMessages} from '../../lib/activation-i18n';
import {authMessages} from '../../lib/auth-i18n';
import {createClient} from '../../lib/supabase/server';
import {readSetupCookie,setupState} from '../../lib/account-setup';
import {beginActivation,requestSetupEmail,finishActivation,resetActivation,signOutForActivation} from './actions';
export const dynamic='force-dynamic';
export default async function Activate({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}){
 const [locale,params,credential]=await Promise.all([getLocale(),searchParams,readSetupCookie()]),t=activationMessages[locale],auth=authMessages[locale];
 const client=await createClient();let state=null;try{if(credential)state=await setupState(client,credential);}catch{}
 const identity=await client.auth.getUser();
 return <AuthShell path="/activate-account"><h1>{t.title}</h1><p>{t.intro}</p>{params.error&&<p className="error" role="alert">{params.error==='invalid'?t.invalid:params.error==='mismatch'?t.mismatch:t.error}</p>}{params.notice==='sent'&&<p className="auth-notice" role="status">{t.sent}</p>}
 {!state?<form action={beginActivation}><label htmlFor="username">{t.username}</label><input id="username" name="username" dir="ltr" autoComplete="username" required minLength={3} maxLength={30}/><label htmlFor="code">{t.code}</label><input id="code" name="code" type="password" dir="ltr" autoComplete="one-time-code" required maxLength={100}/><SubmitButton pendingLabel={t.working}>{t.start}</SubmitButton></form>:<><p><strong>{state.name}</strong> · <bdi dir="ltr">@{state.username}</bdi></p>{state.emailVerified?<><p className="auth-notice">{t.verified}</p><p dir="ltr">{state.email}</p><form action={finishActivation}><label htmlFor="password">{t.password}</label><PasswordField autoComplete="new-password" minLength={8} showLabel={auth.showPassword} hideLabel={auth.hidePassword}/><label htmlFor="confirmPassword">{t.confirm}</label><input id="confirmPassword" name="confirmPassword" type="password" dir="ltr" autoComplete="new-password" required minLength={8} maxLength={1024}/><SubmitButton pendingLabel={t.working}>{t.finish}</SubmitButton></form></>:<form action={requestSetupEmail}><label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" dir="ltr" autoComplete="email" defaultValue={state.email} readOnly={state.emailLocked} required maxLength={254}/><p className="field-hint">{t.emailHint}</p><SubmitButton pendingLabel={t.working}>{t.send}</SubmitButton></form>}<form action={resetActivation}><button type="submit" className="secondary">{t.reset}</button></form>{identity.data.user&&!state.emailVerified&&<form action={signOutForActivation}><button type="submit" className="secondary">{t.other}</button></form>}</>}
 {credential&&!state&&<form action={resetActivation}><button type="submit" className="secondary">{t.reset}</button></form>}<p className="field-hint"><Link href="/login">{auth.haveAccount}</Link></p></AuthShell>;
}
