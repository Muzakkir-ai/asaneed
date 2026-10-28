import {QURRA} from './qurra';

export type SourceSection={id:string;title:string;body:string};
export type NarratorOccurrence={qariId:string;rawi:string};
export type NarratorProfile={id:string;name:string;teachers:string[];students:string[];readings:NarratorOccurrence[];sources:string[]};
export type NarratorDirectory={people:NarratorProfile[];links:number;sections:number};

/** Strip graphic/tashkil differences, while retaining the full original spelling for display. */
const norm=(text:string)=>text.normalize('NFKC')
  .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/gu,'')
  .replace(/[آأإٱ]/gu,'ا').replace(/[ى]/gu,'ي')
  .replace(/[\u200c-\u200f\u00a0]/gu,' ').replace(/[-ـ،.؛:()]/gu,' ')
  .replace(/\s+/gu,' ').trim();

const canonical=(name:string)=>{
 const n=norm(name);
 // Repeated imams, narrators and Companions are referred to by both short
 // names and extended titles in the source. These are explicit aliases.
 const exact:[RegExp,string][]=[
  [/نافع بن عبد الرحمن|ابو عبد الرحمن نافع|^نافع المدني$/u,'imam:nafi'],
  [/عبد الله بن كثير|^ابن كثير|^امام مكة/u,'imam:ibnkathir'],
  [/زبان بن العلاء|^ابو عمرو البصري/u,'imam:abiamr'],
  [/عبد الله بن عامر الشامي|^ابن عامر/u,'imam:ibnamir'],
  [/عاصم بن ابي النجود|^عاصم الكوفي/u,'imam:asim'],
  [/حمزة بن حبيب|حمزة الزيات/u,'imam:hamza'],
  [/علي بن حمزة الكسائي|^الكسائي الكوفي/u,'imam:kisai'],
  [/يزيد بن القعقاع/u,'imam:abujafar'],
  [/يعقوب بن اسحاق الحضرمي|^يعقوب الحضرمي/u,'imam:yaqub'],
  [/خلف بن هشام البزار|^خلف الامام/u,'imam:khalaf'],
  [/عثمان بن سعيد الداني|^الامام الداني$|^الداني$/u,'anchor:dani'],
  [/محمد بن محمد الجزري|^ابن الجزري$/u,'anchor:jazari'],
  [/ابراهيم العبيدي/u,'anchor:ubaidi'],
  [/ذكاء الله بن راغب محمد سليمان/u,'person:zakaullah'],
  [/عبد الرحمن بن بشير(?: خان)? المكي/u,'person:abdulrahman-bin-bashir-makki'],
  [/محمد كامل بن نعمت علي(?: خان)?/u,'person:muhammad-kamil-nemat-ali'],
  [/حفص بن عمر.*الدوري|حفص بن عمر بن عبد العزيز|^حفص الدوري$/u,'rawi:duri'],
  [/عيسي بن مينا|^قالون$/u,'rawi:qalun'],
  [/عثمان بن سعيد المصري.*ورش|^ورش$/u,'rawi:warsh'],
  [/اسماعيل بن عبد الله القسط/u,'person:ismail-qust'],
  [/سليم بن عيسي/u,'person:salim-bin-isa'],
  [/ادريس بن عبد الكريم/u,'person:idris-al-haddad'],
  [/شعبة بن عياش/u,'person:shuba-bin-ayyash'],
  [/عثمان بن سعيد المصري/u,'rawi:warsh'],
  [/شبل بن عباد/u,'person:shibl'],
  [/معروف بن مشكان/u,'person:maruf'],
  [/زر بن حبيش/u,'person:zirr'],
  [/عبد الله بن حبيب السلمي/u,'person:abdulrahman-sulami'],
  [/رفيع بن مهران الرياحي/u,'person:abulalia'],
  [/ابي بن كعب|ابي بن كعب|^ابي بن كعب$/u,'sahabi:ubayy'],
  [/عمر بن الخطاب/u,'sahabi:umar'],
  [/عثمان بن عفان/u,'sahabi:uthman'],
  [/علي بن ابي طالب/u,'sahabi:ali'],
  [/زيد بن ثابت/u,'sahabi:zayd'],
  [/عبد الله بن مسعود/u,'sahabi:ibnmasud'],
  [/عبد الله بن عباس/u,'sahabi:ibnabbas'],
  [/ابو موسي الاشعري|ابي موسي الاشعري/u,'sahabi:abumusa'],
  [/ابو هريرة|ابي هريرة/u,'sahabi:abuhurayra'],
  [/ابو الدرداء|ابي الدرداء/u,'sahabi:abudarda'],
  [/عبد الله بن عياش/u,'sahabi:ibnayash'],
  [/محمد بن عبد الله رسول الله|رسول الله محمد بن عبد الله/u,'prophet'],
 ];
 const found=exact.find(([pattern])=>pattern.test(n));
 return found?found[1]:'person:'+n.replace(/^(?:الامام |الشيخ |امام |الشيخين |الشيخين:)/gu,'').replace(/^ابي /u,'ابو ');
};
const tidy=(raw:string)=>raw
 .replace(/[\u00a0]/gu,' ')
 .replace(/[،.؛\s]+$/gu,'')
 .replace(/\s*(?:صَاحِبِ|صاحب)\s+(?:الرِّوَايَةِ|الرواية|القراءة|القِرَاءَةِ)\s*$/u,'')
 .replace(/\s+(?:المعروف(?:\s+بـ|\s+بابن|\s+ب)|الملقب\s+بـ)\s*[^،.]+$/u,'')
 .replace(/^الإِمَامِ\s+|^الإمام\s+|^الإمَامِ\s+|^الشيخ\s+/u,'')
 .replace(/^إمام المدينة\s*-[^-]+-\s*/u,'').replace(/^إمام (?:البصرة|الكوفة|مكة)\s*/u,'')
 .replace(/^إِمَامِ المُقرِئِينَ\s+|^إِمَامِ القُرَّاءِ\s+|^الحَافِظِ\s+/u,'')
 .replace(/^[\s،.؛:«»]+|[\s،.؛:«»\u200f]+$/gu,'').trim();

const allReadings=(which:'seven'|'all')=>QURRA.filter(q=>which==='all'||q.family==='seven').flatMap(q=>q.rawis.map(rawi=>({qariId:q.id,rawi})));
const readingsFor=(title:string):NarratorOccurrence[]=>{
 if(title.includes('فرعا السند')||title==='إسناد الشيخ ذكاء الله إلى إبراهيم العُبيدي — مرجع مستقل')return allReadings('all');
 if(title.includes('إلى الإمام الداني'))return allReadings('seven');
 const match=title.match(/^CHAIN:([^:]+):(.+)$/u);
 if(!match)return [];
 const q=QURRA.find(x=>x.id===match[1]);
 return q?(match[2]==='sahaba'||match[2]==='prophet'?q.rawis.map(rawi=>({qariId:q.id,rawi})):[{qariId:q.id,rawi:match[2]}]):[];
};

export function buildNarratorDirectory(sections:SourceSection[],students:{name:string;readings:NarratorOccurrence[]}[]=[]):NarratorDirectory{
 type ProfileInternal=NarratorProfile&{teacherSet:Set<string>;studentSet:Set<string>;readingSet:Set<string>;sourceSet:Set<string>};
 const people=new Map<string,ProfileInternal>();
 let links=0;
 let processed=0;
 const sourceMap=new Map(sections.map(section=>[section.title,section]));
 const nameFor=(s:string)=>tidy(s);
 function add(name:string,source:string):string{
  const spelling=nameFor(name);
  const id=canonical(spelling);
  if(!spelling||spelling.length<3||id==='person:')return '';
  const src=sourceMap.get(source);
  if(!src)return '';
  let person=people.get(id);
  if(!person){person={id,name:spelling,teachers:[],students:[],readings:[],sources:[],teacherSet:new Set(),studentSet:new Set(),readingSet:new Set(),sourceSet:new Set()};people.set(id,person);}
  // Prefer the longer, explicit person name over short aliases, without changing diacritics.
  if(!spelling.includes('ﷺ')&&spelling.length>person.name.length && spelling.length<95 && !/^(?:الامام|وهو)/u.test(spelling))person.name=spelling;
  for(const reading of readingsFor(source)){
   const code=reading.qariId+'|'+reading.rawi;
   if(!person.readingSet.has(code)){person.readingSet.add(code);person.readings.push(reading);}
  }
  if(!person.sourceSet.has(source)){person.sourceSet.add(source);person.sources.push(source);}
  return id;
 }
 function link(student:string,teacher:string,source:string){
  const sid=add(student,source),tid=add(teacher,source);
  if(!sid||!tid||sid===tid)return;
  const s=people.get(sid)!,t=people.get(tid)!;
  if(!s.teacherSet.has(tid)){s.teacherSet.add(tid);s.teachers.push(tid);links++;}
  if(!t.studentSet.has(sid)){t.studentSet.add(sid);t.students.push(sid);}
 }
 function chain(path:string[],source:string){for(let i=1;i<path.length;i++)link(path[i-1],path[i],source);}
 function fan(students:string[],teachers:string[],source:string){for(const from of students)for(const to of teachers)link(from,to,source);}
 const imamNames:Record<string,string>={nafi:'نافع بن عبد الرحمن المدني',ibnkathir:'أبي معبد عبد الله بن كثير المكّي',abiamr:'أبي عمرو زبان بن العلاء بن عمار التميمي البصري',ibnamir:'عبد الله بن عامر الشامي',asim:'أبي بكر عاصم بن أبي النجود الكوفي',hamza:'حمزة بن حبيب الزيات الكوفي',kisai:'علي بن حمزة الكسائي الكوفي',khalaf:'خلف بن هشام البزار',yaqub:'يعقوب بن إسحاق الحضرمي',abujafar:'يزيد بن القعقاع المدني'};
 // Every unambiguous main link is read in the order written: reader/student -> teacher.
 for(const src of sections){
  const title=src.title;
  if(!title.startsWith('CHAIN:') || /:(sahaba|prophet)$/u.test(title))continue;
  processed++;
  const qid=title.split(':')[1];
  const origin=QURRA.find(q=>q.id===qid)?.family==='seven'?'الإمام الداني':'الإمام ابن الجزري';
  let last=origin;
  const chunks=src.body.split(/،/u);
  for(let i=0;i<chunks.length;i++){
    let clause=chunks[i].trim();
    if(!clause)continue;
    // Branched narrations are handled explicitly below, rather than guessing
    // what plural pronouns (وهما / وهم) refer to.
    if(/^(?:وقرأ|وَقَرَأَ|وأما|وهم|وهما|وقرأوا|وأبي|وعبد|وشِبل)/u.test(clause)){
      if(i===0&&/الداني/u.test(clause)&&/على/u.test(clause)){
        const target=clause.slice(clause.lastIndexOf('على')+3).trim();
        if(target){link(origin,target,title);last=target;continue;}
      }
      break;
    }
    if(/الشيخين|شيخين/u.test(clause))break;
    const m=clause.match(/^(?:وهو|وهو قرأ|وهو قرأ|وهو قرأَ|وهي)\s*(?:قرأ\s*)?(?:على|عن)\s+(.+)$/u)
       ||clause.match(/^عن\s+(.+)$/u);
    if(!m)break;
    let next=m[1].trim();
    if(/^(?:الشيخين|شيخين|مشايخ)/u.test(next))break;
    // A few honorifics contain the name, but no relation until the next comma.
    if(next){link(last,next,title);last=next;}
  }
 }
 // Shared chains: represented explicitly because the 'ح' transition indicates
 // branching, not a continuation of the previous teacher.
 const route='من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة';
 if(sourceMap.has(route)){
  chain(['الإمام ابن الجزري','أبي محمد عبد الرحمن بن أحمد البغدادي','أبي عبد الله محمد بن أحمد الصائغ المصري','أبي الحسن علي بن شجاع المعروف بـ صهر الشـاطبي','أَبِي مُحَمَّدٍ القَاسِـمِ بنِ فِيرُّهْ الشَّاطِبِيِّ','أبي الحسن علي بن محمد ابن هذيل البَلَنسي','أبي داود سليمان بن نجاح الأندلسي','أبي عمرو عثمان بن سعيد الداني'],route);
  processed++;
 }
 const ubaydi='من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند';
 if(sourceMap.has(ubaydi)){
  const sheikh='عبد الرحمن بن شحاذة اليَمَنِيِّ';
  chain(['إبراهيم العُبيدي','أبي زيد عبد الرحمن بن حسن الأَجهُورِيِّ','أبي السَّماح أحمد بن رجب البَقَرِيِّ','شمس الدين محمد بن عمر بن قاسم البَقَرِيِّ',sheikh,'نور الدين عليِّ بن محمد الخزرجي المعروف بـ ابن غانم الـمَقدِسِيِّ','أبي الفتح محمد بن إبراهيم السَمَدِيسِيِّ','أبي العباس أحمد بن أسد الأُميُوطِيِّ','إِمَامِ المُقرِئِينَ أَبِي الخَيرِ مُحَمَّدِ بنِ مُحَمَّدٍ الجَزَرِيِّ'],ubaydi);
  chain([sheikh,'شهاب الدين أحمد بن أحمد بن عبد الحق السُنبَاطِيِّ','أبي عبد الرحمن شحاذة اليَمَنِيِّ','ناصر الدين محمد بن سالم الطَّبلَاوِيِّ','شيخ الإسلام زين الدين زكريا بن محمد الأَنصَارِيِّ'],ubaydi);
  fan(['شيخ الإسلام زين الدين زكريا بن محمد الأَنصَارِيِّ'],['أبو العباس أحمد بن أبي بكر القَلقِيلِيُّ','أبو الحسن طاھر بن محمد النُّوَيرِيُّ','أبو النَّعِيم رضوان بن محمد العُقبِيُّ','أبو العباس أحمد بن أسد الأُميُوطِيُّ'],ubaydi);
  fan(['أبو العباس أحمد بن أبي بكر القَلقِيلِيُّ','أبو الحسن طاھر بن محمد النُّوَيرِيُّ','أبو النَّعِيم رضوان بن محمد العُقبِيُّ','أبو العباس أحمد بن أسد الأُميُوطِيُّ'],['إِمَامِ المُقرِئِينَ أَبِي الخَيرِ مُحَمَّدِ بنِ مُحَمَّدٍ الجَزَرِيِّ'],ubaydi);
  processed++;
 }
 // Sheikh Zakaullah's personal source is part of the shared sanad library.
 // Explicitly connect its three converging paths, without mistaking the (ح)
 // branch markers for a direct link between unrelated shuyukh.
 const zakaSource='إسناد الشيخ ذكاء الله إلى إبراهيم العُبيدي — مرجع مستقل';
 if(sourceMap.has(zakaSource)){
  const zaka='الشيخ ذكاء الله بن راغب محمد سليمان';
  const qasimi='الشيخ المقرئ أحمد الله الكريم القاسمي بن معارف الله الكريم';
  const kamil='الشيخ محمد كامل بن نعمت علي خان';
  const bashir='الشيخ عبد الرحمن بن بشير خان المكي';
  const tahanawi='الشيخ عبد الله التهانوي';
  const diya='الشيخ ضياء الدين أحمد بن منشي محمد عبد الرزاق';
  chain([zaka,qasimi,kamil,bashir],zakaSource);
  chain([kamil,tahanawi,bashir],zakaSource);
  chain([tahanawi,diya,bashir],zakaSource);
  chain([bashir,'الشيخ محمد عبد الله بن محمد بشير خان المكي',
    'شيخ القراء بمكة إبراهيم بن سعد المصري',
    'الشيخ حسن بن محمد بن بدير المصري المعروف بـ الجُريسي الكبير',
    'الشيخ محمد بن أحمد المصري الشهير بـ المتولِّي',
    'الشيخ أحمد بن محمد الدري التهامي',
    'الشيخ أحمد بن محمد سَلَمونه المصري',
    'الشيخ إبراهيم العُبَيدِي'],zakaSource);
  processed++;
 }
 // Not every chain is linear. The following branch edges are taken from
 // their explicit multi-teacher statements (no inferred 'unwritten' links).
 const part=(imam:string,rawi:string)=>`CHAIN:${imam}:${rawi}`;
 const p=(imam:string,rawi:string,path:string[])=>{const src=part(imam,rawi);if(sourceMap.has(src))chain(path,src);};
 const f=(imam:string,rawi:string,from:string[],to:string[])=>{const src=part(imam,rawi);if(sourceMap.has(src))fan(from,to,src);};
 const ibnKathir=imamNames.ibnkathir;
 const bazzi='أبي الحسن أحمد بن محمد المكي المعروف بـ البزّي';
 const wahb='أبي الإخرِيط وهْب بن واضح المكِّي';
 const ibnKathirGroup=['أبي داود شِبل بن عبّاد المكي','أبي إسحاق إسماعيل بن عبد الله القسط المكي','أبي الوليد معروف بن مشكان المكي'];
 f('ibnkathir','البزّي',[bazzi],[wahb,'أبي القاسم عكرمة بن سليمان بن كثِير المكِّي','عبد اللهِ بن زِياد المكِّي']);
 f('ibnkathir','البزّي',[wahb,'أبي القاسم عكرمة بن سليمان بن كثِير المكِّي','عبد اللهِ بن زِياد المكِّي'],ibnKathirGroup);
 f('ibnkathir','البزّي',ibnKathirGroup,[ibnKathir]);
 f('ibnkathir','قُنبل',['أبي الإخرِيط وهْب بن واضح المكِّي'],['أبي إسحاق إسماعيل بن عبد الله القُسط المكي','أبي الوليد معروف بن مشكان المكي','شِبل بن عبّاد المكي']);
 f('ibnkathir','قُنبل',['أبي إسحاق إسماعيل بن عبد الله القُسط المكي','أبي الوليد معروف بن مشكان المكي','شِبل بن عبّاد المكي'],[ibnKathir]);
 // Khalaf al-Ashir, Ishaq: the initial two shuyukh converge at al-Sa'igh.
 const jazari='الإمام ابن الجزري';
 const ish='إسحاق';
 f('khalaf',ish,[jazari],['أبي محمد عبد الرحمن بن أحمد البغدادي','أبي عبد الله محمد بن عبد الرحمن الحنفي']);
 p('khalaf',ish,['أبي محمد عبد الرحمن بن أحمد البغدادي','أبي عبد الله محمد بن أحمد الصائغ المصري','أبي إسحاق إبراهيم بن أحمد بن فارس الإسكندري','أبي اليمن زيد بن الحسن الكندي','أبي القاسم هبة الله بن أحمد بن الطَّبَري البغدادي','أبي بكر محمد بن علي البغدادي الخياط','أبي الحسين أحمد بن عبد الله السُوسَنْجِرْدِي البغدادي','أبي الحسن محمد بن عبد الله الطوسي المعروف بابن أبي عمر النقاش','أبي يعقوب إسحاق بن إبراهيم الوراق','أبي محمد خلف بن هشام البزار']);
 f('khalaf',ish,['أبي عبد الله محمد بن عبد الرحمن الحنفي'],['أبي عبد الله محمد بن أحمد الصائغ المصري']);
 // Khalaf al-Ashir, Idris: two named branches reunite at Idris.
 const idris='إدريس';
 f('khalaf',idris,['أبي محمد عبد الله بن علي البغدادي المعروف بـ سبط الخياط'],['أبي المعالي ثابت بن بُندَار الدينوري البقال','أبي الفضل عبد القاهر بن عبد السلام الشريف المكي']);
 p('khalaf',idris,['أبي المعالي ثابت بن بُندَار الدينوري البقال','القاضي أبي العلاء محمد بن علي الواسطي','أبي بكر أحمد بن جعفر القَطِيعِي البغدادي','أبي الحسن إدريس بن عبد الكريم الحداد الكوفي']);
 p('khalaf',idris,['أبي الفضل عبد القاهر بن عبد السلام الشريف المكي','أبي عبد الله محمد بن الحسين الكارزِينِي','أبي العباس الحسن بن سعيد المُطَّوِّعِي البصري','أبي الحسن إدريس بن عبد الكريم الحداد الكوفي']);
 p('khalaf',idris,['أبي الحسن إدريس بن عبد الكريم الحداد الكوفي','خلف بن هشام البزار']);
 // Sahaba sections use groups, parallel reading routes and explicit teachers.
 const companions:Record<string,string[]>={
  ubayy:['أُبيّ بن كعب'],umar:['عمر بن الخطاب'],uthman:['عثمان بن عفان'],ali:['علي بن أبي طالب'],zayd:['زيد بن ثابت'],ibnabbas:['عبد الله بن عباس'],ibnmasud:['عبد الله بن مسعود'],abumusa:['أبي موسى الأشعري']
 };
 const sah=(imam:string)=>`CHAIN:${imam}:sahaba`;
 const sf=(imam:string,students:string[],teachers:string[])=>{const src=sah(imam);if(sourceMap.has(src))fan(students,teachers,src);};
 const sp=(imam:string,path:string[])=>{const src=sah(imam);if(sourceMap.has(src))chain(path,src);};
 const prophet='رسول الله محمد بن عبد الله ﷺ';
 const u='أُبيّ بن كعب',um='عمر بن الخطاب',ot='عثمان بن عفان',al='علي بن أبي طالب',za='زيد بن ثابت',ib='عبد الله بن عباس',ms='عبد الله بن مسعود',mu='أبي موسى الأشعري';
 // Nafi'
 const nafiFive=['أبي جعفر يزيد بن القعقاع','أبي داود عبد الرحمن بن هرمز','شيبة بن نِصاح القاضي','مسلم بن جندب الهذلي','يزيد بن رومان'];
 sf('nafi',[imamNames.nafi],nafiFive);sf('nafi',nafiFive,['أبي هريرة',ib,'عبد الله بن عياش']);sf('nafi',['أبي هريرة',ib,'عبد الله بن عياش'],[u]);
 // Ibn Kathir
 sp('ibnkathir',[ibnKathir,'عبد الله بن السائب المخزومي']);sf('ibnkathir',['عبد الله بن السائب المخزومي'],[u,um]);sf('ibnkathir',[ibnKathir],['أبي الحجاج مجاهد بن جبر المكي','دِرباس المكي']);sf('ibnkathir',['أبي الحجاج مجاهد بن جبر المكي','دِرباس المكي'],[ib]);sf('ibnkathir',[ib],[za,u]);
 // Abu Amr al-Basri
 const abiamr=imamNames.abiamr;sf('abiamr',[abiamr],['نصر بن عاصم البصري','أبي سليمان يحيى بن يعمر البصري']);sf('abiamr',['نصر بن عاصم البصري','أبي سليمان يحيى بن يعمر البصري'],['أبي الأسود ظالم بن عمرو الدؤلي']);sf('abiamr',['أبي الأسود ظالم بن عمرو الدؤلي'],[ot,al]);sf('abiamr',[abiamr],['أبي الحجاج مجاهد بن جبر المكي','أبي محمد سعيد بن جبير الأسدي']);sf('abiamr',['أبي الحجاج مجاهد بن جبر المكي','أبي محمد سعيد بن جبير الأسدي'],[ib]);sf('abiamr',[ib],[u,za]);sp('abiamr',[abiamr,'أبي الحسن الحسن بن يسار البصري']);sf('abiamr',['أبي الحسن الحسن بن يسار البصري'],['أبي العالية رفيع بن مهران الرياحي','حطَّان بن عبد الله الرقاشي']);sf('abiamr',['حطَّان بن عبد الله الرقاشي'],[mu]);sf('abiamr',['أبي العالية رفيع بن مهران الرياحي'],[um,u,za]);
 // Ibn Amir
 sf('ibnamir',[imamNames.ibnamir],['أبى الدرداء','أبي هاشم مغيرة بن أبي شهاب المخزومي']);sf('ibnamir',['أبي هاشم مغيرة بن أبي شهاب المخزومي'],[ot]);
 // Asim
 const asim=imamNames.asim,zirr='أبي مريم زر بن حُبَيْش الأسدي',sulami='أبي عبد الرحمن عبد اللّٰه بن حبيب السلمي';sf('asim',[asim],[zirr,sulami]);sf('asim',[zirr,sulami],[ot,al,ms]);sf('asim',[sulami],[u,za]);
 // Hamza and al-Kisai share explicitly stated lower reading paths.
 const sad='أبي عبد الله جعفر بن محمد الصادق الهاشمي',baq='أبي جعفر محمد بن علي الباقر الهاشمي',zayn='أبي محمد علي بن الحسين زين العابدين الهاشمي',hus='الحسين بن علي',amash='أبي محمد سليمان بن مهران الأعمش الكوفي',alia='أبي العالية رفيع بن مهران الرياحي';
 for(const imam of ['hamza','kisai']){
  const h=imamNames.hamza;
  if(imam==='kisai')sp(imam,[imamNames.kisai,h]);
  sp(imam,[h,sad,baq,zayn,hus,al]);sp(imam,[h,amash,zirr]);sf(imam,[zirr],[ot,al,ms]);sp(imam,[amash,alia]);sf(imam,[alia],[um,za,u,ib]);sp(imam,[ib,u]);
 }
 // Khalaf al-Ashir: Shubah->Asim branch and the Hamza branch as written.
 sp('khalaf',[imamNames.khalaf,'أبي عيسى سليم بن عيسى الحنفي الكوفي',imamNames.hamza]);sf('khalaf',[imamNames.khalaf],['أبي يوسف يعقوب بن محمد الأعشى','أبي زكريا يحيى بن آدم الكوفيّ']);sp('khalaf',['أبي زكريا يحيى بن آدم الكوفيّ','أبي بكر شعبة بن عياش الكوفي',asim]);sf('khalaf',[asim],[zirr,sulami]);sf('khalaf',[zirr,sulami],[ot,al,ms]);sf('khalaf',[sulami],[u,za]);
 // Yaqub
 const yaqub=imamNames.yaqub;sp('yaqub',[yaqub,'أبي الأشهب جعفر بن حيان العطاردي البصري','أبي رجاء عمران بن تيم العُطاردي البصري',mu]);sp('yaqub',[yaqub,'أبي يحيى مهدي بن ميمون الأزدي','أبي صالح شعيب بن الحبحاب الأزدي',alia]);sf('yaqub',[alia],[um,u,za]);sp('yaqub',[yaqub,'أبي المنذر سلَّام بن سليمان الطويل الخراساني']);sf('yaqub',['أبي المنذر سلَّام بن سليمان الطويل الخراساني'],[asim,abiamr]);
 // Abu Ja'far
 sf('abujafar',[imamNames.abujafar],['أبي هريرة',ib]);sf('abujafar',['أبي هريرة',ib],[u]);
 // The companion-to-Prophet link is explicitly attested in the corresponding
 // prophet section; do not infer cross-links between companion narrations.
 for(const imam of QURRA){
  const title=`CHAIN:${imam.id}:prophet`;
  const text=sourceMap.get(title)?.body||'';
  if(!text)continue;
  processed++;
  const sahabaByImam:Record<string,string[]>={nafi:[u],ibnkathir:[um,u,za],abiamr:[um,ot,al,u,mu,za],ibnamir:[ot,'أبى الدرداء'],asim:[ot,al,ms,u,za],hamza:[um,ot,al,ms,u,za],kisai:[um,ot,al,ms,u,za],khalaf:[um,ot,al,ms,u,za],yaqub:[um,ot,al,ms,u,mu,za],abujafar:[u]};
  fan(sahabaByImam[imam.id]||[],[prophet],title);
 }
 // Students of Sheikh Zakaullah come from the student register, not guessed links.
 const studentSource='طلبة الشيخ ذكاء الله';
 sourceMap.set(studentSource,{id:'students',title:studentSource,body:''});
 const studentIds=new Set<string>();
 for(const student of students){
  if(!student.name.trim())continue;
  link(student.name,'الشيخ ذكاء الله بن راغب محمد سليمان',studentSource);
  const id=canonical(tidy(student.name)),person=people.get(id);
  if(!person)continue;
  studentIds.add(id);
  for(const reading of student.readings){
   const key=reading.qariId+'|'+reading.rawi;
   if(!person.readingSet.has(key)){person.readingSet.add(key);person.readings.push(reading);}
  }
 }
 const result=[...people.values()]
  .filter(p=>p.readings.length>0||studentIds.has(p.id))
  .map(({teacherSet,studentSet,readingSet,sourceSet,...p})=>({...p,readings:p.readings.sort((a,b)=>QURRA.findIndex(x=>x.id===a.qariId)-QURRA.findIndex(x=>x.id===b.qariId)||a.rawi.localeCompare(b.rawi,'ar'))}));
 result.sort((a,b)=>a.name.localeCompare(b.name,'ar'));
 return {people:result,links,sections:sections.filter(s=>s.title.startsWith('CHAIN:')||s.title===route||s.title===ubaydi||s.title===zakaSource).length};
}
