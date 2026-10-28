import {displayReadingLabel} from './qurra';

/** Apply established vowelized names to the printed reading heading only.
 * Stored sanad chains and certificate snapshots are never rewritten. */
const imamNames:Record<string,string>={
 'الإمام نافع المدني':'الإِمَامِ نَافِعٍ المَدَنِيِّ',
 'الإمام ابن كثير المكي':'الإِمَامِ ابْنِ كَثِيرٍ المَكِّيِّ',
 'الإمام أبو عمرو البصري':'الإِمَامِ أَبِي عَمْرٍو البَصْرِيِّ',
 'الإمام ابن عامر الشامي':'الإِمَامِ ابْنِ عَامِرٍ الشَّامِيِّ',
 'الإمام عاصم الكوفي':'الإِمَامِ عَاصِمٍ الكُوفِيِّ',
 'الإمام حمزة الزيات':'الإِمَامِ حَمْزَةَ الزَّيَّاتِ',
 'الإمام الكسائي':'الإِمَامِ الكِسَائِيِّ',
 'الإمام أبو جعفر المدني':'الإِمَامِ أَبِي جَعْفَرٍ المَدَنِيِّ',
 'الإمام يعقوب الحضرمي':'الإِمَامِ يَعْقُوبَ الحَضْرَمِيِّ',
 'الإمام خلف العاشر':'الإِمَامِ خَلَفٍ البَزَّارِ',
 'الإمام خلف البزار':'الإِمَامِ خَلَفٍ البَزَّارِ',
};
const narrators:Record<string,string>={
 'حفص الدوري':'حَفْصٍ الدُّورِيِّ',
 'الدوري':'الدُّورِيِّ',
 'أبو الحارث':'أَبِي الحَارِثِ',
 'ابن وردان':'ابْنِ وَرْدَانَ',
 'ابن جمّاز':'ابْنِ جَمَّازٍ',
 'ابن ذكوان':'ابْنِ ذَكْوَانَ',
 'قالون':'قَالُونَ',
 'ورش':'وَرْشٍ',
 'البزّي':'البَزِّيِّ',
 'قُنبل':'قُنْبُلٍ',
 'السوسي':'السُّوسِيِّ',
 'هشام':'هِشَامٍ',
 'شعبة':'شُعْبَةَ',
 'حفص':'حَفْصٍ',
 'خلف':'خَلَفٍ',
 'خلّاد':'خَلَّادٍ',
 'رُويس':'رُوَيْسٍ',
 'رَوح':'رَوْحٍ',
 'إسحاق':'إِسْحَاقَ',
 'إدريس':'إِدْرِيسَ',
};
export function vocalizeReadingLabel(label:string):string {
 let result=displayReadingLabel(label.trim()).replace(/^رواية(?=\s)/u,'برواية').replace(/^رِوَايَةِ(?=\s)/u,'بِرِوَايَةِ');
 result=result.replace(/^برواية(?=\s)/u,'بِرِوَايَةِ').replace(/\sعن\s+(?=الإمام)/gu,' عَنِ ');
 // Replace full reader names before individual names so their parts do not collide.
 for(const [plain,voweled] of Object.entries(imamNames))result=result.replaceAll(plain,voweled);
 for(const [plain,voweled] of Object.entries(narrators)){
   const escaped=plain.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   result=result.replace(new RegExp(`(?<=رواية\\s|رِوَايَةِ\\s|بروايتي\\s|و)${escaped}(?=\\s|$|،)`,'gu'),voweled);
 }
 return result;
}
