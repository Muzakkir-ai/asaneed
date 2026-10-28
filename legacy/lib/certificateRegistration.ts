import {context} from '../compat/context';
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
export async function ensureCertificateRegistration(certificateId:string){const {data,error}=await context().client.rpc('reserve_certificate_number',{certificate_id:certificateId});if(error)throw new Error(error.message);context().cache?.clear();return String(data);}
