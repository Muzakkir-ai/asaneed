const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {spawn,execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const output=process.env.ASANEED_EXPLORER_SCREENSHOTS||'../sanad-hub-review';
(async()=>{
 const directory=fs.mkdtempSync('app/sanad-explorer-review-'),root=path.resolve('.'),url='http://127.0.0.1:3116/'+path.basename(directory);
 let browser,server;
 try{
  fs.copyFileSync('tests/fixtures/sanad-explorer-review.tsx',directory+'/page.tsx');
  execFileSync(process.execPath,['scripts/build-studio.cjs']);
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3116'],{stdio:'inherit'});
  let ready=false;for(let i=0;i<90&&!ready;i++){if(server.exitCode!==null)break;try{ready=(await fetch(url,{signal:AbortSignal.timeout(1500)})).ok;}catch{}if(!ready)await new Promise(r=>setTimeout(r,300));}
  assert.ok(ready,'fixture started');
  const prefix=fs.readFileSync('tests/qurra-visual-preview.cjs','utf8').split('(async()=>{')[0];
  const library=vm.runInNewContext(prefix+'; library',{require,process});
  library.people.push({id:'teacher',name:'الشيخ التجريبي الأول',display_name:'',archived:false});
  library.sharedBridgeGraphs=[{source:{id:'shared',title:'مصدر تجريبي',body:''},routes:[[{id:'teacher',name:'الشيخ التجريبي الأول'},{id:'jazari',name:'الإمام محمد بن محمد الجزري'}]],unresolved:[]}];
  const guest={id:'guest',name:'الشيخ التجريبي',personalChain:'كما أخذته عن الشيخ التجريبي الأول، عن الإمام محمد بن محمد الجزري',personalPersonIds:[],kubraPersonalChain:'',kubraPersonalPersonIds:[],readings:[{qariId:'asim',rawi:'حفص'}],sharedSughraSanad:true};
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.route('**/api/book-builder',route=>route.fulfill({json:library}));
  const requests=[];
  await page.route('**/api/workspace/*',route=>{const endpoint=route.request().url().split('/').at(-1),input=route.request().postDataJSON();requests.push({endpoint,input});return route.fulfill({json:endpoint==='additionalShaykhs'?{sheikhs:[guest]}:endpoint==='additionalReadingSanads'?{sanads:[]}:endpoint==='sanadSections'?{sections:[]}:endpoint==='narratorDirectory'?{people:[],links:0,sections:0}:{}});});
  await page.goto(url);
  await page.getByRole('heading',{name:'الأسانيد ورجالها',exact:true}).waitFor();
  const tabs=page.getByRole('tablist',{name:'أقسام الأسانيد'});
  assert.equal(await tabs.getByRole('tab').count(),3);
  assert.equal(await page.locator('aside').getByRole('button',{name:'الأسانيد ورجالها',exact:true}).count(),1);
  assert.equal(await page.locator('aside').getByRole('button',{name:'مخططات أسانيد القراء',exact:true}).count(),0);
  await tabs.getByRole('tab',{name:'أسانيد القراء',exact:true}).click();
  await page.getByRole('list',{name:'مسار السند المختار'}).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('view'),'qurra');
  await page.getByRole('button',{name:'جميع الروابط',exact:true}).click();
  await page.locator('[data-combined-narrator]').first().waitFor();
  const curved=await page.locator('[data-visible-connector]').evaluateAll(nodes=>nodes.filter(node=>node.getAttribute('d').includes('Q')).length);
  assert.ok(curved>0,'overview actually renders rounded connectors');
  await page.locator('[data-trace-person="bookTeacher"]').click();
  assert.ok(await page.locator('[data-focused-edge]').count()>=3,'trace highlights the complete saved route beyond adjacent edges');
  await tabs.getByRole('tab',{name:'أسانيد المشايخ',exact:true}).click();
  await page.getByRole('list',{name:'مسار السند المختار'}).waitFor();
  assert.equal(await page.getByRole('list',{name:'مسار السند المختار'}).getByText('الشيخ التجريبي',{exact:true}).count(),1);
  await page.getByTestId('diagram-sanad-text-preview').locator('summary').click();
  await page.getByText('عن الشيخ التجريبي، عن الشيخ التجريبي الأول، عن الإمام محمد بن محمد الجزري',{exact:true}).waitFor();
  fs.mkdirSync(output,{recursive:true});
  await page.screenshot({path:path.join(output,'hub-desktop.png'),fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'فتح قائمة التنقل',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'الأسانيد ورجالها',exact:true}).waitFor();
  await page.getByRole('dialog').getByRole('button',{name:'الأسانيد ورجالها',exact:true}).click();
  await page.screenshot({path:path.join(output,'hub-mobile.png'),fullPage:true,animations:'disabled'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'hub fits mobile width');
  await page.getByRole('button',{name:'تبديل الصلاحية التجريبية'}).click();
  assert.equal(await tabs.getByRole('tab',{name:'أسانيد المشايخ',exact:true}).count(),0,'non-admin view keeps existing source permissions');
  await page.reload();
  await tabs.getByRole('tab',{name:'أسانيد المشايخ',exact:true,selected:true}).waitFor();
  assert.ok(requests.every(({input})=>!input.action||input.action==='list'),'no application writes during browsing');
  console.log('PASS single hub entry, shared tabs, saved URL reopen, exact shaykh route/text, rounded real edges, full-route trace, mobile width and source permissions');
 }finally{
  await browser?.close();if(server&&server.exitCode===null){server.kill();await new Promise(r=>setTimeout(r,400));}
  const target=path.resolve(directory);if(!target.startsWith(root+path.sep))throw Error('Unsafe cleanup');fs.rmSync(target,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
