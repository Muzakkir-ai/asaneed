'use client';
import CertificatePrint from '../../legacy/components/CertificatePrint';
import '../../app/studio/studio.css';

const cert={
 id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',studentName:'أحمد بن عبد الله',
 completionDate:'2026-11-09',hijriDayOffset:0,sanadId:'synthetic-matn',
 qiraahName:'إجازة في المقدمة الجزرية',notes:'',certificateNumber:1,
 registrationNumber:'2609-0101',issuerKey:'user:synthetic',qariId:'',rawi:'',
 publicationStatus:'draft',shaykhId:'synthetic',shaykhName:'الشيخ الاختباري',
 additionalShaykh:'',snapshotChain:'',snapshotHeading:'',snapshotFormatting:'',
} as const;
const document={
 editorVersion:2,bookName:'المقدمة الجزرية',
 intro:'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين.',
 wording:'قرأ عليَّ mujaaz المقدمة الجزرية، فأجزته بروايتها عني بالسند المتصل.',
 sanad:'عن الشيخ محمد بن أحمد، عن الشيخ عبد الرحمن بن محمد، عن الشيخ إبراهيم العبيدي، عن الإمام ابن الجزري.',
 end:'هذا، وأوصيه بتقوى الله عز وجل، والعمل بما تعلم، وحسن تعليم القرآن الكريم.',
 formats:[],introFormats:[],endFormats:[],
 heading:{version:1,mainHeightPt:42,secondaryHeightPt:24,lineGapMm:2,afterGapMm:4,
 sectionBreaks:{afterIntro:true,afterWording:true,afterSanad:true}},
};
const preview={
 chain:'【بيان القراءة:إجازة في المقدمة الجزرية】\nالحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد.',
 heading:'إجازة في المقدمة الجزرية',
 formatting:JSON.stringify({matnDocument:document,phrases:[],settings:null,palette:null,appearanceDefaults:false}),
 source:'current',issuerName:'الشيخ عبد الله بن أحمد',
 footerProfile:{footerLineStyles:'',scientificQualification:'',showScientificQualification:true,
  printedName:'',teachingRole:'',madrasaName:'',madrasaPlace:'',centerStampText:'',
  showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true},
};
export default function CertificateLayoutReview(){
 return <div className="zite-app min-w-0" dir="rtl" data-testid="certificate-layout-review">
  <script id="certificate-review-data" type="application/json"
   dangerouslySetInnerHTML={{__html:JSON.stringify(preview)}}/>
  <CertificatePrint cert={cert as any}
   sanad={{id:'synthetic-matn',title:'المقدمة الجزرية',qiraahName:'',chain:preview.chain,shaykhId:'synthetic'}}
   shaykhName="الشيخ عبد الله بن أحمد" onClose={()=>{}} onFinalized={()=>{}}/>
 </div>;
}
