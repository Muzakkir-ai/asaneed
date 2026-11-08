import {builderNameKey} from './bookBuilder';

/** Canonical identities of the twenty riwayah slots (nineteen people:
 * al-Duri is the same person for Abu Amr and al-Kisa'i).
 * Text is in the genitive so it can be placed after عن in sanad writing.
 * Labels are NOT evidence of a narrator-to-imam connection.
 */
export type RawiIdentity={key:string;qariId:string;rawi:string;fullName:string;shortName:string};
export const RAWI_IDENTITIES:RawiIdentity[]=[
 {key:'qalun',qariId:'nafi',rawi:'قالون',shortName:'قالون',fullName:'أبي موسى عيسى بن مينا بن وردان المدني المعروف بقالون'},
 {key:'warsh',qariId:'nafi',rawi:'ورش',shortName:'ورش',fullName:'أبي سعيد عثمان بن سعيد المصري المعروف بورش'},
 {key:'bazzi',qariId:'ibnkathir',rawi:'البزّي',shortName:'البزي',fullName:'أبي الحسن أحمد بن محمد بن عبد الله بن القاسم بن نافع بن أبي بزة المكي المعروف بالبزي'},
 {key:'qunbul',qariId:'ibnkathir',rawi:'قُنبل',shortName:'قنبل',fullName:'أبي عمر محمد بن عبد الرحمن بن محمد بن خالد بن سعيد بن جرجة المخزومي المكي المعروف بقنبل'},
 {key:'duri',qariId:'abiamr',rawi:'حفص الدوري',shortName:'الدوري',fullName:'أبي عمر حفص بن عمر بن عبد العزيز الدوري البغدادي'},
 {key:'susi',qariId:'abiamr',rawi:'السوسي',shortName:'السوسي',fullName:'أبي شعيب صالح بن زياد السوسي'},
 {key:'hisham',qariId:'ibnamir',rawi:'هشام',shortName:'هشام',fullName:'أبي الوليد هشام بن عمار السلمي الدمشقي'},
 {key:'ibn-dhakwan',qariId:'ibnamir',rawi:'ابن ذكوان',shortName:'ابن ذكوان',fullName:'أبي عمرو عبد الله بن أحمد بن بشير بن ذكوان القرشي الدمشقي'},
 {key:'shubah',qariId:'asim',rawi:'شعبة',shortName:'شعبة',fullName:'أبي بكر شعبة بن عياش الأسدي الكوفي'},
 {key:'hafs',qariId:'asim',rawi:'حفص',shortName:'حفص',fullName:'أبي عمر حفص بن سليمان بن المغيرة الأسدي الكوفي'},
 {key:'khalaf',qariId:'hamza',rawi:'خلف',shortName:'خلف',fullName:'أبي محمد خلف بن هشام البزار البغدادي'},
 {key:'khallad',qariId:'hamza',rawi:'خلّاد',shortName:'خلاد',fullName:'أبي عيسى خلاد بن خالد الشيباني الصيرفي'},
 {key:'abu-harith',qariId:'kisai',rawi:'أبو الحارث',shortName:'أبو الحارث',fullName:'أبي الحارث الليث بن خالد البغدادي'},
 {key:'duri',qariId:'kisai',rawi:'حفص الدوري',shortName:'حفص الدوري',fullName:'أبي عمر حفص بن عمر بن عبد العزيز الدوري البغدادي'},
 {key:'ibn-wardan',qariId:'abujafar',rawi:'ابن وردان',shortName:'ابن وردان',fullName:'أبي الحارث عيسى بن وردان المدني'},
 {key:'ibn-jammaz',qariId:'abujafar',rawi:'ابن جمّاز',shortName:'ابن جماز',fullName:'أبي الربيع سليمان بن مسلم بن جماز المدني'},
 {key:'ruways',qariId:'yaqub',rawi:'رُويس',shortName:'رويس',fullName:'أبي عبد الله محمد بن المتوكل اللؤلؤي البصري المعروف برويس'},
 {key:'rawh',qariId:'yaqub',rawi:'رَوح',shortName:'روح',fullName:'أبي الحسن روح بن عبد المؤمن الهذلي البصري'},
 {key:'ishaq',qariId:'khalaf',rawi:'إسحاق',shortName:'إسحاق',fullName:'أبي يعقوب إسحاق بن إبراهيم الوراق'},
 {key:'idris',qariId:'khalaf',rawi:'إدريس',shortName:'إدريس',fullName:'أبي الحسن إدريس بن عبد الكريم الحداد'},
];

export function rawiIdentity(qariId:string,rawi:string):RawiIdentity|undefined{
 const name=builderNameKey(rawi);
 return RAWI_IDENTITIES.find(person=>person.qariId===qariId&&builderNameKey(person.rawi)===name);
}
export function fullRawiName(qariId:string,rawi:string):string{
 return rawiIdentity(qariId,rawi)?.fullName||rawi;
}
