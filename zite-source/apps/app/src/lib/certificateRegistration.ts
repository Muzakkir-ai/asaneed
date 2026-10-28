import {zite} from 'zitejs/db';
import {readingIdentityFromHeading} from './riwayahSvgHeading';

// Stable codes: distinguish the same narrator under different imams.
export const RIWAYAH_CODES:Record<string,string>={
 'nafi|قالون':'01','nafi|ورش':'02',
 'ibnkathir|البزّي':'03','ibnkathir|قُنبل':'04',
 'abiamr|حفص الدوري':'05','abiamr|السوسي':'06',
 'ibnamir|هشام':'07','ibnamir|ابن ذكوان':'08',
 'asim|شعبة':'09','asim|حفص':'10',
 'hamza|خلف':'11','hamza|خلّاد':'12',
 'kisai|أبو الحارث':'13','kisai|حفص الدوري':'14',
 'abujafar|ابن وردان':'15','abujafar|ابن جمّاز':'16',
 'yaqub|رُويس':'17','yaqub|رَوح':'18',
 'khalaf|إسحاق':'19','khalaf|إدريس':'20',
};
export function registrationParts(completionDate:string,heading:string){
 const match=completionDate.match(/^(\d{4})-\d{2}-\d{2}$/);
 if(!match)throw new Error('أدخل تاريخ إتمام صحيحًا لترقيم الشهادة');
 const reading=readingIdentityFromHeading(heading);
 const riwayahCode=reading&&RIWAYAH_CODES[reading.qariId+'|'+reading.rawi];
 if(!riwayahCode)throw new Error('تعذر تحديد رمز الرواية لترقيم الشهادة');
 return {year:match[1],riwayahCode};
}
export const twoDigit=(value:number)=>{
 if(!Number.isInteger(value)||value<1||value>99)throw new Error('بلغ الترقيم حد الخانتين (٩٩)؛ يلزم توسيع صيغة الرقم');
 return String(value).padStart(2,'0');
};
const first=(value?:string|string[])=>Array.isArray(value)?value[0]:value;
export async function ensureCertificateRegistration(certificateId:string){
 const cert=await zite.certificates.findOne({id:certificateId});
 if(!cert)throw new Error('الشهادة غير موجودة');
 // A finalized number is immutable, even after source profiles change.
 if(cert.publicationStatus==='final'&&cert.registrationNumber)return cert.registrationNumber;
 const issuerKey=cert.additionalShaykh?'guest:'+cert.additionalShaykh:'user:'+first(cert.shaykh);
 if(issuerKey==='user:undefined')throw new Error('تعذر تحديد المُجيز');
 const sanad=await zite.asaneed.findOne({id:first(cert.sanad)||''});
 const heading=(sanad?.chain||'').match(/^【بيان القراءة:([^】]+)】/)?.[1]||'';
 const {year,riwayahCode}=registrationParts(cert.completionDate||'',heading);
 let {records:issuers}=await zite.certificateIssuers.findAll({filters:{issuerKey},limit:100});
 if(!issuers.length){
  let displayName='';
  if(cert.additionalShaykh)displayName=(await zite.additionalShaykhs.findOne({id:cert.additionalShaykh}))?.name||'';
  else displayName=cert.originalShaykhName||'';
  await zite.certificateIssuers.bulkCreate({records:[{issuerKey,displayName}],matchOn:['issuerKey']});
  issuers=(await zite.certificateIssuers.findAll({filters:{issuerKey},limit:100})).records;
 }
 const issuerNumber=Math.min(...issuers.map(x=>x.issuerNumber||Infinity));
 const canonical=issuers.find(x=>x.issuerNumber===issuerNumber)||issuers[0];
 const userCode=canonical?.issuerCode||twoDigit(issuerNumber);
 if(canonical&&!canonical.issuerCode)await zite.certificateIssuers.update({id:canonical.id,record:{issuerCode:userCode}});
 const reservationKey=[certificateId,issuerKey,year,riwayahCode].join('|');
 let {records:reservations,hasMore}=await zite.certificateRegistrations.findAll({filters:{issuerKey,year,riwayahCode},limit:2000});
 if(hasMore)throw new Error('يلزم مراجعة سجل الترقيم');
 let own=reservations.filter(r=>r.reservationKey===reservationKey).sort((a,b)=>(a.sequenceOrder||a.reservationOrder||0)-(b.sequenceOrder||b.reservationOrder||0))[0];
 if(!own){
  if(new Set(reservations.map(r=>r.reservationKey)).size>=99)twoDigit(100);
  await zite.certificateRegistrations.bulkCreate({records:[{reservationKey,certificateId,issuerKey,year,riwayahCode}],matchOn:['reservationKey']});
  const result=await zite.certificateRegistrations.findAll({filters:{issuerKey,year,riwayahCode},limit:2000});
  if(result.hasMore)throw new Error('يلزم مراجعة سجل الترقيم');
  reservations=result.records;
  own=reservations.filter(r=>r.reservationKey===reservationKey).sort((a,b)=>(a.sequenceOrder||a.reservationOrder||0)-(b.sequenceOrder||b.reservationOrder||0))[0];
 }
 if(!own)throw new Error('تعذر حجز رقم الشهادة');
 const order=own.sequenceOrder||own.reservationOrder;
 if(!order)throw new Error('تعذر حجز ترتيب الشهادة');
 if(!own.sequenceOrder)await zite.certificateRegistrations.update({id:own.id,record:{sequenceOrder:order}});
 const sequence=new Set(reservations.filter(r=>(r.sequenceOrder||r.reservationOrder||Infinity)<=order).map(r=>r.reservationKey)).size;
 const registrationNumber=own.registrationNumber||userCode+year.slice(-2)+'-'+riwayahCode+twoDigit(sequence);
 // Reservations survive certificate deletion, so printed numbers are never reused.
 if(!own.registrationNumber)await zite.certificateRegistrations.update({id:own.id,record:{registrationNumber}});
 if(cert.registrationNumber!==registrationNumber)await zite.certificates.update({id:cert.id,record:{registrationNumber}});
 return registrationNumber;
}
