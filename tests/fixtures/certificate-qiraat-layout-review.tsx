'use client';
import CertificatePrint from '../../legacy/components/CertificatePrint';
import '../../app/studio/studio.css';

// Synthetic (not historical/authenticated) qira'at certificate used only for
// visual/physical-position regression of the actual SVG heading renderer.
const cert={
 id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',studentName:'محمد بن أحمد',
 completionDate:'2026-11-09',hijriDayOffset:0,sanadId:'synthetic-qiraat',
 qiraahName:'برواية حفص عن الإمام عاصم من طريق الشاطبية والتيسير',notes:'',
 certificateNumber:2,registrationNumber:'2609-0102',issuerKey:'user:synthetic',qariId:'',rawi:'',
 publicationStatus:'draft',shaykhId:'synthetic',shaykhName:'الشيخ الاختباري',
 additionalShaykh:'',snapshotChain:'',snapshotHeading:'',snapshotFormatting:'',
} as const;
const heading='برواية حفص عن الإمام عاصم من طريق الشاطبية والتيسير';
const chain='【بيان القراءة:'+heading+'】\nالحمد لله رب العالمين، فقد قرأ عليَّ محمد بن أحمد القرآن الكريم كاملًا بالسند المتصل.\nفأجزته بما قرأ عليَّ وأوصيته بتقوى الله تعالى، وصلى الله وسلم على نبينا محمد.';
const preview={
 chain,heading,
 formatting:JSON.stringify({phrases:[],settings:null,palette:null,appearanceDefaults:false}),
 source:'current',issuerName:'الشيخ عبد الله بن أحمد',
 footerProfile:{footerLineStyles:'',scientificQualification:'',showScientificQualification:true,
  printedName:'',teachingRole:'',madrasaName:'',madrasaPlace:'',centerStampText:'',
  showTeachingRole:true,showMadrasaName:true,showMadrasaPlace:true},
};
export default function CertificateQiraatReview(){
 return <main className="zite-app min-w-0" dir="rtl" data-testid="certificate-qiraat-layout-review">
  <script id="certificate-review-data" type="application/json"
   dangerouslySetInnerHTML={{__html:JSON.stringify(preview)}}/>
  <CertificatePrint cert={cert as any}
   sanad={{id:'synthetic-qiraat',title:heading,qiraahName:'',chain,shaykhId:'synthetic'}}
   shaykhName="الشيخ عبد الله بن أحمد" onClose={()=>{}} onFinalized={()=>{}}/>
 </main>;
}
