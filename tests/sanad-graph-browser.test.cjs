const assert=require('node:assert/strict');
const fs=require('node:fs');
const {once}=require('node:events');
const {execFileSync,spawn}=require('node:child_process');
const {chromium}=require('playwright');

(async()=>{
 const route=fs.mkdtempSync('app/sanad-graph-review-');
 const slug=route.slice(4);
 const generated=['AGENTS.md','next-env.d.ts','app/studio/studio.css'].map(path=>({path,content:fs.readFileSync(path)}));
 let server,browser;
 try{
  fs.copyFileSync('tests/fixtures/sanad-graph-review.tsx',route+'/page.tsx');
  let privateGraph;
  if(process.env.ASANEED_PRIVATE_HAFS_FIXTURE){
   const {r,b,identities}=JSON.parse(process.env.ASANEED_PRIVATE_HAFS_FIXTURE);
   const shared=require('../.vercel/shared-bridge-tests/legacy/lib/sharedBridge.js');
   privateGraph=shared.reviewedSharedBridge(b,{version:1,sourceBody:b.body,identities},identities.map(({personId:id})=>({id,archived:false})));
   assert.ok(privateGraph);
   const fixture=fs.readFileSync(route+'/page.tsx','utf8');
   fs.writeFileSync(route+'/page.tsx',fixture.replace('</main>', '<div data-testid="private-hafs"><PersonalSanadInput value={'+JSON.stringify(r.body)+'} personIds={'+JSON.stringify(r.ids)+'} readOnly onApply={()=>{}}/></div></main>'));
  }
  execFileSync(process.execPath,['scripts/build-studio.cjs']);
  const url='http://127.0.0.1:3111/'+slug;
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3111'],{detached:process.platform!=='win32',stdio:'inherit'});
  let html='';
  for(let i=0;i<60&&!html;i++){
   try{const response=await fetch(url);if(response.ok)html=await response.text();}catch{}
   if(!html)await new Promise(resolve=>setTimeout(resolve,250));
  }
  const fixture=html.match(/<script type="application\/json" id="fixture-library">(.*?)<\/script>/)?.[1];
  assert.ok(fixture,'fixture route rendered');
  browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
  const page=await browser.newPage();
  await page.route('**/api/book-builder',request=>request.fulfill({json:{...JSON.parse(fixture),sharedBridgeGraphs:privateGraph?[privateGraph]:[]}}));
  await page.goto(url);
  await page.evaluate(()=>document.fonts.ready);
  const graph=(id)=>page.getByTestId(id).locator('.sanad-graph').last();
  const measure=(g)=>g.evaluate(element=>{
   const origin=element.querySelector('[data-sanad-node]').getBoundingClientRect();
   return [...element.querySelectorAll('[data-sanad-node]')].map(node=>{
    const card=node.querySelector('.narrator-person-card'),r=card.getBoundingClientRect();
    return {x:r.x-origin.x,y:r.y-origin.y,width:r.width,height:r.height,position:card.querySelector('[data-narrator-level]').textContent};
   });
  });
  const arrowGeometry=g=>g.evaluate(element=>{
   const origin=element.querySelector('[data-sanad-node]').getBoundingClientRect();
   return [...element.querySelectorAll('.sanad-graph-junction .sanad-graph-arrow')].map(arrow=>{
    const {x,y,height}=arrow.getBoundingClientRect();
    return [x-origin.x,y-origin.y,height];
   });
  });
  for(const width of [1100,390,320]){
   await page.setViewportSize({width,height:900});
   await graph('reading').locator('[data-sanad-node]').first().waitFor();
   await graph('personal').locator('[data-sanad-node]').first().waitFor();
   const expected=await measure(graph('book'));
   assert.equal(expected.length,6);
   for(const id of ['reading','saved','personal'])assert.deepEqual(await measure(graph(id)),expected,id+' geometry at '+width);
   if(width===1100){
    const arrows=await arrowGeometry(graph('book'));
    assert.ok(arrows[0][0]>arrows[2][0],'first branch is on the right');
    for(const id of ['reading','saved','personal'])assert.deepEqual(await arrowGeometry(graph(id)),arrows);
   }
   assert.equal(await graph('book').evaluate(e=>getComputedStyle(e).direction),'rtl');
   assert.equal(await graph('book').locator('.sanad-graph-junction:visible').count(),width===1100?4:0);
   assert.equal(await graph('book').locator('.sanad-graph-split .sanad-graph-arrow:visible').count(),width===1100?2:0);
   assert.equal(await graph('book').locator('.sanad-graph-merge .sanad-graph-arrow:visible').count(),width===1100?2:0);
   assert.ok(await page.locator('main.zite-app').evaluate(e=>e.scrollWidth<=e.clientWidth));
  }
  const repeated=graph('repeated');
  await repeated.getByRole('button',{name:/المسار ٢/}).click();
  await repeated.getByRole('region',{name:'المسار ٢'}).getByRole('heading',{name:'المسار ٢'}).waitFor();
  assert.equal(await repeated.locator('[data-sanad-node]').count(),3);
  const reading=page.getByTestId('reading'),g=graph('reading');
  await g.getByRole('button',{name:/المسار ٢/}).click();
  assert.deepEqual((await measure(g)).map(n=>n.position),['١','٢','٣','٤','٥']);
  await g.getByRole('button',{name:/طيّ السند/}).click();
  assert.equal(await g.locator('[data-sanad-node]:visible').count(),0);
  await g.getByRole('button',{name:/عرض الرواة/}).click();
  assert.equal(await g.locator('[data-sanad-node]:visible').count(),5);
  await g.getByRole('button',{name:'عرض الكل'}).click();
  await reading.getByRole('button',{name:'تعديل السند',exact:true}).click();
  await reading.locator('[data-sanad-mode=edit]').waitFor();
  await g.locator('[data-sanad-node]').first().waitFor();
  assert.deepEqual(await measure(g),await measure(graph('book')));
  await g.getByRole('button',{name:'تعديل الراوي 1',exact:true}).click();
  assert.ok(await g.getByRole('combobox',{name:'اسم الراوي بصيغة الجر'}).isVisible());
  await reading.getByRole('button',{name:'عرض السند',exact:true}).click();
  assert.equal(await g.getByRole('combobox',{name:'اسم الراوي بصيغة الجر'}).count(),0);
  assert.ok(await graph('book').getByRole('button',{name:'إضافة راوٍ في البداية'}).isVisible());
  await page.setViewportSize({width:1100,height:900});
  const draft=page.getByTestId('draft');
  await draft.getByRole('button',{name:'تعديل السند',exact:true}).click();
  await draft.getByRole('button',{name:'إضافة شيخ موازٍ'}).first().click();
  await draft.getByLabel('التقاء الفرعين').selectOption('saved-2');
  assert.equal(await draft.locator('.sanad-graph-split .sanad-graph-arrow:visible').count(),2);
  assert.equal(await draft.locator('.sanad-graph-merge .sanad-graph-arrow:visible').count(),2);
  if(process.env.ASANEED_PRIVATE_HAFS_FIXTURE){
   const hafs=graph('private-hafs');
   const controls=hafs.getByRole('button',{name:/المسار /});
   await controls.first().waitFor();
   assert.equal(await controls.count(),10);
   for(const width of [1100,390,320]){
    await page.setViewportSize({width,height:900});
    for(let i=0;i<10;i++){
     await controls.nth(i).click();
     const positions=await hafs.locator('[data-narrator-level]').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('data-narrator-level').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)))));
     assert.ok(positions.length>=10&&positions.length<=13);
     assert.deepEqual(positions,positions.map((_,index)=>index+1));
     assert.equal(await hafs.getByText(/شمس الدين محمد بن عمر بن قاسم/).count(),1);
     assert.equal(await hafs.getByText(/إبراهيم الع/).count(),0);
     const names=await hafs.locator('[data-sanad-node] .narrator-person-card p').allTextContents();
     const meeting=names.findIndex(name=>name.includes('شمس الدين محمد بن عمر بن قاسم'));
     assert.match(names[meeting-1],/عبد الرحمن بن شحاذة/);
     assert.match(names[meeting+1],/المرزوقي/);
    }
    await hafs.getByRole('button',{name:'عرض الكل',exact:true}).click();
    assert.ok(await hafs.evaluate(element=>element.scrollWidth<=element.clientWidth));
   }
   console.log('PASS authorized Hafs data: all 10 numbered paths and RTL bounds at three widths');
  }
  console.log('PASS shared sanad geometry, Arabic RTL, branch positions, mobile and editing controls');
 }finally{
  await browser?.close();
  if(server&&server.exitCode===null&&server.signalCode===null){
   const exited=once(server,'exit');
   if(process.platform==='win32')execFileSync('taskkill',['/pid',String(server.pid),'/T','/F']);
   else server.kill('SIGTERM');
   await exited;
  }
  fs.rmSync(route,{recursive:true});
  fs.rmSync('.next/dev/types/app/'+slug,{recursive:true,force:true});
  const validator='.next/dev/types/validator.ts';
  if(fs.existsSync(validator)&&fs.readFileSync(validator,'utf8').includes(slug+'/page'))fs.unlinkSync(validator);
  for(const {path,content} of generated)fs.writeFileSync(path,content);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
