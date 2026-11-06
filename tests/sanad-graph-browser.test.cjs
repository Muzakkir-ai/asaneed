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
  await page.route('**/api/book-builder',request=>request.fulfill({json:JSON.parse(fixture)}));
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
    const gaps=await graph('book').evaluate(element=>{
     const bounds=node=>node.querySelector('.narrator-person-card').getBoundingClientRect();
     const [start,split,end]=[...element.querySelector('.flow-root').children].filter(child=>child.matches('[data-sanad-node], .connected-chain-split'));
     const lanes=[...split.querySelectorAll(':scope > .connected-chain-lane')];
     const laneCards=lanes.map(lane=>[...lane.querySelectorAll('[data-sanad-node]')]);
     const straight=laneCards.find(cards=>cards.length===2);
     return {
      straight:bounds(straight[1]).top-bounds(straight[0]).bottom,
      entry:Math.min(...laneCards.map(cards=>bounds(cards[0]).top))-bounds(start).bottom,
      exit:bounds(end).top-Math.max(...laneCards.map(cards=>bounds(cards.at(-1)).bottom)),
     };
    });
    assert.equal(gaps.entry,gaps.straight,'split has the regular card gap');
    assert.equal(gaps.exit,gaps.straight,'merge has the regular card gap');
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
