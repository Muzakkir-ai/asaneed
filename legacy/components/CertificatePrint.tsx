import {renderRichSanadFlow} from './RichSanadFlow';
import {scopedPhraseRanges} from '../lib/sanadFormatting';
import {MatnPreview} from './MatnFormatting';
import {sakkalPrintNodes} from '../lib/sakkalPrintNodes';
import CertificateViewport from './CertificateViewport';
import {certificateBalance} from '../lib/certificateBalance';
import {certificateOverflows} from '../lib/printOverflow';
import type {Artwork} from '../lib/artworkCatalog';
import RegistrationNumber from './RegistrationNumber';
import { useEffect, useRef, useState } from 'react';
import {currentArtwork,currentArtworkBase,assetBase} from '../lib/assets';
import { exportCertificatePdf } from '../lib/exportPdf';
import { Toaster } from '@project/components/ui/sonner';
import { Button } from '@project/components/ui/button';
import { ArrowRight, Printer, Pencil, Eye, CheckCircle2 } from 'lucide-react';
import type { Cert, Data } from '../App';
import { arDate } from '../lib/date';
import {certificateDate} from '../lib/certificateDates';
import { vocalizeReadingLabel } from '../lib/vocalizedReading';
import CertificateHeading from './CertificateHeading';
import { sanadTitleRanges,scholarlyNameRanges,lightVocalizeTitle } from '../lib/sanadTitleRanges';
import CertificateQR from './CertificateQR';
import { prophetChainRanges } from '../lib/prophetChainRanges';
import { ijazahWordingRanges } from '../lib/ijazahWordingRanges';
import { shaykhPrintProfile, certificatePrintAuthorization, certificateDraftPreview, sanadPrintStyle, finalizeCertificate, type ShaykhPrintProfileOutputType } from '../lib/api';
import { toast } from 'sonner';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from '@project/components/ui/alert-dialog';
type PrintProfile=ShaykhPrintProfileOutputType['profile'];
const blankPrintProfile:PrintProfile={footerLineStyles:'',scientificQualification:'',showScientificQualification:true,printedName:'',teachingRole:'',madrasaName:'',madrasaPlace:'',centerStampText:'',showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true};
// Each date separator and numeral is an independent justified item, rather
// than pushing one large date string away from its label.
function FooterDateRow({label,date,suffix}:{label:string;date:string;suffix:string}) {
  const parts=date.split(/\s*\/\s*/u);
  return <div className="certificate-date-row" dir="rtl">
    <span className="certificate-date-label">{label}</span>
    {parts.flatMap((part,i)=>i ? [<span key={`sep-${i}`} className="certificate-date-separator">/</span>,<span key={`part-${i}`} className="certificate-date-part" dir="rtl">{part}</span>] : [<span key={`part-${i}`} className="certificate-date-part" dir="rtl">{part}</span>])}
    <span className="certificate-date-suffix">{suffix}</span>
  </div>;
}
type Props = { previewPalette?:{primaryColor:string;secondaryColor:string};readOnly?:boolean;cert: Cert; sanad?: Data['asaneed'][0]; shaykhName: string; onClose: () => void; onFinalized:(result:{chain:string;heading:string;formatting:string})=>void };
const quranicVerse = 'ﲃﲄﲅﲆ۞ﲈﲉﲊﲋ۞';
const hadiths = [
  '«خَيرُكُم مَن تَعَلَّم القُرآنَ وَعَلَّمَهُ»',
  '«إِنَّ هَذَا القُرآنَ أُنْزِلَ عَلى سَبعَةِ أَحرُفٍ؛ فَاقرَؤُوا مَا تَيَسَّرَ مِنهُ»',
];
const versePattern = /﴿\s*ﲃﲄﲅﲆ۞ﲈﲉﲊﲋ۞\s*﴾|ﲃﲄﲅﲆ۞ﲈﲉﲊﲋ۞/;
const styledPartsPattern = /(﴿\s*ﲃﲄﲅﲆ۞ﲈﲉﲊﲋ۞\s*﴾|ﲃﲄﲅﲆ۞ﲈﲉﲊﲋ۞|ﲃﲄﲅﲆ|ﲈﲉﲊﲋ|﴿|﴾|«خَيرُكُم مَن تَعَلَّم القُرآنَ وَعَلَّمَهُ»|«إِنَّ هَذَا القُرآنَ أُنْزِلَ عَلى سَبعَةِ أَحرُفٍ؛ فَاقرَؤُوا مَا تَيَسَّرَ مِنهُ»|ﷺ|صلى الله عليه وسلم|\(\s*ح\s*\)|(?<![A-Za-z])[bcjkhn](?![A-Za-z]))/g;
const renderQuranGlyphs = (verse: string) => verse.split(/(۞)/g).map((part, i) =>
  part === '۞' ? <span key={i} className="certificate-ayah-marker">{part}</span> : <span key={i} className="certificate-qcf">{part}</span>
);
/** Render the first two letters of بِرِوَايَةِ as independently shaped
 *  Sakkal Kitab presentation-form glyphs, without altering saved sanad text.
 *  Retain the attached vowels and leave وَايَةِ at its natural font spacing. */
type ColorChoice = 'primary'|'secondary'|'charcoal';
type StyledPhrase = {rich?:import('../lib/matnRichText').MatnFormat[];scope?:string;start?:number;end?:number;text:string; font:FontChoice; size:number; color:ColorChoice};
const resolvedColor=(choice:ColorChoice,primary:string,secondary:string)=>choice==='primary'?primary:choice==='secondary'?secondary:'#303030';
// Dedicated print-only markers: retain exact text and isolate only the specified names/reading.
const emphasizedStart='\uE100';
const emphasizedEnd='\uE101';
const emphasize=(s:string)=>emphasizedStart+s+emphasizedEnd;
const routeNarratorStart='\uE108';
const routeNarratorEnd='\uE109';
const personalNameStart='\uE106';
const personalNameEnd='\uE107';
const emphasizePersonalName=(s:string)=>personalNameStart+s+personalNameEnd;
const titleStart='\uE102';
const titleEnd='\uE103';
const jazariNormalStart='\uE104';
const jazariNormalEnd='\uE105';
const emphasizeTitle=(s:string)=>titleStart+s+titleEnd;
const ijazahLicensePhrase='فأجزته بعد ما رأيته أهلًا لذلك بأن يقرأ ويقرئ فى أي مكان شاء -بشروطه المعتبرة عند أرباب هذا الفن-';
const jazariFullName='إِمَامِ المُقرِئِينَ أَبِي الخَيرِ مُحَمَّدِ بنِ مُحَمَّدٍ الجَزَرِيِّ';
function highlightCertificateNames(chain:string,teacher:string,student:string,heading:string,routeEmphasis:{bookAuthor?:string;routeSource?:string;routeSources?:string[]}={}){
  // Wrap every raawi / imam identification in print-only markers, including
  // old assembled sanad text and old certificate snapshots.
  // Older issued snapshots contain an unvoweled reading inside Kalimat al-Ijazah.
  // Apply the same vocalization there as in the title beneath ijazah.svg.
  const possibleReadings=heading?[heading,heading.replace(/^برواية/u,'رواية'),heading.replace(/^رواية/u,'برواية')].filter(Boolean):[];
  const oldReading=possibleReadings.find(value=>chain.includes(value));
  const updatedChain=oldReading?chain.replace(oldReading,vocalizeReadingLabel(oldReading)):chain;
  const sources=scholarlyNameRanges(updatedChain,[...new Set([routeEmphasis.routeSource||'',...(routeEmphasis.routeSources||[])])]);
  const ranges=[...sanadTitleRanges(updatedChain),...scholarlyNameRanges(updatedChain),...scholarlyNameRanges(updatedChain,[routeEmphasis.bookAuthor||''])].filter(r=>!sources.some(t=>r.start<t.end&&t.start<r.end))
    .sort((a,b)=>a.start-b.start);
  let withTitles=updatedChain;
  // Wrap names in the same Sakkal Kitab 10pt, primary-color markers used for Ibn al-Jazari.
  // All formatting is display-only: keep every sanad character exactly as stored.
  const uniqueRanges=ranges.filter((r,i)=>!ranges.slice(0,i).some(t=>r.start<t.end&&t.start<r.end));
  for(const range of [...uniqueRanges.map(r=>({...r,source:false})),...sources.map(r=>({...r,source:true}))].sort((a,b)=>b.start-a.start)){
    withTitles=withTitles.slice(0,range.start)+(range.source?'\uE10A'+withTitles.slice(range.start,range.end)+'\uE10B':emphasizeTitle(withTitles.slice(range.start,range.end)))+withTitles.slice(range.end);
  }
  // Mark placeholders before they are replaced: other instances of the same personal
  // names in narrator chains must keep their original typography.
  let result=withTitles.replaceAll('mujeez',emphasizePersonalName(teacher)).replaceAll('mujaaz',emphasizePersonalName(student));
  // The assembled kalimat al-ijazah inserts the reading with a leading ب.
  const readings=heading?[heading.startsWith('ب')?heading:'ب'+heading,(heading.startsWith('ب')?heading:'ب'+heading).replace(/\s*[—–]\s*/gu,' ')]:[];
  const reading=readings.find(value=>result.includes(value));
  if(reading)result=result.replace(reading,emphasize(reading));
  // The al-Ajhuri route now names Ibn al-Jazari once, after وهم على.
  // Match that full name alone, and use Sakkal Kitab 10pt in the primary color.
  const last=result.lastIndexOf(jazariFullName);
  if(last>=0)result=result.slice(0,last)+emphasizeTitle(jazariFullName)+result.slice(last+jazariFullName.length);
  // Cover the different saved Kalimat al-Ijazah wordings, with or without vowels.
  // Work in reverse offsets so inserted print markers never shift later ranges.
  for(const range of [...ijazahWordingRanges(result)].reverse()){
    result=result.slice(0,range.start)+emphasizeTitle(result.slice(range.start,range.end))+result.slice(range.end);
  }
  // Mark only the narrator after the nearest عن through (ح).
  // Preserve the word عن and every saved sanad character unchanged.
  result=result.replace(/(عن\s+)([^،؛\n.\uE100-\uE10B]{2,180}?\s*\(\s*ح\s*\))/gu,
    (_all,prefix,name)=>prefix+routeNarratorStart+name+routeNarratorEnd);
  return result;
}
function renderSanadText(text: string, primaryColor: string, secondaryColor: string, phrases:StyledPhrase[] = []) {
  if(text.includes('\uE110')){
    const output:React.ReactNode[]=[];let cursor=0;const matcher=/\uE110(\d+):([\s\S]*?)\uE111/gu;let match;
    while((match=matcher.exec(text))){output.push(renderSanadText(text.slice(cursor,match.index),primaryColor,secondaryColor,phrases));const p=phrases[Number(match[1])];output.push(<span key={match.index} style={{fontFamily:p.font,fontSize:`calc(${p.size*1.1}pt * var(--certificate-text-scale, 1))`,color:resolvedColor(p.color,primaryColor,secondaryColor),fontWeight:p.font==='Sakkal Kitab'?700:undefined}}>{p.rich?<MatnPreview bare sanad={p.text} formats={p.rich} certificateFont={p.font} bodyStyle={{fontSize:`${p.size*1.1}pt`}}/>:renderSanadText(match[2].replace(/[\uE100-\uE10B]/gu,''),primaryColor,secondaryColor)}</span>);cursor=matcher.lastIndex;}
    output.push(renderSanadText(text.slice(cursor),primaryColor,secondaryColor,phrases));return output;
  }
  if(text.includes(emphasizedStart)||text.includes(titleStart)||text.includes(jazariNormalStart)||text.includes(personalNameStart)||text.includes(routeNarratorStart)||text.includes('\uE10A')){
    const fragments:React.ReactNode[]=[];
    let remaining=text;
    let i=0;
    while(remaining.length){
      const ordinary=remaining.indexOf(emphasizedStart);
      const identified=remaining.indexOf(titleStart);
      const plainName=remaining.indexOf(jazariNormalStart);
      const personalName=remaining.indexOf(personalNameStart);
      const routeNarrator=remaining.indexOf(routeNarratorStart);
      const routeSource=remaining.indexOf('\uE10A');
      const available=[ordinary,identified,plainName,personalName,routeNarrator,routeSource].filter(n=>n>=0);
      if(!available.length){fragments.push(<span key={i++}>{renderSanadText(remaining,primaryColor,secondaryColor,phrases)}</span>);break;}
      const start=Math.min(...available);
      if(start>0)fragments.push(<span key={i++}>{renderSanadText(remaining.slice(0,start),primaryColor,secondaryColor,phrases)}</span>);
      const isRouteSource=start===routeSource;
      const isTitle=start===identified;
      const isPlainName=start===plainName;
      const isPersonalName=start===personalName;
      const isRouteNarrator=start===routeNarrator;
      const opening=isRouteSource?'\uE10A':isRouteNarrator?routeNarratorStart:isPlainName?jazariNormalStart:isPersonalName?personalNameStart:isTitle?titleStart:emphasizedStart;
      const closing=isRouteSource?'\uE10B':isRouteNarrator?routeNarratorEnd:isPlainName?jazariNormalEnd:isPersonalName?personalNameEnd:isTitle?titleEnd:emphasizedEnd;
      const end=remaining.indexOf(closing,start+opening.length);
      if(end<0){fragments.push(<span key={i++}>{renderSanadText(remaining.slice(start+opening.length),primaryColor,secondaryColor,phrases)}</span>);break;}
      const inner=remaining.slice(start+opening.length,end);
      const printedInner=isTitle?lightVocalizeTitle(inner):inner;
      // Names marked by sanadTitleRanges/scholarlyNameRanges use the real
      // Sakkal Kitab Bold face. The separately highlighted ijazah wording
      // keeps its previous normal weight.
      const isImamName=isTitle;
      fragments.push(<span key={i++} className={isRouteSource?'certificate-route-source':isRouteNarrator?'certificate-route-narrator':isPlainName?'certificate-jazari-normal':isPersonalName?'certificate-personal-name':isImamName?'certificate-aimma-name':'certificate-emphasized-name'} style={isPlainName?{fontFamily:"'KSA Regular', serif",fontSize:'calc(9.9pt * var(--certificate-text-scale, 1))',fontWeight:400}: {fontFamily:isRouteSource?"var(--certificate-route-source-font, 'Sakkal Kitab'), serif":isRouteNarrator?"'KSA Regular', serif":"'Sakkal Kitab', serif",fontSize:'calc(10pt * var(--certificate-text-scale, 1))',fontWeight:700,fontSynthesis:'none',...(isRouteNarrator?{color:secondaryColor}:{}),...((isRouteSource||isTitle||isPersonalName)?{color:primaryColor}:{})}}>{renderSanadText(printedInner,primaryColor,secondaryColor)}</span>);
      remaining=remaining.slice(end+closing.length);
    }
    return fragments;
  }
  const targets=phrases.filter(p=>p.scope===undefined&&p.text.trim()).sort((a,b)=>b.text.length-a.text.length);
  if(targets.length){
    // Split only on complete user-selected phrases; preserve text and apply styling locally.
    const output:React.ReactNode[]=[];
    let cursor=0;
    while(cursor<text.length){
      let hit:{phrase:StyledPhrase;index:number}|undefined;
      for(const phrase of targets){
        const index=text.indexOf(phrase.text,cursor);
        if(index>=0&&(!hit||index<hit.index||(index===hit.index&&phrase.text.length>hit.phrase.text.length))) hit={phrase,index};
      }
      if(!hit){output.push(<span key={`rest-${cursor}`}>{renderSanadText(text.slice(cursor),primaryColor,secondaryColor)}</span>);break;}
      if(hit.index>cursor)output.push(<span key={`prefix-${cursor}`}>{renderSanadText(text.slice(cursor,hit.index),primaryColor,secondaryColor)}</span>);
      output.push(<span key={`styled-${hit.index}`} style={{fontFamily:`'${hit.phrase.font}', serif`,fontWeight:hit.phrase.font==='Sakkal Kitab'?700:undefined,fontSynthesis:hit.phrase.font==='Sakkal Kitab'?'none':undefined,fontSize:`calc(${+(hit.phrase.size*1.1).toFixed(2)}pt * var(--certificate-text-scale, 1))`,color:resolvedColor(hit.phrase.color,primaryColor,secondaryColor)}}>{renderSanadText(hit.phrase.text,primaryColor,secondaryColor,targets.filter(p=>p!==hit!.phrase&&hit!.phrase.text.includes(p.text)))}</span>);
      cursor=hit.index+hit.phrase.text.length;
    }
    return output;
  }

  return text.split(styledPartsPattern).map((part, i) => {
    if (part==='ﲃﲄﲅﲆ'||part==='ﲈﲉﲊﲋ') return <span key={i} className="certificate-qcf" style={{fontFamily:'QCF2',fontSize:'calc(9.9pt * var(--certificate-text-scale, 1))',color:primaryColor}}>{part}</span>;
    if (versePattern.test(part)) return <span key={i} className="certificate-verse-inline" style={{color:primaryColor}}><span className="certificate-verse-bracket" style={{fontFamily:'Traditional Arabic',fontSize:'calc(8.8pt * var(--certificate-text-scale, 1))',color:primaryColor}}>﴿</span>{renderQuranGlyphs(quranicVerse)}<span className="certificate-verse-bracket" style={{fontFamily:'Traditional Arabic',fontSize:'calc(8.8pt * var(--certificate-text-scale, 1))',color:primaryColor}}>﴾</span></span>;
    if(part==='﴿'||part==='﴾')return <span key={i} className="certificate-verse-bracket" style={{fontFamily:'Traditional Arabic',fontSize:'calc(8.8pt * var(--certificate-text-scale, 1))',color:primaryColor}}>{part}</span>;
    if (hadiths.includes(part)) return <span key={i} style={{color:primaryColor,fontFamily:"'Sakkal Kitab', serif",fontWeight:700,fontSynthesis:'none'}}>{part}</span>;
    if (/^\(\s*ح\s*\)$/.test(part)) return <span key={i} className="certificate-route-switch" style={{color:secondaryColor}}>{part}</span>;
    if (/^[bcjkhn]$/.test(part)) return <span key={i} className="certificate-symbol" style={{color:secondaryColor}}>{part}</span>;
    if (part === 'ﷺ' || part === 'صلى الله عليه وسلم') return <span key={i} className="certificate-salawat" style={{color:secondaryColor,fontFamily:"'Sakkal Kitab', serif"}}>ﷺ</span>;
    return <span key={i}>{part}</span>;
  });
}
function renderSanadWithConclusion(text: string, primaryColor: string, secondaryColor:string, conclusionStyle?: React.CSSProperties, phrases:StyledPhrase[] = []):React.ReactNode {
  if(phrases.some(p=>p.rich))return renderRichSanadFlow(text,primaryColor,secondaryColor,phrases,part=>renderSanadText(part,primaryColor,secondaryColor,phrases.filter(p=>p.scope===undefined)),conclusionStyle);
  for(const r of scopedPhraseRanges(text,phrases).sort((a,b)=>b.start-a.start))text=text.slice(0,r.start)+'\uE110'+r.index+':'+text.slice(r.start,r.end)+'\uE111'+text.slice(r.end);
  // Keep the final Sahaba full stop and the Prophet section on the same
  // justified paragraph line (with a Sakkal Kitab, primary-color span).
  const paragraphs=(value:string)=>value.trim().split(/\n\s*\n/u).filter(Boolean).map((part,i)=>{
    const pieces:React.ReactNode[]=[];
    let cursor=0;
    let n=0;
    for(const range of prophetChainRanges(part)){
      const before=part.slice(cursor,range.start);
      if(before)pieces.push(<span key={`${i}-body-${n}`}>{renderSanadText(before,primaryColor,secondaryColor,phrases)}</span>);
      pieces.push(<span key={`${i}-prophet-${n}`} className="certificate-prophet-chain" dir="rtl">{renderSanadText(part.slice(range.start,range.end),primaryColor,secondaryColor,phrases)}</span>);
      cursor=range.end;
      n++;
    }
    const after=part.slice(cursor);
    if(after)pieces.push(<span key={`${i}-tail`}>{renderSanadText(after,primaryColor,secondaryColor,phrases)}</span>);
    return <div className="certificate-sanad-paragraph" style={{marginBlockEnd:"var(--certificate-paragraph-gap)",textIndent:"var(--certificate-first-indent)",textAlign:'var(--certificate-alignment, justify)' as React.CSSProperties['textAlign'],textAlignLast:'var(--certificate-last-alignment, var(--certificate-alignment, right))' as React.CSSProperties['textAlignLast']}} key={i}>{pieces.length?pieces:renderSanadText(part,primaryColor,secondaryColor,phrases)}</div>;
  });
  const closingIndex = text.lastIndexOf('هذا، وأوصيه');
  if (closingIndex < 0) return <>{paragraphs(text)}</>;
  return <>
    {paragraphs(text.slice(0, closingIndex))}
    <div className="certificate-conclusion" style={{color: primaryColor, textAlign:'center', ...conclusionStyle}}>{renderSanadText(text.slice(closingIndex).trim(), primaryColor, secondaryColor, phrases)}</div>
  </>;
}
type Area = 'reading' | 'sanad' | 'conclusion' | 'shaykh';
type FontChoice = 'KSA Regular' | 'Sakkal Kitab' | 'Majalla' | 'Bahij Muna' | 'Amiri';
type Typography = { font: FontChoice; size: number; color:ColorChoice;headingGapMm?:number;lastLineAlignment?:'right'|'center';scalePercent?:number;svgHeightPt?:number;lineSpacing?:number;paragraphSpacing?:number;firstLineIndent?:number;alignment?:'right'|'center'|'justify' };
const labels: Record<Area,string> = {reading:'القراءة والرواية والطريق', sanad:'متن السند', conclusion:'الخاتمة', shaykh:'اسم المُجيز'};
const choices: {value:FontChoice;label:string}[] = [
  {value:'KSA Regular',label:'KSA Regular'},
  {value:'Sakkal Kitab',label:'Sakkal Kitab'},
  {value:'Majalla',label:'Majalla'},
  {value:'Bahij Muna',label:'Bahij Muna'},
  {value:'Amiri',label:'Amiri'},
];
const defaults:Record<Area,Typography> = {
  reading:{font:'Sakkal Kitab',size:11,color:'secondary'},
  sanad:{font:'KSA Regular',size:9.5,color:'charcoal'},
  conclusion:{font:'KSA Regular',size:9,color:'primary'},
  shaykh:{font:'KSA Regular',size:17,color:'secondary'},
};
export default function CertificatePrint({ cert, sanad, shaykhName, onClose, onFinalized,readOnly=false,previewPalette }: Props) {
  const isDraft=cert.publicationStatus==='draft';
  // New certificates default to number-only; already finalized certificates
  // without a printMode snapshot retain their historical QR presentation.
  const [draftPrintMode,setDraftPrintMode]=useState<'number'|'none'>('number');
  const savedPrintMode=(()=>{if(isDraft)return 'number';try{const mode=JSON.parse(cert.snapshotFormatting||'{}').printMode;return mode==='number'||mode==='none'?mode:'qr';}catch{return 'qr';}})();
  const printMode=isDraft?draftPrintMode:savedPrintMode;
  const [draftData,setDraftData]=useState<Awaited<ReturnType<typeof certificateDraftPreview>>|null>(null);
  const [printPermission,setPrintPermission]=useState<'checking'|'allowed'|'blocked'>('checking');
  const [printMessage,setPrintMessage]=useState('');
  const [previewAttempt,setPreviewAttempt]=useState(0);
  const [confirmFinal,setConfirmFinal]=useState(false);
  const [finalizing,setFinalizing]=useState(false);
  useEffect(()=>{
    let live=true;
    setPrintPermission('checking');setDraftData(null);setPrintMessage('');
    if(isDraft){
      certificateDraftPreview({certificateId:cert.id}).then(r=>{
        if(!live)return;
        setDraftData(r);setPrintPermission('allowed');
      }).catch(e=>{if(live){setPrintPermission('blocked');setPrintMessage(e instanceof Error?e.message:'تعذرت معاينة هذه المسودة');}});
    }else{
      certificatePrintAuthorization({certificateId:cert.id}).then(x=>{
        if(!live)return;
        setPrintPermission(x.allowed?'allowed':'blocked');setPrintMessage(x.message);
      }).catch(()=>{if(live){setPrintPermission('blocked');setPrintMessage('تعذّر فتح هذه الشهادة النهائية.');}});
    }
    return()=>{live=false;};
  },[cert.id,isDraft,previewAttempt]);
  const activeSanad=isDraft&&draftData?{...(sanad||{id:cert.sanadId,title:'',qiraahName:'',shaykhId:cert.shaykhId}),chain:draftData.chain}:sanad;
  const readingMarker = activeSanad?.chain?.match(/^【بيان القراءة:([^】]+)】\s*/);
  const readingLabel = vocalizeReadingLabel(((!isDraft&&cert.snapshotHeading)||readingMarker?.[1]?.trim() || [cert.qiraahName?.trim(), activeSanad?.title?.trim()].filter((item, index, arr): item is string => Boolean(item) && arr.indexOf(item) === index).join(' '))
    .replace(/\s*[—–-]\s*(?=مِن\s+طَرِيق|من\s+طَرِيق|من\s+طريق|مِن\s+طريق)/gu,' ')
    .replace(/\s+/g,' ').trim());
  const verificationToken=(()=>{
    if(isDraft)return '';
    try{return JSON.parse(cert.snapshotFormatting||'{}').verificationToken||'';}catch{return '';}
  })();
  // Draft preview: a visual QR placeholder with no active certificate verification.
  // The real token and verification link are issued only when finalized.
  const verificationUrl=verificationToken?`https://asaneed.vercel.app/verify/${verificationToken}`:'';
  const previewQrUrl='https://asaneed.vercel.app/verify/demo';
  const snapshotDetails=(()=>{
    if(isDraft||!cert.snapshotFormatting)return null;
    try{return JSON.parse(cert.snapshotFormatting) as {footerProfile?:PrintProfile;issuerDisplayName?:string;artworkSnapshot?:{base:string;artwork:Artwork[];issuerNumber:string}};}catch{return null;}
  })();
  const [finalFooterProfile,setFinalFooterProfile]=useState<PrintProfile>(blankPrintProfile);
  useEffect(()=>{
    // A draft receives its issuer identity and print profile together in the
    // authorized preview response. Do not load or fall back to the viewer's profile.
    if(isDraft)return;
    let active=true;
    setFinalFooterProfile(blankPrintProfile);
    if(snapshotDetails?.footerProfile){setFinalFooterProfile({...blankPrintProfile,...snapshotDetails.footerProfile});return()=>{active=false;};}
    shaykhPrintProfile({action:'get',ownerId:cert.additionalShaykh?'guest:'+cert.additionalShaykh:cert.shaykhId}).then(r=>{if(active)setFinalFooterProfile(r.profile);}).catch(()=>{if(active)toast.error('تعذر تحميل تفاصيل المُجيز');});
    return()=>{active=false;};
  },[cert.shaykhId,cert.additionalShaykh,cert.snapshotFormatting,isDraft]);
  const footerProfile=isDraft?(draftData?.footerProfile??blankPrintProfile):finalFooterProfile;
  const footerName=isDraft?(draftData?.issuerName||''):(footerProfile.printedName?.trim()||snapshotDetails?.issuerDisplayName||shaykhName);
  const snapshotArtwork=snapshotDetails?.artworkSnapshot;
  const activeArtwork=isDraft?currentArtwork():(snapshotArtwork?.artwork||[]);
  const activeArtworkBase=isDraft?currentArtworkBase():(snapshotArtwork?.base||'');
  const issuerNumber=isDraft?(cert.registrationNumber||'').slice(2,4):snapshotArtwork?.issuerNumber||'';
  const issuerArtwork=activeArtwork.filter(a=>a.kind==='mashaykh'&&a.number===issuerNumber).sort((a,b)=>['name','line-02','line-03'].indexOf(a.line)-['name','line-02','line-03'].indexOf(b.line));
  const hasNumberedArtwork=issuerArtwork.some(a=>a.line==='name');
  const zakaullahArtwork=!!cert.additionalShaykh&&cert.additionalShaykh==='64dd31bc-7105-4732-8646-148f27fe7fca'&&!!assetBase();
  const footerLineStyle=(line:'name'|'qualification'|'teaching'|'place'):React.CSSProperties=>{
    let configured:Record<string,{bold?:boolean,size?:number}>={};
    try{configured=JSON.parse(footerProfile.footerLineStyles||'{}');}catch{}
    const settings=configured[line]||{};
    const size=typeof settings.size==='number'&&Number.isFinite(settings.size)?Math.min(18,Math.max(7,settings.size)):line==='name'?11:9;
    return {'--footer-line-font-size':`${size}pt`,'--footer-line-font-weight':settings.bold?700:400} as React.CSSProperties;
  };
  const matnDocument=(()=>{try{return JSON.parse((isDraft?draftData?.formatting:cert.snapshotFormatting)||'{}').matnDocument;}catch{return null;}})();
  const modernMatnLayout=isDraft||!!(()=>{try{return JSON.parse(cert.snapshotFormatting||'{}').matnHeadingArtwork;}catch{return false;}})();
  const routeEmphasis=(()=>{try{return JSON.parse((isDraft?draftData?.formatting:cert.snapshotFormatting)||'{}').routeEmphasis||{};}catch{return {};}})();
  const sanadBody = activeSanad?.chain ? highlightCertificateNames(activeSanad.chain.replace(/^【بيان القراءة:[^】]+】\s*/, ''),footerName,cert.studentName,readingMarker?.[1]?.trim()||'',routeEmphasis) : undefined;
  const hijriDate=certificateDate(cert.completionDate,'islamic-umalqura',cert.hijriDayOffset);
  const gregorianDate=certificateDate(cert.completionDate,'gregory');
  const [borderColor,setBorderColor]=useState('#926e35');
  const [accentColor,setAccentColor]=useState('#075f69');
  const [typography,setTypography]=useState<Record<Area,Typography>>(defaults);
  const [activeArea,setActiveArea]=useState<Area>('sanad');
  const [savingFormat,setSavingFormat]=useState(false);
  const sanadElement=useRef<HTMLDivElement>(null);
  const [styledPhrases,setStyledPhrases]=useState<StyledPhrase[]>([]);
  const [sharedPhrases,setSharedPhrases]=useState<StyledPhrase[]>([]);
  const printArea=useRef<HTMLDivElement>(null);
  const headerArea=useRef<HTMLDivElement>(null);
  const footerArea=useRef<HTMLDivElement>(null);
  const [centerFits,setCenterFits]=useState(true);
  const [overflow,setOverflow]=useState(false),[layoutChecked,setLayoutChecked]=useState(false);
  const measureOverflow=()=>{
    const page=printArea.current,body=sanadElement.current,footer=footerArea.current,header=headerArea.current;
    if(!page||!footer)return false;
    const p=page.getBoundingClientRect(),f=footer.getBoundingClientRect(),b=body?.getBoundingClientRect(),h=header?.getBoundingClientRect();
    const unsafe=certificateOverflows({page:p,footer:f,body:b,header:h,scrollHeight:page.scrollHeight,clientHeight:page.clientHeight,scrollWidth:page.scrollWidth,clientWidth:page.clientWidth});
    setOverflow(unsafe);setLayoutChecked(true);return unsafe;
  };
  const [textTopMm,setTextTopMm]=useState(52.8);
  const [selectedPhrase,setSelectedPhrase]=useState('');
  const [phraseFont,setPhraseFont]=useState<FontChoice>('Sakkal Kitab');
  const [phraseSize,setPhraseSize]=useState(12);
  const [phraseColor,setPhraseColor]=useState<ColorChoice>('primary');
  useEffect(()=>{
    setTypography(defaults);setStyledPhrases([]);setSharedPhrases([]);
    setBorderColor('#926e35');setAccentColor('#075f69');
    const raw=isDraft?draftData?.formatting:cert.snapshotFormatting;
    if(!raw)return;
    try{
      const saved=JSON.parse(raw);
      if(Array.isArray(saved.phrases))setSharedPhrases(saved.phrases);
      if(saved.settings){
        setTypography(saved.settings.typography||defaults);
        setStyledPhrases(saved.settings.phrases||[]);
        setBorderColor(saved.settings.borderColor||'#926e35');
        setAccentColor(saved.settings.accentColor||'#075f69');
      }
      // While drafting, the latest global riwayah palette must remain live.
      // Final certificates use only their approved frozen colors.
      if(isDraft&&saved.palette){
        setBorderColor(saved.palette.primaryColor||'#926e35');
        setAccentColor(saved.palette.secondaryColor||'#075f69');
      }else if(saved.palette&&(!saved.settings||!saved.footerProfile)){
        // Preserve the display rules of certificates finalized before this workflow.
        setBorderColor(saved.palette.primaryColor||'#926e35');
        setAccentColor(saved.palette.secondaryColor||'#075f69');
      }
    }catch{toast.error('تعذر قراءة تنسيق الشهادة');}
  },[cert.id,isDraft,cert.snapshotFormatting,draftData?.formatting]);
  useEffect(()=>{if(isDraft&&previewPalette){setBorderColor(previewPalette.primaryColor);setAccentColor(previewPalette.secondaryColor);}},[isDraft,previewPalette?.primaryColor,previewPalette?.secondaryColor,draftData?.formatting]);
  useEffect(()=>{
    const update=()=>{
      const page=printArea.current;
      const header=headerArea.current;
      if(!page||!header)return;
      const a=page.getBoundingClientRect(), b=header.getBoundingClientRect();
      if(a.width){const gap=typography.reading.headingGapMm??2;const mm=(header.offsetTop+header.offsetHeight)/page.offsetWidth*297+gap;setTextTopMm(matnDocument&&(isDraft||typography.reading.headingGapMm!==undefined)?mm:Math.max(43,mm));}
    };
    update();
    const observer=new ResizeObserver(update);
    if(headerArea.current)observer.observe(headerArea.current);
    if(printArea.current)observer.observe(printArea.current);
    document.fonts.ready.then(update).catch(()=>{});
    return()=>observer.disconnect();
  },[printPermission,typography.reading.size,typography.reading.font,typography.reading.headingGapMm,!!matnDocument,isDraft,activeSanad?.id]);
  // Move the *entire* artwork-to-footer composition, without altering any
  // spacing inside it. For content longer than the safe A4 area, return to
  // the established layout and never squeeze or clip a long sanad.
  useEffect(()=>{
    setCenterFits(true);
    const page=printArea.current;
    if(page)page.style.setProperty('--certificate-center-shift','0px');
  },[cert.id,activeSanad?.id,sanadBody,footerName,typography,styledPhrases]);
  useEffect(()=>{
    if(!centerFits)return;
    const page=printArea.current,header=headerArea.current,footer=footerArea.current;
    if(!page||!header||!footer)return;
    let frame=0;
    const center=()=>{
      const p=page.getBoundingClientRect(),a=header.getBoundingClientRect(),b=footer.getBoundingClientRect();
      const old=parseFloat(page.style.getPropertyValue('--certificate-center-shift'))||0;
      const balanced=certificateBalance({pageTop:p.top,pageBottom:p.bottom,pageWidth:p.width,layoutWidth:page.offsetWidth,headerTop:a.top,footerBottom:b.bottom,previousShift:old});
      if(!balanced.fits){page.style.setProperty('--certificate-center-shift','0px');setCenterFits(false);return;}
      if(Math.abs(balanced.shift-old)>0.25)page.style.setProperty('--certificate-center-shift',balanced.shift.toFixed(2)+'px');
    };
    const request=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(center);};
    request();
    const observer=new ResizeObserver(request);
    observer.observe(header);observer.observe(footer);
    if(sanadElement.current)observer.observe(sanadElement.current);
    document.fonts.ready.then(request).catch(()=>{});
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[printPermission,centerFits,textTopMm,activeSanad?.id,cert.id,sanadBody,footerName,typography,styledPhrases]);
  useEffect(()=>{
    if(printPermission!=='allowed'){setLayoutChecked(false);return;}
    let frame=0;
    const check=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measureOverflow);};
    const observer=new ResizeObserver(check);
    for(const node of [printArea.current,sanadElement.current,footerArea.current,headerArea.current])if(node)observer.observe(node);
    check();document.fonts.ready.then(check).catch(()=>{});
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[printPermission,cert.id,sanadBody,typography,styledPhrases,textTopMm,centerFits,footerName]);
  const printCertificate=()=>{if(measureOverflow()){toast.error('محتوى الشهادة يتجاوز المساحة الآمنة. راجع التنسيق قبل الطباعة.');return;}window.print();};
  const captureSelection=()=>{
    const selection=window.getSelection();
    if(!selection||selection.isCollapsed||!sanadElement.current)return;
    const text=selection.toString().replace(/\uFE91\u0640?/gu,'ب').replace(/ب\u0640(?=\p{M})/gu,'ب').trim();
    if(!text||text.length>300||!sanadBody?.includes(text))return;
    const range=selection.getRangeAt(0);
    if(!sanadElement.current.contains(range.commonAncestorContainer))return;
    setSelectedPhrase(text);
    const previous=styledPhrases.find(x=>x.text===text);
    if(previous){setPhraseFont(previous.font);setPhraseSize(previous.size);setPhraseColor(previous.color);}
  };
  const applyPhrase=()=>{
    const text=selectedPhrase.trim();if(!text||!sanadBody?.includes(text))return;
    setStyledPhrases(prev=>[...prev.filter(p=>p.text!==text),{text,font:phraseFont,size:phraseSize,color:phraseColor}]);
    window.getSelection()?.removeAllRanges();
  };

  const [exporting,setExporting]=useState(false);
  // Native print/PDF preserves selectable Arabic text and vector SVG masks.
  // The older html-to-image -> PNG -> PDF path rasterized the entire A4 page.
  const savePdf=async()=>{
    if(printPermission!=='allowed'||!printArea.current)return;
    if(measureOverflow()){toast.error('محتوى الشهادة يتجاوز المساحة الآمنة. راجع التنسيق قبل الطباعة.');return;}
    setExporting(true);
    printArea.current.classList.add('certificate-export-original-paper');
    try{
      await document.fonts.ready;
      await Promise.all(Array.from(printArea.current.querySelectorAll('img')).map(img=>img.decode().catch(()=>{})));
      // iOS Safari's native print sheet often does not provide a reliable PDF
      // download. Keep a dedicated high-resolution file/share fallback there.
      if(/iPhone|iPad|iPod/i.test(navigator.userAgent)||
         (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
        await exportCertificatePdf(printArea.current,`ijazah-${cert.registrationNumber||cert.certificateNumber||cert.studentName}.pdf`);
      }else{
        // Desktop print-to-PDF retains native text and vector artwork.
        window.print();
      }
    }catch(e){console.error(e);toast.error('تعذّر فتح نافذة الطباعة');}
    finally{printArea.current?.classList.remove('certificate-export-original-paper');setExporting(false);}
  };
  const areaStyle=(area:Area):React.CSSProperties=>{const t=typography[area],scale=(t.scalePercent??100)/100;return {fontFamily:`'${t.font}', serif`,fontWeight:t.font==='Sakkal Kitab'?700:undefined,fontSynthesis:t.font==='Sakkal Kitab'?'none':undefined,fontSize:`${(area==='sanad'?9.5:+(t.size*1.1).toFixed(2))*scale}pt`,lineHeight:t.lineSpacing??(area==='sanad'?`${16*scale}pt`:undefined),color:resolvedColor(t.color,borderColor,accentColor),textAlign:(isDraft||t.lastLineAlignment)?'justify':t.alignment??(area==='conclusion'?'center':undefined),textAlignLast:t.lastLineAlignment??(isDraft?(t.alignment==='center'||area==='conclusion'?'center':'right'):undefined),textIndent:t.firstLineIndent!==undefined?`${t.firstLineIndent}mm`:undefined,'--certificate-text-scale':scale,'--certificate-paragraph-gap':t.paragraphSpacing!==undefined?`${t.paragraphSpacing}pt`:undefined,'--certificate-alignment':(isDraft||t.lastLineAlignment)?'justify':t.alignment??(area==='conclusion'?'center':undefined),'--certificate-last-alignment':t.lastLineAlignment??(isDraft?(t.alignment==='center'||area==='conclusion'?'center':'right'):undefined),'--certificate-line-height':t.lineSpacing?`${t.lineSpacing*(area==='sanad'?9.5:+(t.size*1.1).toFixed(2))*scale}pt`:undefined,'--certificate-first-indent':t.firstLineIndent!==undefined?`${t.firstLineIndent}mm`:undefined} as React.CSSProperties;};
  const printSettings=()=>{const next={...typography};for(const area of ['sanad','conclusion'] as const)next[area]={...next[area],alignment:'justify',lastLineAlignment:next[area].lastLineAlignment??(next[area].alignment==='center'||area==='conclusion'?'center':'right')};if(matnDocument)next.reading={...next.reading,svgHeightPt:next.reading.svgHeightPt??15,headingGapMm:next.reading.headingGapMm??2};return {borderColor,accentColor,typography:next,phrases:styledPhrases};};
  const saveFormat=async()=>{if(!activeSanad?.id||!isDraft||readOnly||previewPalette)return;setSavingFormat(true);try{await sanadPrintStyle({action:'save',sanadId:activeSanad.id,settings:printSettings()});toast.success('حُفظ تنسيق الشهادة');}catch(e){toast.error(e instanceof Error?e.message:'تعذر حفظ التنسيق');}finally{setSavingFormat(false);}};
  const approveFinal=async()=>{
    if(readOnly||previewPalette||!isDraft||printPermission!=='allowed')return;
    if(measureOverflow()){toast.error('لا يمكن اعتماد الشهادة قبل معالجة تجاوز مساحة الطباعة.');return;}
    setFinalizing(true);
    try{
      const result=await finalizeCertificate({certificateId:cert.id,settings:printSettings(),printMode:draftPrintMode});
      setConfirmFinal(false);
      toast.success('اعتمدت الشهادة وأُنشئت نسختها النهائية');
      onFinalized(result);
    }catch(e){toast.error(e instanceof Error?e.message:'تعذر اعتماد الشهادة');}
    finally{setFinalizing(false);}
  };
  if(printPermission!=='allowed')return <div className="min-h-screen bg-muted p-6" dir="rtl"><Toaster/><div className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-background p-6"><Button variant="outline" onClick={onClose}>رجوع</Button><h2 className="font-semibold">{isDraft?'معاينة الشهادة':'الشهادة النهائية'}</h2><p role={printPermission==='checking'?'status':'alert'} className="text-sm">{printPermission==='checking'?'جارٍ إعداد الشهادة…':printMessage}</p>{printPermission==='blocked'&&<Button variant="outline" onClick={()=>setPreviewAttempt(v=>v+1)}>إعادة المحاولة</Button>}</div></div>;
  return (
    <div className="certificate-print-screen min-h-screen bg-muted py-6"><Toaster />
      <div className="no-print container mx-auto px-4 mb-4 flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={onClose}><ArrowRight className="h-4 w-4 me-2" /> رجوع</Button>
        <div className="flex flex-wrap items-center gap-3" dir="rtl">
          {isDraft&&<span className="text-sm font-semibold">{previewPalette?'معاينة الألوان غير المحفوظة · لا يتم اعتماد الشهادة هنا':'معاينة · مسودة'}</span>}
          {isDraft&&draftData?.source==='saved'&&<span className="text-xs text-muted-foreground">سند محفوظ سابقًا</span>}
          {isDraft&&<label className="flex items-center gap-2 text-sm font-semibold">طريقة التحقق <select aria-label="طريقة عرض رقم الشهادة" className="rounded-md border border-input bg-background px-3 py-2 text-foreground" value={draftPrintMode} onChange={e=>setDraftPrintMode(e.target.value as 'number'|'none')}><option value="number">رقم الشهادة</option><option value="none">بدون رقم الشهادة</option></select></label>}
          <label className="flex items-center gap-2 text-sm font-semibold">اللون الأساسي <input type="color" disabled={!isDraft||!!previewPalette} value={borderColor} onChange={e=>setBorderColor(e.target.value)} className="h-9 w-12 rounded border disabled:cursor-default" /></label>
          <label className="flex items-center gap-2 text-sm font-semibold">اللون الثانوي <input type="color" disabled={!isDraft||!!previewPalette} value={accentColor} onChange={e=>setAccentColor(e.target.value)} className="h-9 w-12 rounded border disabled:cursor-default" /></label>
          {isDraft&&<Button variant="default" disabled={exporting||overflow||!layoutChecked} onClick={savePdf}>{exporting?'جارٍ التحضير…':'معاينة PDF بدون اعتماد'}</Button>}
          {isDraft?<Button disabled={readOnly||!!previewPalette||finalizing||overflow||!layoutChecked} onClick={()=>setConfirmFinal(true)}><CheckCircle2 className="h-4 w-4 me-2"/> {readOnly||previewPalette?'معاينة للقراءة فقط':'اعتماد نهائي'}</Button>:<>
            <Button disabled={overflow||!layoutChecked} onClick={printCertificate}><Printer className="h-4 w-4 me-2"/> طباعة</Button>
            <Button variant="secondary" disabled={exporting||overflow||!layoutChecked} onClick={savePdf}>{exporting?'جارٍ التحضير…':'حفظ PDF بجودة الطباعة'}</Button>
          </>}
        </div>
      </div>
      {isDraft&&<details className="no-print container mx-auto px-4 mb-4" dir="rtl"><summary className="cursor-pointer font-semibold">تنسيق</summary><fieldset disabled={readOnly||!!previewPalette||savingFormat} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border bg-background p-3"><label>الجزء <select aria-label="جزء الشهادة" className="rounded border bg-background p-2" value={activeArea} onChange={e=>setActiveArea(e.target.value as Area)}>{Object.entries(labels).filter(([key])=>key!=='shaykh').map(([key,label])=><option key={key} value={key}>{key==='reading'&&matnDocument?'عنوان المتن SVG':key==='conclusion'?(matnDocument?'الخاتمة المضافة للمتن':'الخاتمة — هذا، وأوصيه'):label}</option>)}</select></label>{activeArea==='reading'&&matnDocument&&<label className="text-sm">ارتفاع العنوان SVG (pt)<input aria-label="ارتفاع العنوان SVG (pt)" className="ms-2 w-20 rounded border bg-background p-2" type="number" min={5} max={100} step={0.5} value={typography.reading.svgHeightPt??15} onChange={e=>{if(!e.target.value||!Number.isFinite(e.target.valueAsNumber))return;const height=Math.max(5,Math.min(100,e.target.valueAsNumber));setTypography(prev=>({...prev,reading:{...prev.reading,svgHeightPt:height}}));}}/><span className="ms-2 text-xs text-muted-foreground">يتغيّر السطر السفلي معه تلقائيًا</span></label>}{activeArea==='reading'&&matnDocument&&<label className="text-sm">المسافة بعد السطر الثاني (مم)<input aria-label="المسافة بعد السطر الثاني (مم)" className="ms-2 w-20 rounded border bg-background p-2" type="number" min={0} max={20} step={0.5} value={typography.reading.headingGapMm??2} onChange={e=>{if(!e.target.value||!Number.isFinite(e.target.valueAsNumber))return;const gap=Math.max(0,Math.min(20,e.target.valueAsNumber));setTypography(prev=>({...prev,reading:{...prev.reading,headingGapMm:gap}}));}}/></label>}{([{key:'scalePercent',label:'الحجم ٪',min:50,max:150,step:1,value:100},{key:'lineSpacing',label:'تباعد الأسطر',min:1,max:3,step:0.1,value:activeArea==='sanad'?1.68:1.6},{key:'paragraphSpacing',label:'تباعد الفقرات (نقطة)',min:0,max:30,step:1,value:matnDocument?6:3},{key:'firstLineIndent',label:'إزاحة أول سطر من اليمين (مم)',min:0,max:25,step:1,value:0}] as const).filter(c=>activeArea!=='reading'||(!matnDocument&&c.key==='scalePercent')).map(c=><label key={c.key} className="text-sm">{c.label}<input aria-label={c.label} className="ms-2 w-20 rounded border bg-background p-2" type="number" min={c.min} max={c.max} step={c.step} value={typography[activeArea][c.key]??c.value} onChange={e=>{if(!e.target.value||!Number.isFinite(e.target.valueAsNumber))return;const value=Math.max(c.min,Math.min(c.max,e.target.valueAsNumber));setTypography(prev=>({...prev,[activeArea]:{...prev[activeArea],[c.key]:value}}));}}/></label>)}{activeArea!=='reading'&&<label>ضبط الفقرة — آخر سطر <select aria-label="محاذاة آخر سطر" className="rounded border bg-background p-2" value={typography[activeArea].lastLineAlignment??(typography[activeArea].alignment==='center'||activeArea==='conclusion'?'center':'right')} onChange={e=>setTypography(prev=>({...prev,[activeArea]:{...prev[activeArea],alignment:'justify',lastLineAlignment:e.target.value==='center'?'center':'right'}}))}><option value="right">يمين</option><option value="center">وسط</option></select></label>}<Button disabled={savingFormat} onClick={()=>void saveFormat()}>{savingFormat?'جارٍ الحفظ…':'حفظ التنسيق'}</Button></fieldset></details>}
      {overflow&&<div role="alert" className="no-print container mx-auto px-4 mb-4"><div className="rounded-lg border border-destructive bg-background p-4 text-destructive" dir="rtl"><strong>تنبيه: محتوى الشهادة يتجاوز المساحة الآمنة للطباعة.</strong><p>السند طويل أو يتداخل مع العنوان أو التذييل. راجع حجم الخط والمسافات قبل الاعتماد أو الطباعة؛ لن يُصغّر النص تلقائيًا.</p></div></div>}
      <CertificateViewport>
        <div ref={printArea} className={`print-area mx-auto bg-white shadow-xl relative ${centerFits?'certificate-auto-center-fit':''}`} style={{ width: '297mm', height: '210mm', boxSizing: 'border-box', padding: `var(--sanad-text-top, 52.8mm) 16mm 24mm`, '--sanad-text-top':`${textTopMm}mm`, '--certificate-route-source-font':isDraft||routeEmphasis.routeSourceFont==='Sakkal Kitab'?"'Sakkal Kitab'":"'KSA Regular'", '--certificate-primary':borderColor, '--certificate-secondary':accentColor, color:'#202020' } as React.CSSProperties}>
          <div aria-hidden="true" className="certificate-ornament" style={{backgroundColor:borderColor}} />
          <CertificateHeading artwork={activeArtwork} artworkBase={activeArtworkBase||undefined} ref={headerArea} heading={readingLabel} primary={borderColor} secondary={accentColor} matnHeightPt={typography.reading.svgHeightPt??(isDraft&&matnDocument?15:undefined)} scalePercent={typography.reading.scalePercent} useMatnArtwork={modernMatnLayout} readingStyle={areaStyle('reading')} preserveHistoricalRoute={!isDraft&&!snapshotArtwork}/>
          {sakkalPrintNodes(<div className="certificate-content relative z-10 h-full flex flex-col items-center text-center certificate-text" dir="rtl">

            {sanadBody?.trim() ? (
              <div ref={sanadElement} onMouseUp={captureSelection} onKeyUp={captureSelection} className="certificate-composed-sanad w-full whitespace-pre-line" style={areaStyle('sanad')}>{matnDocument?<div style={{'--matn-primary':borderColor,'--matn-secondary':accentColor} as React.CSSProperties}><MatnPreview {...matnDocument} legacyAlignment={!isDraft&&!matnDocument.editorVersion} bare studentName={cert.studentName} teacherName={footerName} certificateFont={typography.sanad.font} phraseOverrides={styledPhrases} justifyParagraphs={isDraft||!!typography.sanad.lastLineAlignment} centerConclusion={modernMatnLayout} legacySpacing={!modernMatnLayout} bodyStyle={modernMatnLayout?{lineHeight:typography.sanad.lineSpacing,marginBlockEnd:typography.sanad.paragraphSpacing!==undefined?`${typography.sanad.paragraphSpacing}pt`:'6pt',textIndent:typography.sanad.firstLineIndent!==undefined?`${typography.sanad.firstLineIndent}mm`:undefined,textAlign:'justify',textAlignLast:typography.sanad.lastLineAlignment??(typography.sanad.alignment==='center'?'center':'right')}:undefined} conclusionStyle={modernMatnLayout?areaStyle('conclusion'):undefined}/></div>:renderSanadWithConclusion(sanadBody.trim(), borderColor,accentColor,areaStyle('conclusion'), [...sharedPhrases.filter(p=>!styledPhrases.some(x=>x.text===p.text)), ...styledPhrases])}</div>
            ) : (
              <>
                <p className="mt-6">الحمد لله الذي أنزل القرآن، والصلاة والسلام على من أُرسل بالهدى والفرقان، أما بعد:</p>
                <p className="mt-4">فقد قرأ عليَّ الأخ الكريم <span className="certificate-name mx-2 font-bold" style={{color:accentColor}}>{cert.studentName}</span> القرآن الكريم كاملاً {cert.qiraahName && <>ب<span className="font-bold" style={{color:accentColor}}>{cert.qiraahName}</span></>}، وقد أتمّ ختمته بتاريخ <span className="font-bold">{arDate(cert.completionDate)}</span>، فأجزته بما قرأ عليَّ بالسند المتصل إلى رسول الله <span className="certificate-salawat" style={{color:accentColor}}>ﷺ</span>.</p>
              </>
            )}
            {cert.notes && <p className="mt-2">{cert.notes}</p>}
            <div ref={footerArea} className="certificate-footer mt-auto" dir="rtl">
              <table className="certificate-footer-table" role="presentation"><colgroup><col style={{width:'33.333333%'}}/><col style={{width:'33.333334%'}}/><col style={{width:'33.333333%'}}/></colgroup>
                <tbody>
                  <tr className="certificate-footer-head">
                    <td className="certificate-footer-heading certificate-footer-right certificate-footer-verification-title"></td>
                    <td className="certificate-footer-heading certificate-footer-center">المجيز</td>
                    <td className="certificate-footer-heading certificate-footer-left">توقيع المجيز</td>
                  </tr>
                  <tr className="certificate-footer-details">
                    <td className={`certificate-footer-right certificate-footer-qr-cell ${printMode==='number'?'certificate-footer-number-only':''}`}>
                      <div className="certificate-footer-verification">
                        {printMode==='qr'&&<CertificateQR url={verificationUrl||previewQrUrl} primary={borderColor} secondary={accentColor}/>} 
                        {printMode!=='none'&&<span className="certificate-registration-number" dir="rtl">المسجل برقم: (<RegistrationNumber value={cert.registrationNumber||'—'}/>)</span>}
                        {printMode==='qr'&&!verificationUrl&&<span className="certificate-qr-preview-label">نموذج فقط — غير مُعتمد</span>}
                      </div>
                    </td>
                    <td className="certificate-footer-center certificate-footer-mujeez">
                      {hasNumberedArtwork?<div className="certificate-numbered-artwork" role="img" aria-label={footerName}>{issuerArtwork.map(a=><span key={a.path} aria-hidden="true" style={{display:'block',width:(a.width/issuerArtwork[0].height*10.5)+'mm',height:(a.height/issuerArtwork[0].height*10.5)+'mm',maxWidth:'100%',backgroundColor:a.line==='line-03'?accentColor:borderColor,WebkitMaskImage:'url("'+activeArtworkBase+'/'+a.path+'")',maskImage:'url("'+activeArtworkBase+'/'+a.path+'")',WebkitMaskSize:'contain',maskSize:'contain',WebkitMaskRepeat:'no-repeat',maskRepeat:'no-repeat',WebkitMaskPosition:'center',maskPosition:'center'}}/>) }
                        {!issuerArtwork.some(a=>a.line==='line-02')&&footerProfile.showScientificQualification&&footerProfile.scientificQualification?.trim()&&<div className="certificate-footer-qualification" style={footerLineStyle('qualification')}>{footerProfile.scientificQualification.trim()}</div>}
                        {!issuerArtwork.some(a=>a.line==='line-03')&&<>{(footerProfile.showTeachingRole&&footerProfile.teachingRole?.trim()||footerProfile.showMadrasaName&&footerProfile.madrasaName?.trim())&&<div className="certificate-footer-madrasa-line" style={footerLineStyle('teaching')}>{[footerProfile.showTeachingRole?footerProfile.teachingRole.trim():'',footerProfile.showMadrasaName?footerProfile.madrasaName.trim():''].filter(Boolean).join(' ')}</div>}{footerProfile.showMadrasaPlace&&footerProfile.madrasaPlace?.trim()&&<div className="certificate-footer-place" style={footerLineStyle('place')}>{footerProfile.madrasaPlace.trim()}</div>}</>}
                      </div>:zakaullahArtwork?<div className="certificate-zakaullah-artwork" role="img" aria-label={footerName}>
                        {['zakaullah.svg','zakaullah-02.svg','zakaullah-03.svg'].map((file,i)=><span key={file} aria-hidden="true" className={`certificate-zakaullah-line certificate-zakaullah-line-${i+1}`} style={{WebkitMaskImage:`url("${assetBase()}/svg/${file}")`,maskImage:`url("${assetBase()}/svg/${file}")`}}/>)}
                      </div>:<>
                      <div className="certificate-footer-name" style={footerLineStyle('name')}>{footerName}</div>
                      {footerProfile.showScientificQualification && footerProfile.scientificQualification?.trim() && <div className="certificate-footer-qualification" style={footerLineStyle('qualification')}>{footerProfile.scientificQualification.trim()}</div>}
                      {(footerProfile.showTeachingRole && footerProfile.teachingRole?.trim() || footerProfile.showMadrasaName && footerProfile.madrasaName?.trim()) && <div className="certificate-footer-madrasa-line" style={footerLineStyle('teaching')}>{[footerProfile.showTeachingRole ? footerProfile.teachingRole.trim() : '',footerProfile.showMadrasaName ? footerProfile.madrasaName.trim() : ''].filter(Boolean).join(' ')}</div>}
                      {footerProfile.showMadrasaPlace && footerProfile.madrasaPlace?.trim() && <div className="certificate-footer-place" style={footerLineStyle('place')}>{footerProfile.madrasaPlace.trim()}</div>}
                      </>}
                    </td>
                    <td className="certificate-footer-left certificate-footer-signature"><div className="certificate-footer-dates"><FooterDateRow label="التــاريــخ:" date={hijriDate} suffix="هـ"/><FooterDateRow label="الــمـوافــق:" date={gregorianDate} suffix="م"/></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>,false,isDraft||routeEmphasis.routeSourceFont==='Sakkal Kitab'?'Sakkal Kitab':'KSA Regular')}
        </div>
      </CertificateViewport>
      <AlertDialog open={confirmFinal} onOpenChange={v=>{if(!finalizing)setConfirmFinal(v);}}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right"><AlertDialogTitle>اعتماد الشهادة نهائيًا؟</AlertDialogTitle><AlertDialogDescription>سيُحفظ النص والألوان والتنسيق وبيانات المُجيز كما تظهر الآن، ولن تتغير مع التعديلات اللاحقة.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={finalizing}>إلغاء</AlertDialogCancel><AlertDialogAction disabled={finalizing} onClick={e=>{e.preventDefault();void approveFinal();}}>{finalizing?'جارٍ الاعتماد…':'اعتماد نهائي'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

