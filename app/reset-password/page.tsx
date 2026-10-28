import { redirect } from 'next/navigation';
import { updatePassword } from '../login/actions';
import { createClient } from '../../lib/supabase/server';
import { getLocale } from '../../lib/locale-server';
import { authMessages } from '../../lib/auth-i18n';
import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
export default async function ResetPassword({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const client=await createClient();const {data,error:identityError}=await client.auth.getUser();
 if(identityError||!data.user)redirect('/forgot-password?error=expired');
 const [locale,{error}]=await Promise.all([getLocale(),searchParams]);const a=authMessages[locale];
 return <AuthShell path="/reset-password"><h1>{a.resetTitle}</h1>
 {error&&<p className="error" role="alert">{error==='mismatch'?a.mismatch:error==='invalid'?a.invalid:a.requestError}</p>}
 <form action={updatePassword}><label htmlFor="password">{a.newPassword}</label><input id="password" name="password" type="password" autoComplete="new-password" dir="ltr" required minLength={12} maxLength={1024} aria-describedby="password-hint"/><p id="password-hint" className="field-hint">{a.passwordHint}</p>
 <label htmlFor="confirmPassword">{a.confirmPassword}</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" dir="ltr" required minLength={12} maxLength={1024}/><SubmitButton pendingLabel={a.working}>{a.savePassword}</SubmitButton></form></AuthShell>;
}
