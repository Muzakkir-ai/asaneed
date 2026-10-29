import {QURRA,routeFor,readingText} from './qurra';
import {vocalizeReadingLabel} from './vocalizedReading';
export type AssemblyHolding={tariqNumber?:string;tariqName?:string;qariId:string;rawi?:string;personalChain:string;junction:string;introductionId?:string;wordingId?:string};
export type AssemblySection={id:string;title:string;body:string;sectionType:string;formatting?:string};
const cleanEnd=(s:string)=>s.trim().replace(/[.،؛\s]+$/u,'');
const joinChain=(parts:string[])=>parts.filter(x=>x.trim()).map((part,i,all)=>i===all.length-1?part.trim():cleanEnd(part)+(i===all.length-2?'.':'،')).join(' ');
export function assembleIjazah(holding:AssemblyHolding,sections:AssemblySection[]){
 const imam=QURRA.find(q=>q.id===holding.qariId);
 if(!imam)return {chain:'',heading:'',missing:['القارئ غير معروف'],sectionIds:[] as string[]};
 const narrators=holding.rawi?[holding.rawi]:[...imam.rawis];
 const missing:string[]=[];
 const used:AssemblySection[]=[];
 const byTitle=(title:string,required:boolean)=>{
  const item=sections.find(s=>s.title===title);
  if(!item?.body?.trim()){if(required)missing.push(title);return '';}
  used.push(item);return item.body.trim();
 };
 const customRoute=Boolean(holding.tariqNumber&&holding.tariqName);
 const rawis=customRoute?[]:narrators.map(r=>byTitle(`CHAIN:${imam.id}:${r}`,true));
 const sahaba=customRoute?'':byTitle(`CHAIN:${imam.id}:sahaba`,true);
 const prophet=customRoute?'':byTitle(`CHAIN:${imam.id}:prophet`,true);
 const common=!customRoute&&imam.family==='seven'?byTitle('من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة',true):'';
 const ubaidi=!customRoute&&holding.junction==='ubaydi'?byTitle('من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند',true):'';
 const intro=holding.introductionId?sections.find(s=>s.id===holding.introductionId):undefined;
 const wording=holding.wordingId?sections.find(s=>s.id===holding.wordingId):undefined;
 const conclusion=sections.find(s=>s.sectionType==='conclusion'&&!!s.body?.trim());
 if(holding.introductionId&&!intro)missing.push('المقدمة الثابتة');
 if(holding.wordingId&&!wording)missing.push('كلمات الإجازة');
 if(!holding.personalChain?.trim())missing.push('السند الشخصي');
 for(const x of [intro,wording,conclusion])if(x)used.push(x);
 const reading=readingText({qariId:imam.id,rawi:holding.rawi||undefined});
 const route=customRoute?'من طريق '+holding.tariqName:routeFor([imam.id]);
 if(customRoute&&holding.personalChain.trim().length<100)missing.push('السند الكامل لهذا الطريق إلى النبي ﷺ');
 const heading=[reading,route].filter(Boolean).join(' ');
 const words=(wording?.body||'').replaceAll('{{القراءة/الرواية}}',vocalizeReadingLabel([reading,route].filter(Boolean).join(' ')));
 const isnad=joinChain([holding.personalChain,ubaidi,common,...rawis,sahaba,prophet]);
 const chain=`【بيان القراءة:${heading}】\n${[intro?.body,[words,isnad].filter(Boolean).join(' '),conclusion?.body].filter(Boolean).join('\n\n')}`;
 return {chain:missing.length?'':chain,heading,missing,sectionIds:[...new Set(used.map(s=>s.id))]};
}
