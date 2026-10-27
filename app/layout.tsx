import type { Metadata } from 'next';
import '@fontsource-variable/readex-pro';
import './globals.css';
import { direction, messages } from '../lib/i18n';
import { getLocale } from '../lib/locale-server';
import { LanguageProvider } from './language-provider';
export async function generateMetadata(): Promise<Metadata> {
 const t=messages[await getLocale()];
 return {title:t.title,description:t.description};
}
export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
 const locale=await getLocale();
 return <html lang={locale} dir={direction(locale)}><body><LanguageProvider locale={locale}><main>{children}</main></LanguageProvider></body></html>;
}
