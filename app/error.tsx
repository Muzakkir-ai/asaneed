'use client';
import { useLanguage } from './language-provider';
export default function ErrorPage({ reset }: { reset: () => void }) {
 const {t}=useLanguage();
 return <section className="panel"><h1>{t.pageError}</h1><p role="alert">{t.retryHelp}</p><button onClick={reset}>{t.retry}</button></section>;
}
