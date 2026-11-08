/* Offline screenshot previews of the real Qurra workspace component.
 * Only synthetic records are used; no production credentials or API data.
 * This script starts Next.js locally in the GitHub Actions runner.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {once}=require('node:events');
const {execFileSync,spawn}=require('node:child_process');
const {chromium}=require('playwright');

const output=process.env.ASANEED_VISUAL_PREVIEW_DIR||'artifacts/visual-preview';
const previewRows=[
 {slug:'00-all-ten',label:'ابن الجزري ← القراء العشرة'},
 {slug:'01-jazari-dani',label:'ابن الجزري ← الداني'},
 {slug:'02-dani-seven',label:'الداني ← القراء السبعة'},
 {slug:'03-jazari-three',label:'ابن الجزري ← القراء الثلاثة'},
 {slug:'04-other-seven',label:'مسارات السبعة الأخرى'},
];
const person=(id,name)=>({id,name,display_name:'',archived:false,aliases:[]});
const people=[
 person('jazari','الإمام محمد بن محمد الجزري'),
 person('dani','الحافظ أبو عمرو عثمان بن سعيد الداني'),
 person('shatibi','الإمام القاسم بن فيره الشاطبي'),
 person('bookTeacher','أبو محمد عبد الرحمن'),
 person('beforeDani','أبو داود سليمان'),
 person('afterDani','أبو الفتح فارس'),
 person('other','أبو الحسين المكي'),
 person('threeTeacher','أبو إسحاق البغدادي'),
];
const node=person_id=>({person_id,route_source:false});
const bookParent={
 id:'parent-seven',book_id:'seven',book_chain_id:null,
 kind:'book',title:'سند الكتاب',route_code:'',qari_id:'',rawi:'',
 continuation:'',confirmed:false,archived:false,revision:1,
 branches:[[node('bookTeacher')]],
};
const parentThree={...bookParent,id:'parent-three',book_id:'three',branches:[[]]};
const sevenRoute={...bookParent,id:'route-qalun',kind:'route',book_chain_id:'parent-seven',
 qari_id:'nafi',rawi:'قالون',confirmed:true,title:'طريق قالون',
 branches:[['beforeDani','dani','afterDani'].map(node)]};
const sharedSeven={...sevenRoute,id:'route-warsh-shared',rawi:'ورش',title:'طريق ورش - الإسناد المشترك'};
const otherSeven={...sevenRoute,id:'route-warsh',rawi:'ورش',title:'طريق ورش',
 branches:[['beforeDani','other'].map(node)]};
const threeRoute={...sevenRoute,id:'route-ibnwardan',book_id:'three',book_chain_id:'parent-three',
 qari_id:'abujafar',rawi:'ابن وردان',title:'طريق ابن وردان',
 branches:[[node('threeTeacher')]]};
const library={
 people,
 books:[{id:'seven',title:'الشاطبية',author_id:'shatibi',archived:false},
  {id:'three',title:'الدرة',author_id:'jazari',archived:false}],
 chains:[bookParent,parentThree,sevenRoute,sharedSeven,otherSeven,threeRoute],
 suggestions:[],continuations:{},canManage:true,
 continuationSections:[
  {id:'rawi',title:'CHAIN:nafi:قالون',body:'عن أبي محمد عبد الرحمن، عن أبي موسى عيسى بن مينا بن وردان المدني صاحب الرواية، عن الإمام نافع بن عبد الرحمن المدني صاحب القراءة.'},
  {id:'sahaba',title:'CHAIN:nafi:sahaba',body:'عن أبي جعفر يزيد بن القعقاع، وأبي داود عبد الرحمن بن هرمز، وأخذ هؤلاء عن أبي هريرة، وعبد الله بن عباس، وهما عن أبي بن كعب.'},
  {id:'prophet',title:'CHAIN:nafi:prophet',body:'وَقَرَأَ أُبَيُّ بْنُ كَعْبٍ عَلَى رَسُولِ الله مُحَمَّدِ بْنِ عَبْدِ الله ﷺ.'},
 ],
};

(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const routeDir=fs.mkdtempSync('app/qurra-visual-preview-');
 const slug=path.basename(routeDir);
 const originals=['AGENTS.md','next-env.d.ts','app/studio/studio.css'].map(file=>({
  file,contents:fs.readFileSync(file),
 }));
 let server,browser;
 try{
  fs.copyFileSync('tests/fixtures/qurra-visual-preview.tsx',routeDir+'/page.tsx');
  execFileSync(process.execPath,['scripts/build-studio.cjs'],{stdio:'inherit'});
  const url='http://127.0.0.1:3112/'+slug;
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack',
   '--hostname','127.0.0.1','--port','3112'],{stdio:'inherit'});
  let started=false;
  for(let attempt=0;attempt<120&&!started;attempt++){
   try{const response=await fetch(url);started=response.ok;}catch{}
   if(!started)await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(started,'Next.js local screenshot fixture started');
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
  // Every request stays inside the runner; even the simulated save uses
  // synthetic records and does not reach production Supabase.
  let savedRecord=null;
  await page.route('**/api/book-builder',request=>{
   if(request.request().method()==='POST'){
    const input=JSON.parse(request.request().postData()||'{}');
    if(input.action!=='chain')return request.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Unexpected test action'})});
    savedRecord=input.record;
    const target=library.chains.find(c=>c.id===savedRecord.id);
    if(!target)return request.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'No saved route'})});
    Object.assign(target,savedRecord,{revision:target.revision+1,archived:false});
    return request.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:savedRecord.id})});
   }
   return request.fulfill({status:200,contentType:'application/json',body:JSON.stringify(library)});
  });
  for(const [width,label] of [[1440,'desktop'],[390,'mobile']]){
   await page.setViewportSize({width,height:960});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.getByRole('heading',{name:'مخططات أسانيد القراء'}).waitFor();
   await page.getByTestId('visual-preview-label').waitFor();
   // Wait for the first authenticated-data fixture graph to render and React to
   // hydrate before clicking a tab. Otherwise an early click can be ignored.
   await page.locator('[data-combined-narrator]').first().waitFor();
   const nav=page.locator('nav[aria-label="مراحل مخططات القراء"]');
   for(let i=0;i<previewRows.length;i++){
    const stage=previewRows[i];
    if(i<4)await nav.locator('button').nth(i).click();
    if(i===0){
     await page.getByRole('heading',{name:'ابن الجزري ← القراء العشرة · الطرق المحفوظة'}).waitFor();
     assert.equal(await page.getByLabel('القارئ').count(),0,'Ten-reader overview has no riwayah filters');
    }
    else if(i===1){
     assert.equal(await page.getByLabel('القارئ').count(),0,
      'Shared Jazari-to-Dani view must NOT show reader filters');
     assert.equal(await page.getByLabel('الرواية والطريق').count(),0,
      'Shared Jazari-to-Dani view must NOT show route or riwayah filters');
     await page.getByRole('heading',{name:'السند المشترك: ابن الجزري ← الداني'}).waitFor({timeout:15000});
     await page.getByText('أسانيد محفوظة: ١ · شواهد مصدرية: ٢',{exact:false}).waitFor();
    }else if(i===2||i===3){
     assert.equal(await page.getByLabel('القارئ').count(),1,
      'Reader filters belong only to the reading-specific stages');
     assert.equal(await page.getByLabel('الرواية والطريق').count(),1);
    }
    else{
     await page.locator('details').first().locator('summary').click();
     await page.getByRole('button',{name:'مسارات السبعة الأخرى'}).click();
    }
    await page.locator('[data-combined-narrator]').first().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await nav.locator('button[aria-pressed="true"]').count(),i<4?1:0);
    const target=path.join(output,stage.slug+'-'+label+'.png');
    await page.screenshot({path:target,fullPage:true,animations:'disabled'});
    assert.ok(fs.statSync(target).size>2000,'Screenshot is not empty: '+target);
    console.log('Saved '+target);
   }
  }
  // Test all three lower historical text views, including sources and
  // branch prose, independently of the saved book-chain graph.
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'مخططات أسانيد القراء'}).waitFor();
  await page.locator('[data-combined-narrator]').first().waitFor();
  for(const [kind,label,filename] of [
   ['rawi-imam','الرواة ← الأئمة','06-rawi-imam.png'],
   ['imam-sahaba','الأئمة ← الصحابة','07-imam-sahaba.png'],
   ['sahaba-prophet','الصحابة ← النبي ﷺ','08-sahaba-prophet.png'],
  ]){
   await page.locator('nav[aria-label="تتمات أسانيد القراء"]').getByRole('button',{name:label}).click();
   await page.getByLabel('القارئ في تتمة السند').waitFor();
   assert.equal(await page.getByLabel('القارئ في تتمة السند').count(),1);
   if(kind==='rawi-imam')assert.equal(await page.getByLabel('الراوي في تتمة السند').count(),1);
   else assert.equal(await page.getByLabel('الراوي في تتمة السند').count(),0);
   if(kind==='imam-sahaba'){
    await page.getByText('رسم من علاقات رجال الأسانيد',{exact:false}).waitFor();
    await page.locator('[data-combined-narrator="imam:nafi"]').waitFor();
    await page.locator('[data-combined-narrator="sahabi:ubayy"]').waitFor();
    const graph=page.locator('section[aria-label="السند المتصل"]');
    assert.equal(await graph.locator('[data-sanad-viewport]').count(),1,
     'Imam-to-Companions should use the proper branching diagram, not plain text cards');
    assert.ok(await graph.locator('svg path[data-from][data-to]').count()>4,
     'Multiple teacher and Companion links must be drawn');
    assert.ok(await graph.locator('g[data-routing-part="bus"]').count()>0,
     'The historical five-to-three connections should use a real shared horizontal bus');
    assert.equal(await graph.locator('button[data-sanad-routing-switch]').count(),1,
     'The old line planner remains available as a local rollback');

    assert.equal(await graph.getByText('صحابي',{exact:true}).count()>0,true,
     'Companions are identified in cards');
    // This view is intentionally scrollable rather than being scaled down.
    assert.equal(await graph.locator('button',{hasText:'تكبير لقراءة الأسماء'}).count(),0);
   }else{
    const expected=kind==='rawi-imam'
     ?['rawi:qalun','imam:nafi']
     :['sahabi:ubayy','prophet'];
    for(const id of expected)await page.locator('[data-combined-narrator]').filter({has:page.locator('[data-trace-person="'+id+'"]')}).first().waitFor();
    assert.ok(await page.locator('section[aria-label="السند المتصل"] svg path[data-from][data-to]').count()>0,
     'Each source-backed historical stage draws real narrator connectors');
    await page.getByRole('button',{name:'عرض النص الأصلي'}).waitFor();
    await page.getByRole('button',{name:'عرض النص الأصلي'}).click();
    await page.getByText('النص المحفوظ كما هو (دون تغيير)').waitFor();
   }
   const screenshot=path.join(output,filename);
   await page.screenshot({path:screenshot,fullPage:true,animations:'disabled'});
   assert.ok(fs.statSync(screenshot).size>2000);
  }
  // The selected saved route opens a short ordered-list editor. This tests
  // real narrator identity autocomplete with a synthetic library only.
  await page.setViewportSize({width:1440,height:960});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'مخططات أسانيد القراء'}).waitFor();
  await page.locator('[data-combined-narrator]').first().waitFor();
  await page.locator('nav[aria-label="مراحل مخططات القراء"]').getByRole('button',{name:'الداني ← القراء السبعة'}).click();
  await page.getByRole('button',{name:'تعديل هذا السند'}).click();
  await page.getByRole('heading',{name:'تعديل السند',exact:true}).waitFor();
  let names=page.getByRole('combobox',{name:'اسم الراوي بصيغة الجر'});
  assert.equal(await names.count(),3,'Existing saved path opens with three narrators');
  assert.equal(await names.last().inputValue(),'أبو الفتح فارس','The last saved narrator is retained');
  await page.getByRole('button',{name:'إضافة الراوي التالي'}).click();
  names=page.getByRole('combobox',{name:'اسم الراوي بصيغة الجر'});
  assert.equal(await names.count(),4,'Add-next creates exactly one empty narrator row');
  await names.last().fill('أبو الحسين');
  await page.getByRole('option',{name:/أبو الحسين المكي/}).click();
  assert.equal(await names.last().inputValue(),'أبو الحسين المكي','Existing identity was selected from suggestions');
  await page.evaluate(()=>document.fonts.ready);
  const editorShot=path.join(output,'05-easy-add-narrator-desktop.png');
  await page.screenshot({path:editorShot,fullPage:true,animations:'disabled'});
  assert.ok(fs.statSync(editorShot).size>2000,'Manual edit screenshot generated');
  console.log('PASS simplified editor, canonical narrator suggestions and add-next workflow');
  // Clicking Save posts the SAME stored route ID, leaves the existing
  // parent/book/reading untouched, and refetches the persisted branches.
  await page.getByRole('button',{name:'حفظ التغييرات'}).click();
  await page.locator('[data-combined-narrator="other"]').waitFor({timeout:20000});
  assert.ok(savedRecord,'The save button must submit a route update');
  assert.equal(savedRecord.id,'route-qalun','Existing route ID reused');
  assert.equal(savedRecord.book_chain_id,'parent-seven','Original book chain preserved');
  assert.equal(savedRecord.rawi,'قالون','Original riwayah preserved');
  assert.equal(savedRecord.confirmed,false,'Edited route requires review');
  assert.deepEqual(savedRecord.branches[0].map(node=>node.person_id),
   ['beforeDani','dani','afterDani','other'],'Narrator IDs stored in the reviewed order');
  assert.equal(library.chains.find(c=>c.id==='route-warsh').branches[0].length,2,'Other sanad remains intact');
  console.log('PASS saving changed route is verified by refetch; all other records remain unchanged');
  const summary=[
   '# Asaneed GitHub Actions Visual Preview',
   '',
   'These images were captured from the **actual React components** using',
   'a local Next.js server in GitHub Actions. No Vercel deployment was created.',
   '',
   '**Important:** All displayed narrator records and route connections are',
   'synthetic test fixtures, NOT a screenshot of the private live database.',
   '',
   'Stages: all ten, Ibn al-Jazari to al-Dani, al-Dani to seven readers,',
   'Ibn al-Jazari to three readers, and historical source sections from',
   'the rawi to imam, imam to companions, and companions to Prophet ﷺ.',
   '',
   'Desktop: 1440px. Mobile: 390px. These are view-only screenshots.',
   'The extra desktop screenshot shows the simplified add-next-narrator workflow with identity selection.',
   '',
   'Commit: '+(process.env.GITHUB_SHA||'local'),
   '',
   'Run a new preview from Actions → Asaneed Visual Preview → Run workflow.',
   'No Vercel deployment quota is consumed.',
   '',
  ].join('\n');
  fs.writeFileSync(path.join(output,'README.md'),summary);
  console.log('PASS ten-reader overview and seven historical/reading-stage screenshots');
 }finally{
  await browser?.close();
  if(server&&server.exitCode===null&&server.signalCode===null){
   const done=once(server,'exit');
   server.kill('SIGTERM');
   await done;
  }
  fs.rmSync(routeDir,{recursive:true,force:true});
  fs.rmSync('.next/dev/types/app/'+slug,{recursive:true,force:true});
  const validator='.next/dev/types/validator.ts';
  if(fs.existsSync(validator)&&fs.readFileSync(validator,'utf8').includes(slug+'/page')){
   fs.unlinkSync(validator);
  }
  for(const {file,contents} of originals)fs.writeFileSync(file,contents);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
