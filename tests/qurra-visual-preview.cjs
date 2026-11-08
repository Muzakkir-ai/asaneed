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
const otherSeven={...sevenRoute,id:'route-warsh',rawi:'ورش',title:'طريق ورش',
 branches:[['beforeDani','other'].map(node)]};
const threeRoute={...sevenRoute,id:'route-ibnwardan',book_id:'three',book_chain_id:'parent-three',
 qari_id:'abujafar',rawi:'ابن وردان',title:'طريق ابن وردان',
 branches:[[node('threeTeacher')]]};
const library={
 people,
 books:[{id:'seven',title:'الشاطبية',author_id:'shatibi',archived:false},
  {id:'three',title:'الدرة',author_id:'jazari',archived:false}],
 chains:[bookParent,parentThree,sevenRoute,otherSeven,threeRoute],
 suggestions:[],continuations:{},canManage:true,
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
  // This is the ONLY data supplied to the page. No real Supabase connections.
  await page.route('**/api/book-builder',request=>request.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(library),
  }));
  for(const [width,label] of [[1440,'desktop'],[390,'mobile']]){
   await page.setViewportSize({width,height:960});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.getByRole('heading',{name:'مخططات أسانيد القراء'}).waitFor();
   await page.getByTestId('visual-preview-label').waitFor();
   const nav=page.locator('nav[aria-label="مراحل مخططات القراء"]');
   for(let i=0;i<previewRows.length;i++){
    const stage=previewRows[i];
    await nav.locator('button').nth(i).click();
    await page.locator('[data-combined-narrator]').first().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await nav.locator('button[aria-pressed="true"]').count(),1);
    const target=path.join(output,stage.slug+'-'+label+'.png');
    await page.screenshot({path:target,fullPage:true,animations:'disabled'});
    assert.ok(fs.statSync(target).size>2000,'Screenshot is not empty: '+target);
    console.log('Saved '+target);
   }
  }
  const summary=[
   '# Asaneed GitHub Actions Visual Preview',
   '',
   'These images were captured from the **actual React components** using',
   'a local Next.js server in GitHub Actions. No Vercel deployment was created.',
   '',
   '**Important:** All displayed narrator records and route connections are',
   'synthetic test fixtures, NOT a screenshot of the private live database.',
   '',
   'Stages: Ibn al-Jazari to al-Dani; al-Dani toward seven readers;',
   'Ibn al-Jazari toward three additional readers; other saved seven-reader segments.',
   '',
   'Desktop: 1440px. Mobile: 390px. These are view-only screenshots.',
   '',
   'Commit: '+(process.env.GITHUB_SHA||'local'),
   '',
   'Run a new preview from Actions → Asaneed Visual Preview → Run workflow.',
   'No Vercel deployment quota is consumed.',
   '',
  ].join('\n');
  fs.writeFileSync(path.join(output,'README.md'),summary);
  console.log('PASS local screenshots of all four Qurra stages at two widths');
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
