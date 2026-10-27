import { cache } from 'react';
import { cookies } from 'next/headers';
import { isLocale, type Locale } from './i18n';
export const localeCookie = 'asaneed-language';
export const getLocale = cache(async (): Promise<Locale> => {
 const value = (await cookies()).get(localeCookie)?.value;
 return isLocale(value) ? value : 'ar';
});
