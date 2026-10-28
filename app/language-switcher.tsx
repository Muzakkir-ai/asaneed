import { languageOptions, messages, type Locale } from '../lib/i18n';
import { changeLanguage } from './language-actions';
export default function LanguageSwitcher({locale,returnTo='/'}:{locale:Locale;returnTo?:string}) {
 return <form action={changeLanguage} className="language-switcher" aria-label={messages[locale].language}>
  <input type="hidden" name="returnTo" value={returnTo}/>
  {languageOptions.map(language=><button key={language.value} type="submit" name="locale" value={language.value} lang={language.value} dir={language.direction} aria-pressed={locale===language.value}>{language.label}</button>)}
 </form>;
}
