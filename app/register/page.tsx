import Link from 'next/link';
import { register } from '../login/actions';
import { getLocale } from '../../lib/locale-server';
import { authMessages } from '../../lib/auth-i18n';
import { messages } from '../../lib/i18n';
import AuthShell from '../auth-shell';
import SubmitButton from '../submit-button';
export default async function Register({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const [locale,{error}]=await Promise.all([getLocale(),searchParams]); const a=authMessages[locale],t=messages[locale];
 return <AuthShell path="/register"><h1>{a.register}</h1><p>{a.registerIntro}</p>
 {error&&<p className="error" role="alert">{error==='mismatch'?a.mismatch:error==='invalid'?a.invalid:a.requestError}</p>}
 <form action={register}><label htmlFor="name">{a.name}</label><input id="name" name="name" autoComplete="name" required maxLength={120}/>
 <label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" required maxLength={254}/>
 <label htmlFor="password">{t.password}</label><input id="password" name="password" type="password" autoComplete="new-password" dir="ltr" required minLength={8} maxLength={1024} aria-describedby="password-hint"/>
 <p id="password-hint" className="field-hint">{a.passwordHint}</p>
 <label htmlFor="confirmPassword">{a.confirmPassword}</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" dir="ltr" required minLength={8} maxLength={1024}/>
 <SubmitButton pendingLabel={a.working}>{a.register}</SubmitButton></form><p><Link href="/login">{a.haveAccount}</Link></p></AuthShell>;
}
