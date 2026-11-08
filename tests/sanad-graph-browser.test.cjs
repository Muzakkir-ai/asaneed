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
  let privateGraph,combinedPaths;
  if(process.env.ASANEED_PRIVATE_HAFS_FIXTURE){
   const {r,b,identities,qunbul}=JSON.parse(process.env.ASANEED_PRIVATE_HAFS_FIXTURE);
   const shared=require('../.vercel/shared-bridge-tests/legacy/lib/sharedBridge.js');
   privateGraph=shared.reviewedSharedBridge(b,{version:1,sourceBody:b.body,identities},identities.map(({personId:id})=>({id,archived:false})));
   assert.ok(privateGraph);
   assert.equal(r.ids.at(-1),'060652f9-bc67-4fd3-ae14-625a84e0bc08','fixture must use the current Ubaydi endpoint');
   privateGraph.routes=privateGraph.routes.map(path=>[{id:r.ids.at(-1),name:'إبراهيم العُبيدي'},...path]);
   const fixture=fs.readFileSync(route+'/page.tsx','utf8');
   const combined=shared.savedSharedBridgeDiagram(r.body,r.ids,[privateGraph],undefined,{id:'fixture',name:'أُوَيس أحمد حسين مقادم'}).diagram;
   combinedPaths=combined.paths;
   const input=(label,record,preparation)=>'<div data-testid="'+label+'"><PersonalSanadInput issuer={{id:"fixture",name:"الشيخ التجريبي"}} value={'+JSON.stringify(record.body)+'} personIds={'+JSON.stringify(record.ids??[])+'} preparation={'+JSON.stringify(preparation??null)+'} readOnly onApply={()=>{}}/></div>';
   const qunbulPreparation=qunbul?require('../.vercel/shared-bridge-tests/legacy/lib/preparedSanadPeople.js').prepareSavedSanadPeople(qunbul.body):null;
   fs.writeFileSync(route+'/page.tsx',fixture.replace('</main>',input('private-hafs',r)+(qunbul?input('private-qunbul',qunbul,qunbulPreparation):'')+'<div data-testid="combined-hafs"><CombinedSanadView groupJazariStudents paths={'+JSON.stringify(combined.paths)+'} renderPerson={(id,positions)=><BranchPersonCard name={('+JSON.stringify(combined.names)+')[id]} number={positions[0]??null} secondaryNumbers={positions.slice(1)}/>} /></div></main>'));
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
  const assertAligned=(actual,expected,context)=>{
   assert.equal(actual.length,expected.length,context+' node count');
   for(let i=0;i<expected.length;i++){
    assert.equal(actual[i].position,expected[i].position,context+' saved narrator position '+i);
    assert.ok(Math.abs(actual[i].x-expected[i].x)<=1,context+' card column '+i);
    assert.ok(Math.abs(actual[i].width-expected[i].width)<=1,context+' card width '+i);
    assert.ok(Math.abs(actual[i].y-expected[i].y)<=16,context+' row alignment '+i);
   }
  };
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
   for(const id of ['reading','saved','personal'])assertAligned(await measure(graph(id)),expected,id+' geometry at '+width);
   if(width===1100){
    const arrows=await arrowGeometry(graph('book'));
    assert.ok(arrows[0][0]>arrows[2][0],'first branch is on the right');
    for(const id of ['reading','saved','personal']){
     const other=await arrowGeometry(graph(id));
     assert.equal(other.length,arrows.length,id+' arrow count');
     for(let i=0;i<arrows.length;i++){
      assert.ok(Math.abs(other[i][0]-arrows[i][0])<=1,id+' arrow column '+i);
      assert.ok(Math.abs(other[i][1]-arrows[i][1])<=16,id+' arrow row '+i);
     }
    }
   }
   assert.equal(await graph('book').evaluate(e=>getComputedStyle(e).direction),'rtl');
   assert.equal(await graph('book').locator('.sanad-graph-junction:visible').count(),width===1100?4:0);
   assert.equal(await graph('book').locator('.sanad-graph-split .sanad-graph-arrow:visible').count(),width===1100?2:0);
   assert.equal(await graph('book').locator('.sanad-graph-merge .sanad-graph-arrow:visible').count(),width===1100?2:0);
   assert.ok(await page.locator('main.zite-app').evaluate(e=>e.scrollWidth<=e.clientWidth));
  }
  // Straight connections are preferable whenever card interiors share an
  // unobstructed vertical corridor. An intervening card still forces a bypass.
  const straightCases=page.getByTestId('straight-port-regression');
  for(const [attribute,description] of [
   ['data-adjacent','near-aligned adjacent narrators'],
   ['data-long-clear','unobstructed long continuation'],
  ]){
   const path=await straightCases.getAttribute(attribute);
   assert.match(path,/^M-?[\d.]+ -?[\d.]+ V-?[\d.]+$/,description+' must be one vertical segment');
  }
  assert.match(await straightCases.getAttribute('data-long-blocked'),/H-?[\d.]+/,
   'an intervening narrator card must keep a real bypass');

  // A natural side departure is allowed when the narrator cards are
  // separated horizontally; arrowheads still enter the next narrator safely.
  const sideCases=page.getByTestId('side-edge-regression');
  for(const [attribute,expectedX,description] of [
   ['data-right',216,'right side of the source narrator'],
   ['data-left',344,'left side of the source narrator'],
  ]){
   const path=await sideCases.getAttribute(attribute);
   const match=path?.match(/^M(-?[\d.]+) (-?[\d.]+)/);
   assert.ok(match,'valid connector path for '+description);
   assert.ok(Math.abs(Number(match[1])-expectedX)<.1,description+' rather than a bottom exit: '+path);
   assert.match(path,/ H-?[\d.]+ V-?[\d.]+$/,description+' uses a clean one-bend path');
  }

  // Always check the reported branch shapes, even without a private Hafs fixture.
  const regression=page.getByTestId('combined-regression');
  const regressionPaths=[
   ['jazari','uqabi','ibnGhanim','ibnShuhadha','end'],
   ['jazari','nuwayri','umyuti','samdasi','ibnShuhadha','end'],
   ['jazari','umyuti','samdasi','ibnShuhadha','end'],
  ];
  const expectedRegressionEdges=[...new Set(regressionPaths.flatMap(path=>path.slice(1).map((to,i)=>JSON.stringify([path[i],to]))))].sort();
  for(const width of [1100,390,320]){
   await page.setViewportSize({width,height:900});
   const actualEdges=await regression.locator('path[data-from]').evaluateAll(edges=>edges.map(edge=>JSON.stringify([edge.dataset.from,edge.dataset.to])).sort());
   assert.deepEqual(actualEdges,expectedRegressionEdges,'saved links at '+width);
   assert.equal(await regression.locator('[data-combined-narrator]').count(),new Set(regressionPaths.flat()).size);
   const tracePlacements=await regression.locator('[data-combined-narrator]').evaluateAll(cards=>cards.map(card=>{
    const circle=card.querySelector('[data-narrator-level]');
    const control=card.querySelector('[data-trace-person]');
    const article=card.querySelector('.narrator-person-card');
    const badgeRow=card.querySelector('[aria-label="درجات الراوي الأخرى"]');
    if(!circle||!control||!article)throw Error('Missing trace control or main number');
    const c=circle.getBoundingClientRect(),b=control.getBoundingClientRect(),a=article.getBoundingClientRect();
    const style=getComputedStyle(control);
    return {
     horizontalOffset:Math.abs((c.left+c.right)/2-(b.left+b.right)/2),
     gapBelowNumber:b.top-c.bottom,
     iconSmaller:b.width<c.width&&b.height<c.height,
     numberSize:[c.width,c.height],iconSize:[b.width,b.height],
     computed:{height:style.height,minHeight:style.minHeight,maxHeight:style.maxHeight,padding:style.padding,boxSizing:style.boxSizing,inlineHeight:control.style.height,offsetHeight:control.offsetHeight,classes:control.className},
     insideCard:b.bottom<=a.bottom+1,
     beforeSecondary:!badgeRow||b.bottom<=badgeRow.getBoundingClientRect().top+1,
    };
   }));
   for(const position of tracePlacements){
    assert.ok(position.horizontalOffset<=2,'trace icon centered beneath number at '+width+': '+JSON.stringify(position));
    assert.ok(position.gapBelowNumber>=-0.5,'trace icon stays below number at '+width);
    assert.ok(position.iconSmaller,'trace icon smaller than main number: '+JSON.stringify(position));
    assert.ok(position.insideCard&&position.beforeSecondary,'trace icon must not overlap route badges at '+width);
   }
   const collisions=await regression.evaluate(section=>{
    const graph=section.querySelector('[data-sanad-viewport]');
    const cards=[...graph.querySelectorAll('[data-combined-narrator]')];
    return [...graph.querySelectorAll('path[data-from]')].flatMap(edge=>{
     const total=edge.getTotalLength();
     return cards.filter(card=>{
      if([edge.dataset.from,edge.dataset.to].includes(card.dataset.combinedNarrator))return false;
      for(let distance=0;distance<=total;distance+=3){
       const {x,y}=edge.getPointAtLength(distance);
       if(x>card.offsetLeft&&x<card.offsetLeft+card.offsetWidth&&y>card.offsetTop&&y<card.offsetTop+card.offsetHeight)return true;
      }
      return false;
     }).map(card=>[edge.dataset.from,edge.dataset.to,card.dataset.combinedNarrator]);
    });
   });
   assert.deepEqual(collisions,[],'unrelated narrator cards remain clear at '+width);
   if(process.env.ASANEED_SANAD_REVIEW_SCREENSHOTS){
    await regression.screenshot({style:'nextjs-portal { display: none !important; }',path:process.env.ASANEED_SANAD_REVIEW_SCREENSHOTS+'/sanad-regression-'+width+'.png'});
   }
  }
  // SVG markers must use fixed coordinates: thicker highlighted lines must
  // never enlarge the arrowhead at a narrator junction.
  const marker=regression.locator('marker').first();
  assert.equal(await marker.getAttribute('markerUnits'),'userSpaceOnUse','highlighting cannot scale arrowheads');
  assert.equal(await marker.getAttribute('markerWidth'),'7');
  assert.equal(await marker.getAttribute('markerHeight'),'7');
  const routeEdge=regression.locator('path[data-from="jazari"][data-to="uqabi"]');
  assert.equal(await routeEdge.getAttribute('stroke-width'),'1','ordinary connector weight');
  await regression.getByText('تفاصيل فروع السند',{exact:true}).click();
  assert.equal(await regression.getByLabel('عرض المسارات').locator('option').count(),3,'three source routes are shown as two display groups plus show-all');
  assert.match(await regression.getByLabel('عرض المسارات').locator('option[value="0"]').innerText(),/٢ فروع متقاربة/,'two short variants occupy one displayed route');
  await regression.getByLabel('عرض المسارات').selectOption('0');
  assert.equal(await routeEdge.getAttribute('stroke-width'),'2','route highlighting only bolds the line');
  assert.equal(await marker.getAttribute('markerWidth'),'7','route highlighting preserves arrowhead dimensions');
  assert.equal(await regression.locator('path[data-from]').count(),7,'selection retains all seven actual edges from the grouped variants');
  assert.equal(await regression.locator('path[data-from="jazari"][data-to="nuwayri"]').count(),0,'an unrelated group stays hidden');
  await regression.getByLabel('عرض المسارات').selectOption('');
  const traceIcon=regression.locator('[data-trace-person="umyuti"]');
  assert.equal(await traceIcon.innerText(),'','the trace control is icon-only');
  assert.equal(await traceIcon.getAttribute('aria-label'),'تتبّع اتصالات الراوي','the trace control keeps an accessible name');
  assert.equal(await traceIcon.locator('svg').count(),1,'the icon is rendered');
  await traceIcon.click();
  assert.equal(await regression.locator('path[data-from="umyuti"][data-to="samdasi"]').getAttribute('stroke-width'),'2','trace highlighting only bolds the line');
  assert.equal(await marker.getAttribute('markerHeight'),'7','trace highlighting keeps arrowheads the same height');
  assert.equal(await regression.locator('path[data-from][opacity="1"]').count(),3,'trace shows the selected narrator’s direct connections');
  await regression.getByRole('button',{name:'إلغاء التحديد'}).click();
  const unlabelled=page.getByTestId('combined-no-labels');
  await unlabelled.getByText('تفاصيل فروع السند',{exact:true}).click();
  await unlabelled.getByLabel('عرض المسارات').selectOption('0');
  assert.equal(await unlabelled.locator('path[data-from]').count(),7,'selection shows all grouped branches, even without route labels');
  const invalid=page.getByTestId('combined-invalid');
  assert.ok(await invalid.getByText(/تعذر تكوين رسم واحد/).isVisible(),'cyclic graphs must explain the fallback');
  assert.equal(await invalid.locator('.narrator-person-card').count(),4,'all saved occurrences remain visible on invalid paths');

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
  assertAligned(await measure(g),await measure(graph('book')),'editing restores saved graph columns');
  await g.getByRole('button',{name:'تعديل الراوي 1',exact:true}).click();
  assert.ok(await g.getByRole('combobox',{name:'اسم الراوي بصيغة الجر'}).isVisible());
  await reading.getByRole('button',{name:'عرض السند',exact:true}).click();
  assert.equal(await g.getByRole('combobox',{name:'اسم الراوي بصيغة الجر'}).count(),0);
  assert.ok(await graph('book').getByRole('button',{name:'إضافة راوٍ في البداية'}).isVisible());
  await page.setViewportSize({width:1100,height:900});
  const draft=page.getByTestId('draft');
  await draft.getByRole('button',{name:'تعديل السند',exact:true}).click();
  // The current editor explicitly creates a branch first; it renders split
  // and merge arrows only after the alternate narrator has been selected.
  await draft.locator('[aria-label="إضافة فروع السند"]').getByRole('button',{name:'إضافة فرع',exact:true}).click();
  const branchMeeting=draft.getByLabel('نقطة التقاء الفرع ١');
  await branchMeeting.selectOption('saved-2');
  assert.equal(await branchMeeting.inputValue(),'saved-2','new branch retains its reviewed meeting point');
  assert.equal(await draft.getByRole('region',{name:'تحرير الفرع ١'}).count(),1,'branch editor opens');
  if(process.env.ASANEED_PRIVATE_HAFS_FIXTURE){
   const reading=page.getByTestId('private-hafs');
   await reading.getByRole('tab',{name:'السند الشخصي',exact:true}).waitFor();
   assert.equal(await reading.getByRole('tab',{name:'السند الشخصي',exact:true}).getAttribute('aria-selected'),'true');
   const personal=reading.getByRole('tabpanel');
   await personal.getByRole('button',{name:/المسار ٢/}).waitFor();
   assert.equal(await personal.getByRole('button',{name:/المسار /}).count(),2);
   assert.equal(await personal.locator('[data-sanad-node]').last().getByText(/إبراهيم الع/).count(),1);
   assert.equal(await personal.locator('[data-sanad-node]').getByText(/الجَزَرِي|بن شحاذة/).count(),0);
   await reading.getByRole('tab',{name:'السند المتصل الكامل'}).click();
   const hafs=graph('private-hafs');
   const controls=hafs.getByRole('button',{name:/المسار /});
   await controls.first().waitFor();
   assert.equal(await controls.count(),10);
   for(const width of [1100,390,320]){
    await page.setViewportSize({width,height:900});
    for(let i=0;i<10;i++){
     await controls.nth(i).click();
     const positions=await hafs.locator('[data-narrator-level]').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('data-narrator-level').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)))));
     assert.ok(positions.length===combinedPaths[i].length);
     assert.deepEqual(positions,positions.map((_,index)=>index+1));
     assert.equal(await hafs.getByText(/شمس الدين محمد بن عمر بن قاسم/).count(),1);
     assert.equal(await hafs.getByText(/إبراهيم الع/).count(),1);
     const names=await hafs.locator('[data-sanad-node] .narrator-person-card p').allTextContents();
     const meeting=combinedPaths[i].indexOf('060652f9-bc67-4fd3-ae14-625a84e0bc08');
     assert.match(names[meeting-4],/عبد الرحمن بن شحاذة/);
     assert.match(names[meeting-3],/شمس الدين محمد بن عمر بن قاسم/);
     assert.match(names[meeting-2],/أحمد بن رجب/);
     assert.match(names[meeting-1],/الأَجهُور/);
     assert.match(names[meeting+1],/المرزوقي/);
    }
    await hafs.getByRole('button',{name:'عرض الكل',exact:true}).click();
    assert.ok(await hafs.evaluate(element=>element.scrollWidth<=element.clientWidth));
   }
   await reading.getByRole('tab',{name:'السند الشخصي',exact:true}).click();
   assert.equal(await reading.getByRole('tabpanel').getByRole('button',{name:/المسار /}).count(),2);
   const qunbul=page.getByTestId('private-qunbul');
   if(await qunbul.count()){
    assert.equal(await qunbul.getByRole('tab',{name:'السند الشخصي',exact:true}).getAttribute('aria-selected'),'true');
    assert.ok(await qunbul.getByRole('tabpanel').getByText(/إبراهيم العُبَيدِي/).count());
    await qunbul.getByRole('tab',{name:'السند المتصل الكامل'}).click();
    assert.ok(await qunbul.getByRole('tabpanel').getByText(/لا يمكن عرض السند الكامل/).isVisible());
   }
   const combined=page.getByTestId('combined-hafs');
   const expectedEdges=[...new Set(combinedPaths.flatMap(path=>path.slice(1).map((to,i)=>JSON.stringify([path[i],to]))))].sort();
   const actualEdges=await combined.locator('[data-from]').evaluateAll(edges=>edges.map(edge=>JSON.stringify([edge.dataset.from,edge.dataset.to])).sort());
   assert.deepEqual(actualEdges,expectedEdges);
   const collisions=await combined.evaluate(graph=>{
    const cards=[...graph.querySelectorAll('[data-combined-narrator]')];
    return [...graph.querySelectorAll('path[data-from]')].flatMap(edge=>{
     const length=edge.getTotalLength();
     return cards.filter(card=>{
      if([edge.dataset.from,edge.dataset.to].includes(card.dataset.combinedNarrator))return false;
      const left=card.offsetLeft,top=card.offsetTop;
      for(let d=0;d<=length;d+=3){
       const {x,y}=edge.getPointAtLength(d);
       if(x>left&&x<left+card.offsetWidth&&y>top&&y<top+card.offsetHeight)return true;
      }
      return false;
     }).map(card=>card.dataset.combinedNarrator);
    });
   });
   assert.deepEqual(collisions,[],'connectors avoid unrelated narrator cards');
   for(const [node,port] of [['from','start'],['to','end']]){
    const ports=await combined.locator('[data-from]').evaluateAll((edges,[node,port])=>edges.map(edge=>JSON.stringify([edge.dataset[node],edge.dataset[port]])),[node,port]);
    assert.equal(new Set(ports).size,ports.length,'each edge has a separate card port');
   }
   assert.equal(await combined.locator('[data-combined-narrator]').count(),new Set(combinedPaths.flat()).size);
   assert.equal(await combined.getByText('أصحاب ابن الجزري',{exact:true}).count(),0);
   assert.equal(await combined.getByText('أعلى سند',{exact:false}).count(),0);
   const cardPositions=await combined.locator('[data-combined-narrator]').evaluateAll(cards=>Object.fromEntries(cards.map(card=>[
    card.dataset.combinedNarrator,[...card.querySelectorAll('[data-narrator-level],[data-narrator-secondary-level]')].map(circle=>Number(circle.textContent.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))))
   ])));
   for(const id of new Set(combinedPaths.flat())){
    const expected=[...new Set(combinedPaths.filter(path=>path.includes(id)).map(path=>path.indexOf(id)+1))].sort((a,b)=>a-b);
    assert.deepEqual(cardPositions[id],expected);
   }
   await combined.getByText('تفاصيل فروع السند',{exact:true}).click();
   await combined.getByLabel('عرض المسارات').selectOption('9');
   assert.deepEqual(await combined.locator('[data-from][opacity="1"]').evaluateAll(edges=>edges.map(edge=>JSON.stringify([edge.dataset.from,edge.dataset.to])).sort()),combinedPaths[9].slice(1).map((to,i)=>JSON.stringify([combinedPaths[9][i],to])).sort());
   await combined.getByLabel('عرض المسارات').selectOption('');
   if(process.env.ASANEED_COMBINED_SCREENSHOTS){
    for(const width of [1100,390,320]){
     await page.setViewportSize({width,height:900});
     if(width<500){
      const viewport=combined.locator('[data-sanad-viewport]');
      await combined.getByRole('button',{name:'تكبير لقراءة الأسماء'}).click();
      assert.ok(await viewport.evaluate(element=>element.scrollWidth>element.clientWidth));
      await combined.getByRole('button',{name:'عرض الرسم كاملًا'}).click();
      assert.ok(await viewport.evaluate(element=>element.scrollWidth<=element.clientWidth+1));
     }
     await combined.screenshot({style:'nextjs-portal { display: none !important; }',path:process.env.ASANEED_COMBINED_SCREENSHOTS+'/combined-hafs-'+width+'.png'});
    }
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
