import { requestReset } from '../login/actions';
import { getLocale } from '../../lib/locale-server';
import { authMessages } from '../../lib/auth-i18n';
import { messages } from '../../lib/i18n';
import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
export default async function ForgotPassword({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}) {
 const [locale,{error,notice}]=await Promise.all([getLocale(),searchParams]); const a=authMessages[locale];
 return <AuthShell path="/forgot-password"><h1>{a.resetTitle}</h1><p>{a.resetIntro}</p>
 {error&&<p className="error" role="alert">{error==='expired'?a.expired:error==='invalid'?a.invalid:a.requestError}</p>}
 {notice?<p className="auth-notice" role="status">{a.resetSent}</p>:<form action={requestReset}><label htmlFor="email">{messages[locale].email}</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" required maxLength={254}/><SubmitButton pendingLabel={a.working}>{a.sendReset}</SubmitButton></form>}</AuthShell>;
}
