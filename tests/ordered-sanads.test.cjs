const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),swc=require('next/dist/build/swc');

async function exerciseOrderedSanads({ createDraft, reserve, publish } = {}){
 await swc.loadBindings();
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const owner=id(1),guestId=id(2),jazari=id(3);
 const names=['الشيخ أَحْمَد','الشيخ بَكْر','الشيخ حَسَن'];
 const variants=names.map((name,i)=>({id:id(10+i),shaykhId:guestId,qariId:'asim',rawi:'حفص',variantName:name,junction:'jazari',
  personalPersonIds:[id(20+i),jazari],sanadText:'كما أخذته عن '+name+'، عن الإمام ابن الجزري'}));
 const guest={id:guestId,name:'شيخ تجريبي',junction:'jazari',personalChain:'كما أخذته عن شيخ رابع، عن الإمام ابن الجزري',sharedSughraSanad:true,
  readingsJson:JSON.stringify(['حفص','شعبة'].map(rawi=>({qariId:'asim',rawi})))};
 const sections=[{id:'intro',title:'مقدمة',sectionType:'introduction',body:'مقدمة تجريبية'},
  ...['من الإمام ابن الجزري إلى الإمام الداني — القراء السبعة','CHAIN:asim:حفص','CHAIN:asim:sahaba','CHAIN:asim:prophet']
   .map((title,i)=>({id:'section-'+i,title,sectionType:'chain',body:['عن الإمام الداني','عن القارئ التجريبي','عن الصحابي التجريبي','عن رسول الله ﷺ'][i]}))];
 const holdings=variants.map(v=>({...v,ownerId:owner,personalChain:v.sanadText,shortName:v.variantName,introductionId:'intro'}));
 const sanads=[],certs=[],snapshots=[];
 let admin=true,finalized;
 const entity=rows=>({findAll:async()=>({records:structuredClone(rows)}),findOne:async({id})=>structuredClone(rows.find(r=>r.id===id)),
  create:async({record})=>{const row=structuredClone({...record,id:crypto.randomUUID()});rows.push(row);if(rows===certs&&createDraft)await createDraft(row);return row;}});
 const db={additionalShaykhs:entity([guest]),additionalShaykhExtensions:entity([]),additionalShaykhReadingSanads:entity(variants),
  sanadSections:entity(sections),ijazahHoldings:entity(holdings),asaneed:entity(sanads),certificates:entity(certs),
  certificateSnapshots:entity(snapshots),students:entity([]),sanadPrintStyles:entity([]),riwayahPrintColors:entity([]),
  preparedIjazahs:entity([]),shaykhPrintProfiles:entity([]),assetSources:entity([]),
  auth:{findAllUsers:async()=>({records:[{id:owner,name:'مُجيز تجريبي'}]})}};
 const client={from(table){return {select(){return this;},eq(){return this;},range:async()=>({data:[]}),
  single:async()=>({data:table==='certificate_snapshots'?{content:finalized}:null})};},
  rpc:async(name,payload)=>{assert.equal(name,'finalize_certificate');finalized=publish?await publish(payload):structuredClone(payload.snapshot);return {error:null};}};
 const context={user:{id:owner,email:'fixture@example.invalid'}};
 const node=person_id=>({person_id,route_source:false});
 const library={books:[{id:id(40),title:'المستنير',author_id:id(43)}],chains:[
  {id:id(42),kind:'book',book_id:id(40),confirmed:true,branches:[[node(jazari)]]},
  {id:id(41),kind:'route',book_id:id(40),book_chain_id:id(42),confirmed:true,reading_scope:'kubra',qari_id:'asim',rawi:'حفص',
   route_code:'1031',title:'طريق تجريبي',branches:[[node(id(44))]],continuation:'عن رسول الله ﷺ'}],
  people:[[jazari,'الإمام ابن الجزري'],[id(43),'مؤلف الكتاب التجريبي'],[id(44),'الراوي التجريبي']]
   .map(([id,name])=>({id,name,display_name:'',archived:false})),prefixContinuations:[],reviewedPersonalGraphs:[]};
 const mocks={'zitejs/backend':{createEndpoint:definition=>definition},'zitejs/db':{zite:db},'../lib/admin':{isAppAdmin:async()=>admin},
  '../compat/context':{context:()=>({client})},'../../lib/sanad-library':{loadBuilderLibrary:async()=>library},
  '../lib/certificateRegistration':{ensureCertificateRegistration:reserve??(async()=>'2601-0101')},'../lib/shahadaSequence':{nextShahadaNumber:async()=>1},
  './certificateAppearance':{personalAppearance:async()=>null}};
 const cache=new Map();
 function load(file){
  file=path.resolve(file);
  if(cache.has(file))return cache.get(file);
  const mod=new Module(file,module);
  mod.paths=module.paths;
  mod.require=request=>{
   if(request in mocks)return mocks[request];
   if(request.startsWith('.')){
    const local=path.resolve(path.dirname(file),request);
    if(request.endsWith('.json'))return require(local);
    if(fs.existsSync(local+'.ts'))return load(local+'.ts');
   }
   return require(request);
  };
  mod._compile(swc.transformSync(fs.readFileSync(file,'utf8'),{
   filename:file,jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'},
  }).code,file);
  cache.set(file,mod.exports);
  return mod.exports;
 }
 const call=async(file,value)=>{
  const endpoint=load('legacy/api/'+file+'.ts').default;
  return endpoint.outputSchema.parse(await endpoint.execute({input:endpoint.inputSchema.parse(value),context}));
 };
 const {mergeOrderedSanadText}=load('legacy/lib/mergeOrderedSanadText.ts');
 const graphNames={a:'الشيخ عبد الوهاب',b:'الشيخ عبد الغفار',c:'الشيخ بكري',d:'الشيخ الحلواني',e:'الشيخ الأجهوري',f:'الشيخ السنباطي',g:'الشيخ ابن غانم',h:'الإمام ابن الجزري'};
 const graphPaths=[['a','b','d','e','f','h'],['a','b','d','e','g','h'],['a','c','d','e','f','h'],['a','c','d','e','g','h']];
 const graphText=path=>'كما أخذته عن '+path.map(id=>graphNames[id]).join('، عن ')+'.';
 const graphBranch=(path,names=graphNames)=>({paths:[[...path].reverse()],names});
 const merged=mergeOrderedSanadText(graphPaths.map(graphText),graphPaths.map(path=>graphBranch(path)));
 assert.ok(merged && !merged.includes('ثم تلتقي الطرق عند'));
 assert.equal((merged.match(/الشيخ الحلواني/gu)||[]).length,1,'junction is formally introduced only once');

 assert.equal((merged.match(/الإمام ابن الجزري/gu)||[]).length,1,'shared endpoint prints once');
 assert.equal((merged.match(/\(ح\)/gu)||[]).length,0,'no (ح) for direct parallel narrators sharing both endpoints');
 assert.equal(mergeOrderedSanadText(graphPaths.slice(0,2).map(graphText),[
  graphBranch(graphPaths[0]),graphBranch(graphPaths[1],{...graphNames,e:'اسم آخر'})]),null,'conflicting identity display must not merge');
 assert.equal(mergeOrderedSanadText([graphText(graphPaths[0]),graphText(graphPaths[1]).replace(/\.$/u,'، عن تتمة مختلفة.')],
  graphPaths.slice(0,2).map(path=>graphBranch(path))),null,'different continuations remain separate');
 const partial=graphPaths.slice(0,3);
 assert.equal(mergeOrderedSanadText(partial.map(graphText),partial.map(path=>graphBranch(path))),null,'do not introduce a missing crossed route');
 const independent=[['a','d','h'],['b','d','h']];
 const independentText=mergeOrderedSanadText(independent.map(graphText),independent.map(path=>graphBranch(path)));
 assert.match(independentText||'',/الشيخ الحلواني \(ح\) وقد أخذت أيضًا عن الشيخ عبد الغفار، عن الشيخ الحلواني/u);
 // When three or four teachers share the same student and same onward teacher,
 // the group is not three or four independent (ح) transmission switches.
 for(const count of [3,4]){
  const middle=['b','c','f','g'].slice(0,count),routes=middle.map(mid=>['a',mid,'d','e','h']);
  const together=mergeOrderedSanadText(routes.map(graphText),routes.map(p=>graphBranch(p)));
  assert.ok(together,'direct parallel narrator alternatives are safe to group');
  assert.equal((together.match(/\(ح\)/gu)||[]).length,0,'single-hop teacher group needs no (ح)');
  assert.equal((together.match(/الشيخ الحلواني/gu)||[]).length,1,'common meeting is recorded once');
  assert.ok(middle.every(mid=>together.includes(graphNames[mid])),'no teacher is omitted');
 }
 // Sheikh Uwais Hafs-style fixture: 5 incoming paths × 5 outward routes,
 // partly overlapping at Salim, Ubaydi, al-Baqari, al-Umyuti and al-Jazari.
 const base=[
  ['wa','dar','eyes','salim','mar','ub','aj','smah','baq'],
  ['wa','bkri','salim','mar','ub','aj','smah','baq'],
  ['ammar','f1','f2','mun','baq'],
  ['ay','a1','khal','kahil','had','ub','aj','smah','baq'],
  ['ay','a1','nafisa','kahil','had','ub','aj','smah','baq']
 ];
 const onward=[
  ['yam','ibnghan','samad','umy','jaz'],
  ['yam','sun','shad','tab','zak','qal','jaz'],
  ['yam','sun','shad','tab','zak','nuwa','jaz'],
  ['yam','sun','shad','tab','zak','uqbi','jaz'],
  ['yam','sun','shad','tab','zak','umy','jaz']
 ];
 const nameById=Object.fromEntries([...new Set([...base,...onward].flat())].map(x=>[x,'الشيخ '+x]));
 const fullRoutes=base.map(prefix=>onward.map(tail=>[...prefix,...tail]));
 const fullTexts=fullRoutes.map(paths=>paths.map(path=>graphText(path.map(x=>x))).join('\n\n(ح)\n\n'));
 const exactTexts=fullRoutes.map(paths=>paths.map(path=>'كما أخذته عن '+path.map(x=>nameById[x]).join('، عن ')).join('\n\n(ح)\n\n'));
 const exactBranches=fullRoutes.map(paths=>({paths:paths.map(path=>[...path].reverse()),names:nameById}));
 const compact=mergeOrderedSanadText(exactTexts,exactBranches);
 assert.ok(compact,'25 valid overlapping routes should merge without invented combinations');
 assert.ok(compact.length<exactTexts.join('\n\n(ح)\n\n').length/2,'shared routes must be compressed');
 const meetings=['salim','ub','baq'].map(id=>compact.indexOf(nameById[id]));
 assert.ok(meetings[0]>=0&&meetings[0]<meetings[1]&&meetings[1]<meetings[2],
  'newest meeting comes first: Salim, then Ubaydi, then al-Baqari');

 assert.ok(compact.endsWith('عن الشيخ jaz.'));
 assert.ok(!compact.includes('ثم تلتقي الطرق عند'));
 assert.match(compact,/عن الشيخ salim \(ح\) وقرأ الشيخ wa أيضًا على الشيخ bkri، عن الشيخ salim، عن الشيخ mar، عن الشيخ ub \(ح\) وقد أخذت أيضًا عن الشيخ ay/u);
 // Dropping one correlated input route must not be mistaken for a complete DAG.
 const incompleteRoutes=fullRoutes.map(paths=>[...paths]);
 incompleteRoutes[2]=incompleteRoutes[2].slice(0,4);
 const incompleteTexts=incompleteRoutes.map(paths=>paths.map(path=>'كما أخذته عن '+path.map(x=>nameById[x]).join('، عن ')).join('\n\n(ح)\n\n'));
 const incompleteBranches=incompleteRoutes.map(paths=>({paths:paths.map(path=>[...path].reverse()),names:nameById}));
 assert.equal(mergeOrderedSanadText(incompleteTexts,incompleteBranches),null,
  'no synthetic paths may be inferred when only some combinations were saved');

 const uwaisNames={wa:'الشيخ عبد الوهاب بن قحطان',dar:'الشيخ عبد الغفار الدُّروبي',eyes:'الشيخ عبد العزيز عيون السود',
  bkri:'الشيخ بكري الطرابيشي',salim:'الشيخ محمد سليم الحلواني',ub:'الشيخ إبراهيم العبيدي',
  ay:'الشيخ أيمن',jaz:'الإمام ابن الجزري'};
 const uwaisPaths=[['wa','dar','eyes','salim','ub','jaz'],['wa','bkri','salim','ub','jaz'],['ay','ub','jaz']];
 const uwaisText=mergeOrderedSanadText(uwaisPaths.map(path=>'كما أخذته عن '+path.map(id=>uwaisNames[id]).join('، عن ')),
  uwaisPaths.map(path=>graphBranch(path,uwaisNames)));
 assert.equal(uwaisText,'كما أخذته عن الشيخ عبد الوهاب بن قحطان، عن الشيخ عبد الغفار الدُّروبي، عن الشيخ عبد العزيز عيون السود، عن الشيخ محمد سليم الحلواني (ح) وقرأ الشيخ عبد الوهاب بن قحطان أيضًا على الشيخ بكري الطرابيشي، عن الشيخ محمد سليم الحلواني، عن الشيخ إبراهيم العبيدي (ح) وقد أخذت أيضًا عن الشيخ أيمن، عن الشيخ إبراهيم العبيدي، عن الإمام ابن الجزري.');
 // The live report adds Ayyub to the three earlier Hafs sources.
 const ayyub=['ayyub','khalil','makki','malik','saad','juraysi','mutawalli','tihami','salamuna','ub','aj','smah','baq'];
 const fourSources=[[base[0],base[1]],[base[3],base[4]],[ayyub],[base[2]]];
 const fourSourcePaths=fourSources.map(prefixes=>prefixes.flatMap(prefix=>onward.map(tail=>[...prefix,...tail])));
 const liveNames={...nameById,...uwaisNames,ayyub:'الشيخ محمد أيوب بن محمد يوسف',saad:'إبراهيم بن سعد المصري',
  salamuna:'الشيخ أحمد بن محمد سَلَمونه المصري',...Object.fromEntries(['khalil','makki','malik','juraysi','mutawalli','tihami'].map(id=>[id,'الشيخ '+id]))};
 assert.equal(fourSourcePaths.flat().length,30);
 const fourSourceText=mergeOrderedSanadText(fourSourcePaths.map(paths=>paths.map(path=>
  'كما أخذته عن '+path.map(id=>liveNames[id]).join('، عن ')).join('\n\n(ح)\n\n')),
  fourSourcePaths.map(paths=>({paths:paths.map(path=>[...path].reverse()),names:liveNames})));
 assert.ok(fourSourceText);
 assert.ok(!fourSourceText.includes('ثم تلتقي الطرق عند'));
 assert.ok(!fourSourceText.includes('ومن طريق'));
 assert.ok(fourSourceText.includes('عن الشيخ محمد سليم الحلواني (ح) وقرأ الشيخ عبد الوهاب بن قحطان'));
 assert.ok(fourSourceText.includes('عن الشيخ إبراهيم العبيدي (ح) وقد أخذت أيضًا عن الشيخ محمد أيوب بن محمد يوسف'));
 assert.ok(fourSourceText.includes('عن الشيخ أحمد بن محمد سَلَمونه المصري، عن الشيخ إبراهيم العبيدي، عن الشيخ aj'));
 const ids=variants.map(v=>v.id);
 const branchFixture={...variants[0],id:id(90),prepareNarratorBoxes:true,personalPeopleReviewed:true,junction:'ubaydi',
  sanadText:'كما أخذته عن الشيخ أَحْمَد، عن الشيخ خالد، عن إبراهيم العُبيدي (ح). وقرأ الشيخ أَحْمَد أيضًا على الشيخ صالح، عن إبراهيم العُبيدي',
  personalPersonIds:[id(20),id(91),id(92),id(93),id(92)]};
 variants.push(branchFixture);
 const rows=(await call('additionalReadingSanads',{action:'list',shaykhId:guestId})).sanads;
 const reopened=rows.find(row=>row.id===branchFixture.id);
 assert.equal(reopened.preparedPeople.tokens.length,5,'reload prepares the branch as well as the first route');
 variants.pop();
 const issue={action:'issue',id:guestId,qariId:'asim',rawi:'حفص',studentName:'طالب تجريبي',completionDate:'2026-11-10'};
 const preview=async(personalSanadIds,tariqNumber='')=>(await call('additionalShaykhs',{...issue,previewOnly:true,personalSanadIds,tariqNumber})).preview;
 const assertOrder=(result,selected)=>{
  assert.deepEqual(result.branches.map(branch=>branch.sourceId),selected);
  let offset=-1;
  for(const branch of result.branches){
   const name=names[ids.indexOf(branch.sourceId)];
   const position=result.chain.indexOf(name);
   assert.ok(position>offset);
   offset=position;
   assert.ok(branch.paths.length&&branch.paths.every(p=>p.some(n=>branch.names[n]===name)));
  }
 };
 await assert.rejects(()=>preview([]));
 await assert.rejects(()=>preview([ids[0],ids[0]]),/مختلفة/);
 await assert.rejects(()=>preview([ids[0],id(999)]),/غير متاح/);
 for(const selected of [ids.slice(0,1),ids.slice(0,2),[...ids].reverse()]){
  const result=await preview(selected);
  assertOrder(result,selected);
  assert.equal(result.chain.split('(ح)').length-1,selected.length-1,'independent incoming sanads reach their meeting before switching');
  assert.equal(result.chain.split('مقدمة تجريبية').length-1,1);
 }
 variants[2].rawi='شعبة';
 await assert.rejects(()=>preview(ids),/غير متاح/);
 variants[2].rawi='حفص';
 variants[2].shaykhId=id(98);
 await assert.rejects(()=>preview(ids),/غير متاح/);
 variants[2].shaykhId=guestId;
 admin=false;
 await assert.rejects(()=>preview(ids),/Permission denied/);
 admin=true;
 assert.match((await preview([guestId,ids[0]])).chain,/شيخ رابع.*الشيخ أَحْمَد/su);
 guest.libraryKubra=true;
 const kubra=await preview(ids.slice(0,2),'1031');
 assertOrder(kubra,ids.slice(0,2));
 assert.ok(kubra.branches.every(branch=>branch.routeId===id(41)));
 assert.equal(sanads.length,0,'preview is read-only');
 const references=[id(50),id(51)],meeting=id(52);
 library.reviewedPersonalGraphs=references.map((id,i)=>({source:{id,kind:'personal',shaykhId:guestId,qariId:'asim',rawi:'حفص',body:''},
  routes:[[{id:meeting,name:'الشيخ مُلْتَقًى'},{id:'teacher-'+i,name:i?'شيخ التتمة الثانية':'شيخ التتمة الأولى'},{id:jazari,name:'الإمام ابن الجزري'}]]}));
 for(let i=0;i<2;i++)Object.assign(variants[i],{sanadText:'كما أخذته عن '+names[i]+'، عن الشيخ مُلْتَقًى',
  personalPersonIds:[id(20+i),meeting],continuationId:references[0]});
 assert.equal((await preview(ids.slice(0,2))).chain.split('شيخ التتمة الأولى').length-1,1,'reviewed shared continuation prints only once');
 variants[1].continuationId=references[1];
 const order=[ids[1],ids[0]],expected=await preview(order);
 assertOrder(expected,order);
 assert.deepEqual(expected.branches.map(b=>b.continuationId),[...references].reverse());
 const {createdCertificateId}=await call('additionalShaykhs',{...issue,personalSanadIds:order});
 const cert=certs.find(row=>row.id===createdCertificateId);
 assert.deepEqual(sanads.find(row=>row.id===cert.sanad).orderedSanads.branches,expected.branches);
 variants.shift();
 await assert.rejects(()=>preview(order),/غير متاح/);
 const snapshot=load('legacy/lib/certificateSnapshot.ts');
 assert.equal((await snapshot.getDraftSanadForCertificate(cert.sanad,owner,cert.id)).chain,expected.chain);
 const style={font:'Amiri',size:9,color:'charcoal'};
 await call('finalizeCertificate',{certificateId:cert.id,printMode:'qr',settings:{borderColor:'#000000',accentColor:'#000000',
  typography:{reading:style,sanad:style,conclusion:style,shaykh:style},phrases:[]}});
 assert.equal(finalized.chain,expected.chain);
 assert.equal(JSON.parse(finalized.formatting).printMode,'number');
 assert.deepEqual(JSON.parse(finalized.formatting).orderedSanads.branches,expected.branches);
 await call('additionalShaykhs',{...issue,personalSanadId:ids[2]});
 assert.equal(sanads.at(-1).orderedSanads,undefined);
 const prepare={holdingId:order[0],holdingIds:order,rawi:'حفص'};
 const personal=(await call('prepareIjazah',{...prepare,previewOnly:true})).preview;
 assertOrder(personal,order);
 const {sanadId}=await call('prepareIjazah',prepare);
 assert.equal((await call('prepareIjazah',prepare)).sanadId,sanadId,'retry reuses identical prepared content');
 assert.equal((await snapshot.getDraftSanadForCertificate(sanadId,owner,'fixture')).chain,personal.chain);
 holdings[0].ownerId=id(98);
 await assert.rejects(()=>call('prepareIjazah',prepare),/غير متاح/);
 console.log('PASS: branched reload, ordered personal and additional sanads, Ṣughrā and Kubrā, reviewed continuations, stale/foreign denial, draft reload and immutable snapshot payload');
}

module.exports=exerciseOrderedSanads;
if(require.main===module)exerciseOrderedSanads().catch(error=>{console.error(error);process.exitCode=1;});
