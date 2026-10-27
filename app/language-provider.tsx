'use client';
import { createContext, useContext } from 'react';
import { messages, type Locale } from '../lib/i18n';
const LanguageContext = createContext<Locale>('ar');
export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
 return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { const locale=useContext(LanguageContext); return { locale,t:messages[locale] }; }
