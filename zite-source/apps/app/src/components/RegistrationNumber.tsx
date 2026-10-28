import {arabicDigits} from '../lib/arabicDigits';

/** Separate layout boxes keep Arabic-Indic groups in code order in RTL prose. */
export default function RegistrationNumber({value}:{value:string|number}){
 const parts=String(value).split('-');
 return <span dir="ltr" aria-label={arabicDigits(value)} style={{display:'inline-flex',flexDirection:'row',direction:'ltr',unicodeBidi:'isolate',whiteSpace:'nowrap'}}>
  {parts.flatMap((part,index)=>[
   ...(index?[<span aria-hidden="true" key={'separator-'+index}>-</span>]:[]),
   <span key={'part-'+index} dir="ltr">{arabicDigits(part)}</span>,
  ])}
 </span>;
}
