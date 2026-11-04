// Read-only offline audit. Supply a private shared-library export; never commit that export.
const fs=require('node:fs'),path=require('node:path');
const {compareStructuredRoute,sanadKey}=require(path.resolve('.vercel/unified-tests/legacy/lib/unifiedSanad.js'));
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Supply audit JSON input and Markdown output paths');
const a=JSON.parse(fs.readFileSync(input,'utf8'));
const chains=a.chains.map(c=>({...c,branches:!a.nodes.some(n=>n.chain_id===c.id)?[[]]:[...new Set(a.nodes.filter(n=>n.chain_id===c.id).map(n=>n.branch))].sort((a,b)=>a-b).map(branch=>a.nodes.filter(n=>n.chain_id===c.id&&n.branch===branch).sort((a,b)=>a.position-b.position))}));
const results=[];let prefixMatches=0,prefixCount=0;
for(const book of a.books.filter(b=>!b.archived))for(const route of chains.filter(c=>c.book_id===book.id&&c.kind==='route'&&!c.archived)){
 const parent=chains.find(c=>c.id===route.book_chain_id);if(!parent){results.push({book:book.title,route:route.title,status:'incomplete',branches:0,missing:['إسناد الكتاب غير متاح'],id:route.id});continue;}
 const common=a.shared_sections.filter(s=>s.title==='من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة');
 const own=a.shared_sections.filter(s=>s.title===`CHAIN:${route.qari_id}:${route.rawi}`);
 const sources=book.title.includes('الشاطبية')?[...common,...own]:own;
 const comparison=compareStructuredRoute(book,parent,route,a.people,sources);
 let prefix='غير مطبق';
 if(book.title==='الشاطبية'){
  prefixCount++;const reference=common[0]?.body||'';
  const paths=parent.branches.flatMap(p=>route.branches.map(r=>[...p.map(n=>n.person_id),book.author_id,...r.slice(0,3).map(n=>n.person_id)]));
  const names=paths.map(ids=>ids.filter((id,i)=>!i||id!==ids[i-1]).map(id=>a.people.find(p=>p.id===id)?.name||''));
  const matches=names.every(ns=>ns.length===7&&sanadKey(ns.map(n=>'عن '+n).join('، '))===sanadKey(reference));
  prefix=matches?'مطابق (٧ أسماء)':'يحتاج مراجعة';if(matches)prefixMatches++;
 }
 results.push({book:book.title,route:route.title,status:comparison.status,branches:comparison.paths.length,missing:comparison.paths.flatMap(p=>p.missing),id:route.id,sources:comparison.sourceIds,prefix});
}
const status={match:'مطابق للأسماء بالترتيب',review:'يحتاج مراجعة',incomplete:'غير مكتمل'};
const lines=['# تقرير مقارنة الأسانيد المحفوظة','',`التاريخ: 2026-11-04 — مقارنة قراءة فقط؛ لم تُعدّل أي سجلات.`,``,`الشاطبية إلى الداني: ${prefixMatches}/${prefixCount} طرق تطابق المقطع المشترك ذي الأسماء السبعة بعد تجاهل التشكيل والتطويل وأشكال الألف/الياء.`,``,'المطابقة ليست توثيقًا تاريخيًا. المقارنة العامة تتحقق من وجود أسماء البناء وترتيبها في المصادر؛ لا تثبت مساواة كل ألفاظ السند أو جميع الأسماء الزائدة. الاختلافات تبقى للمراجعة.',``,'| الكتاب | الطريق | الفروع | مقارنة الأسماء | ابن الجزري إلى الداني |','| --- | --- | --- | --- | --- |',...results.map(r=>`| ${r.book} | ${r.route} | ${r.branches} | ${status[r.status]} | ${r.prefix||'—'} |`),'', '## المعرّفات والفروق',...results.flatMap(r=>['',`### ${r.book} — ${r.route}`,`المصدر: ${(r.sources||[]).join('، ')||'غير متاح'}`,`الطريق: ${r.id}`,`غير مطابق أو مفقود: ${r.missing.join('، ')||'لا توجد أسماء بناء مفقودة؛ راجع فروق النص والفروع يدويًا.'}`]),'',`حالة الشهادات الأساسية عند التدقيق: ${JSON.stringify(a.certificates)}. لقطات نهائية أساسية: ${a.snapshots}؛ لقطات مساحة العمل القديمة: ${a.workspace_snapshot_count}. تحفظ اللقطات القديمة لعدم الجزم بتاريخ إصدارها.`, '','لم يُعتمد أو يُقسّم أو يُحوّل أي نص أثناء هذا التدقيق. لا يشمل هذا التقرير سلاسل الكتب المؤرشفة.'];
fs.writeFileSync(output,lines.join('\n'));console.log(JSON.stringify({routes:results.length,shatibiyyahPrefix:`${prefixMatches}/${prefixCount}`,fullNameMatches:results.filter(r=>r.status==='match').length,needsReview:results.filter(r=>r.status!=='match').length,report:output}));
