import { login } from './actions';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
 const { error } = await searchParams;
 return <section className="panel"><h1>تسجيل الدخول</h1><p>للحسابات المفعّلة من إدارة المنصة.</p><form action={login}>
 {error && <p className="error" role="alert">تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ثم حاول مجددًا.</p>}
 <label htmlFor="email">البريد الإلكتروني</label><input id="email" name="email" type="email" autoComplete="username" dir="ltr" required maxLength={254}/>
 <label htmlFor="password">كلمة المرور</label><input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required maxLength={1024}/>
 <button type="submit">دخول</button></form></section>;
}
