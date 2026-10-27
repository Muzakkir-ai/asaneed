'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isLocale } from '../lib/i18n';
import { localeCookie } from '../lib/locale-server';
export async function changeLanguage(form: FormData) {
 const locale = form.get('locale');
 if (!isLocale(locale)) return;
 (await cookies()).set(localeCookie,locale,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*365});
 redirect('/');
}
