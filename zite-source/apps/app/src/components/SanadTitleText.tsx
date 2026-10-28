import {sanadTitleRanges,scholarlyNameRanges,jazariAfterWahumRanges} from '../lib/sanadTitleRanges';
/** Text-only sanad display (saved asaneed and composer previews). */
export default function SanadTitleText({text}:{text:string}){
 const ranges=[...sanadTitleRanges(text).map(x=>({...x,primary:true})),...scholarlyNameRanges(text).map(x=>({...x,primary:true})),...jazariAfterWahumRanges(text).map(x=>({...x,primary:true}))].sort((a,b)=>a.start-b.start);
 const salawat=(part:string)=>part.split(/(ﷺ|صلى الله عليه وسلم)/gu).map((value,i)=>
  value==='ﷺ'||value==='صلى الله عليه وسلم'?<span key={i} className="certificate-salawat">{'ﷺ'}</span>:value);
 const pieces:React.ReactNode[]=[];
 let cursor=0;
 for(const range of ranges){
   if(range.start>cursor)pieces.push(salawat(text.slice(cursor,range.start)));
   pieces.push(<span key={range.start} style={{fontFamily:"'Sakkal Kitab', serif",fontSize:'10pt',fontWeight:700,fontSynthesis:'none',...(range.primary?{color:"var(--certificate-primary,#926e35)"}:{})}}>{salawat(text.slice(range.start,range.end))}</span>);
   cursor=range.end;
 }
 if(cursor<text.length)pieces.push(salawat(text.slice(cursor)));
 return <>{pieces}</>;
}
