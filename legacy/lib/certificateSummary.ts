/** List-only text. Never use this shortened copy in a certificate or snapshot. */
const plain=(text:string)=>text.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/gu,'').replace(/\s+/gu,' ').trim();
const imams:Record<string,string>={nafi:'نافع',ibnkathir:'ابن كثير',abiamr:'أبي عمرو',ibnamir:'ابن عامر',asim:'عاصم',hamza:'حمزة',kisai:'الكسائي',abujafar:'أبي جعفر',yaqub:'يعقوب',khalaf:'خلف العاشر'};
export function certificateSummary(heading:string,qariId='',rawi=''){
 const text=plain(heading).replace(/^【بيان القراءة:/u,'').replace(/】$/u,'');
 const route=text.match(/\s+من\s+طريق(?:ي|ين)?\s+(.+)$/u);
 const body=route?text.slice(0,route.index):text;
 const single=body.match(/^(?:ب?رواية)\s+(.+?)\s+عن\s+(.+)$/u);
 const imam=imams[qariId]||(single?.[2]||'').replace(/^(?:الإمام|الامام)\s+/u,'').replace(/\s+(?:المدني|المكي|البصري|الشامي|الكوفي|الزيات)$/u,'');
 const narrator=rawi?plain(rawi):single?.[1];
 const summary=single&&narrator&&imam?`${narrator} عن ${imam}`:body.replace(/^ب(?=قراءة)/u,'').replace(/^(?:الإمام|الامام)\s+/u,'');
 const routeLabel=route?.[1]?.replace(/\s*[—–-]\s*(?=طريق\s)/gu,' من ');
 return [summary,routeLabel].filter(Boolean).join(' · ');
}
