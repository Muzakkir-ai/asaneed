const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync,spawn}=require('node:child_process');
const {chromium}=require('playwright');

(async()=>{
 const temp=fs.mkdtempSync('app/certificate-layout-review-');
 const slug=temp.slice(4),url='http://127.0.0.1:3112/'+slug;
 const qiraatDir=temp+'-qiraat';
 const qiraatUrl=url+'-qiraat';
 let server,browser;
 try{
  fs.copyFileSync('tests/fixtures/certificate-layout-review.tsx',temp+'/page.tsx');
  fs.mkdirSync(qiraatDir,{recursive:true});
  fs.copyFileSync('tests/fixtures/certificate-qiraat-layout-review.tsx',qiraatDir+'/page.tsx');
  execFileSync(process.execPath,['scripts/build-studio.cjs']);
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3112'],
   {detached:process.platform!=='win32',stdio:'inherit'});
  let html='';
  for(let i=0;i<90&&!html;i++){
   try{const res=await fetch(url);if(res.ok)html=await res.text();}catch{}
   if(!html)await new Promise(resolve=>setTimeout(resolve,300));
  }
  assert.ok(html,'synthetic certificate fixture served');
  const source=html.match(/<script[^>]*id="certificate-review-data"[^>]*>(.*?)<\/script>/)?.[1];
  assert.ok(source,'certificate fixture preview JSON rendered');
  const mock=JSON.parse(source);
  browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
  const page=await browser.newPage({viewport:{width:1440,height:980}});
  const changes=[];
  let settings=null;
  await page.route('**/api/workspace/certificateDraftPreview',request=>{
   let formatted=JSON.parse(mock.formatting);
   if(settings)formatted={...formatted,settings:settings.settings,draftPrintMode:settings.printMode};
   request.fulfill({json:{...mock,formatting:JSON.stringify(formatted)}});
  });
  await page.route('**/api/workspace/certificateDraftFormatting',async request=>{
   const input=request.request().postDataJSON();
   changes.push(input);
   if(input.action==='save')settings={settings:input.settings,printMode:input.printMode};
   if(input.action==='reset')settings=null;
   await request.fulfill({json:{saved:input.action==='save'}});
  });
  await page.goto(url);
  await page.locator('.print-area .certificate-footer').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  const panel=page.locator('.certificate-settings-panel').first();
  await panel.locator('summary').click();
  const title=page.locator('.certificate-header-art');
  const footer=page.locator('.print-area .certificate-footer');
  const titleBefore=await title.boundingBox();
  const footerBefore=await footer.boundingBox();
  const titleOffset=page.getByRole('spinbutton',{name:'رفع أو خفض عنوان الإجازة',exact:true});
  const footerOffset=page.getByRole('spinbutton',{name:'رفع أو خفض الختم ومعلومات المجيز',exact:true});
  await titleOffset.fill('3');
  await titleOffset.blur();
  const titleAfter=await title.boundingBox();
  assert.ok(titleBefore&&titleAfter&&titleAfter.y>titleBefore.y+3,
   'title, basmalah and reading SVG move downward as one group');
  await footerOffset.fill('-4');
  await footerOffset.blur();
  const footerAfter=await footer.boundingBox();
  assert.ok(footerBefore&&footerAfter&&footerBefore.y-footerAfter.y>3,
   'issuer footer, stamp, signature, date and registration move upward together');
  await page.getByLabel('جزء الشهادة').selectOption('reading');
  const advancedMatn=panel.locator('[data-testid="matn-heading-advanced"]');
  assert.equal(await advancedMatn.evaluate(node=>node.open),false,'matn complex options start collapsed');
  if(process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS)
   await panel.screenshot({path:process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS+'/certificate-matn-basic-controls.png'});
  await advancedMatn.locator('summary').click();
  const headingControl=page.getByRole('spinbutton',{name:'المسافة بعد السند',exact:true});
  await headingControl.fill('6');
  await headingControl.blur();
  const headingValue=await headingControl.inputValue();
  assert.equal(Number(headingValue),6,'Matn spacing control works in certificate viewer');
  await page.getByLabel('جزء الشهادة').selectOption('conclusion');
  const offsetControl=page.getByRole('spinbutton',{name:'رفع أو خفض الخاتمة',exact:true});
  const before=await page.locator('[data-matn-section="conclusion"]').boundingBox();
  await offsetControl.fill('5');
  await offsetControl.blur();
  const after=await page.locator('[data-matn-section="conclusion"]').boundingBox();
  assert.ok(before&&after&&after.y>before.y+10,'khatima moves down in document flow');
  await page.getByRole('button',{name:'حفظ تنسيق هذه الشهادة'}).click();
  assert.equal(changes.at(-1)?.action,'save','draft Save sends only print settings');
  assert.equal(changes.at(-1)?.settings?.matnHeading?.sectionGapAfterSanadMm,6,
   'new section gap persists in certificate-specific settings');
  assert.equal(changes.at(-1)?.settings?.matnHeading?.conclusionOffsetMm,5,
   'khatima offset persists in certificate-specific settings');
  assert.equal(changes.at(-1)?.settings?.headingOffsetMm,3,
   'qiraat and matn heading vertical position is saved on this certificate');
  assert.equal(changes.at(-1)?.settings?.footerOffsetMm,-4,
   'mujaaz issuer/footer vertical position is saved on this certificate');
  assert.ok(!changes.some(change=>change.action==='finalize'),'saving never triggers final approval');

  if(process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS){
   const out=process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS;
   await page.locator('.print-area').screenshot({path:out+'/certificate-print-desktop.png'});
   await panel.screenshot({path:out+'/certificate-tanseeq-controls.png'});
  }

  await page.reload();
  await page.locator('.certificate-settings-panel').first().locator('summary').click();
  assert.equal(Number(await page.getByRole('spinbutton',{name:'رفع أو خفض عنوان الإجازة',exact:true}).inputValue()),3,
   'saved title shift survives a browser refresh');
  assert.equal(Number(await page.getByRole('spinbutton',{name:'رفع أو خفض الختم ومعلومات المجيز',exact:true}).inputValue()),-4,
   'saved stamp/footer shift survives a browser refresh');
  await page.getByRole('button',{name:'استعادة تنسيق النظام'}).click();
  assert.equal(changes.at(-1)?.action,'reset','restore uses separate non-final action');
  await page.waitForFunction(()=>
   document.querySelector('input[aria-label="رفع أو خفض عنوان الإجازة"]')?.value==='0'
   && document.querySelector('input[aria-label="رفع أو خفض الختم ومعلومات المجيز"]')?.value==='0',
   {timeout:10000});

  assert.equal(Number(await page.getByRole('spinbutton',{name:'رفع أو خفض عنوان الإجازة',exact:true}).inputValue()),0,
   'restoring system design resets title height to default');
  assert.equal(Number(await page.getByRole('spinbutton',{name:'رفع أو خفض الختم ومعلومات المجيز',exact:true}).inputValue()),0,
   'restoring system design resets mujeez position to automatic baseline');
  await page.getByLabel('جزء الشهادة').selectOption('conclusion');
  assert.equal(Number(await page.getByRole('spinbutton',{name:'رفع أو خفض الخاتمة',exact:true}).inputValue()),0,
   'system restore clears this certificate-specific khatima adjustment');
  await page.setViewportSize({width:390,height:844});
  if(process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS){
   await page.locator('.print-area').screenshot({
    path:process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS+'/certificate-print-mobile.png'
   });
  }
  // Exercise the ACTUAL qira'at title artwork (basmalah, ijazah.svg and
  // riwayah SVG glyphs). The earlier fixture covers only a matn heading.
  const qHtml=await (await fetch(qiraatUrl)).text();
  const qData=qHtml.match(new RegExp('<script[^>]*id="certificate-review-data"[^>]*>(.*?)</script>'))?.[1];
  assert.ok(qData,'qiraat fixture provides source-bound draft preview');
  const qMock=JSON.parse(qData);
  const qPage=await browser.newPage({viewport:{width:1440,height:900}});
  try{
   let qSaved=null;
   const qChanges=[];
   await qPage.route('**/api/workspace/certificateDraftPreview',request=>{
    const formatting=JSON.parse(qMock.formatting);
    if(qSaved)formatting.settings=qSaved;
    request.fulfill({json:{...qMock,formatting:JSON.stringify(formatting)}});
   });
   await qPage.route('**/api/workspace/certificateDraftFormatting',request=>{
    const input=request.request().postDataJSON();
    qChanges.push(input);
    qSaved=input.action==='reset'?null:input.settings;
    request.fulfill({json:{saved:input.action==='save'}});
   });
   const qiraatDraftReady=qPage.waitForResponse(response=>
    response.url().includes('/api/workspace/certificateDraftPreview')&&response.status()===200);
   await qPage.goto(qiraatUrl);
   await qiraatDraftReady;
   await qPage.evaluate(()=>document.fonts.ready);
   await qPage.waitForTimeout(200); // settle ResizeObserver-driven print geometry
   const artwork=qPage.locator('.certificate-header-art');
   await artwork.locator('.certificate-ijazah-svg').waitFor();
   await artwork.locator('.certificate-basmalah-svg').waitFor();
   await artwork.locator('.certificate-reading-svg-line').waitFor();
   // Always measure positions RELATIVE TO THE PAPER. Clicking a control
   // scrolls the viewport, invalidating raw boundingBox().y comparisons.
   const relativeY=selector=>qPage.evaluate(selector=>{
    const paper=document.querySelector('.print-area')?.getBoundingClientRect();
    const target=document.querySelector(selector)?.getBoundingClientRect();
    return paper&&target?target.top-paper.top:null;
   },selector);
   const h0=await relativeY('.certificate-header-art');
   const b0=await relativeY('.certificate-body-content');
   const f0=await relativeY('.certificate-footer');
   assert.ok([h0,b0,f0].every(Number.isFinite),'all qiraat page rectangles exist');
   await qPage.locator('.certificate-settings-panel').first().locator('summary').click();
   await qPage.getByLabel('جزء الشهادة').selectOption('reading');
   const qSvg=qPage.locator('[data-testid="qiraat-svg-controls"]');
   assert.equal(await qSvg.count(),1,'qiraat SVG editor is available');
   const ijazahGraphic=qPage.locator('.certificate-ijazah-svg');
   const readingGraphic=qPage.locator('.certificate-reading-svg-line');
   const widthBefore=(await ijazahGraphic.boundingBox()).width;
   const heightBefore=(await readingGraphic.boundingBox()).height;
   await qPage.getByRole('spinbutton',{name:'عرض رسم إجازة',exact:true}).fill('106');
   await qPage.getByRole('spinbutton',{name:'ارتفاع سطر الرواية',exact:true}).fill('9');
   await qPage.getByRole('spinbutton',{name:'المسافة بين الرسم وسطر الرواية',exact:true}).fill('4');
   await qPage.getByRole('spinbutton',{name:'رفع أو خفض رسم إجازة',exact:true}).fill('1');
   await qPage.getByRole('spinbutton',{name:'رفع أو خفض سطر الرواية',exact:true}).fill('1');
   await qPage.waitForFunction(()=>Number.parseFloat(getComputedStyle(document.querySelector('.certificate-ijazah-svg')).width)>400);
   const widthAfter=(await ijazahGraphic.boundingBox()).width;
   const heightAfter=(await readingGraphic.boundingBox()).height;
   assert.ok(widthAfter>widthBefore*1.04,'ijazah SVG enlarges without stretching the reading glyphs');
   assert.ok(heightAfter>heightBefore*1.02,'riwayah SVG line scales separately without changing ijazah sizing');
   if(process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS)
    await qSvg.screenshot({path:process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS+'/certificate-qiraat-svg-controls.png'});
   const qHeading=qPage.getByRole('spinbutton',{name:'رفع أو خفض عنوان الإجازة',exact:true});
   const qFooter=qPage.getByRole('spinbutton',{name:'رفع أو خفض الختم ومعلومات المجيز',exact:true});
   await qHeading.fill('3');await qHeading.blur();
   await qPage.waitForFunction(y=>{
    const p=document.querySelector('.print-area')?.getBoundingClientRect();
    const r=document.querySelector('.certificate-header-art')?.getBoundingClientRect();
    return p&&r&&r.top-p.top>y+3;
   },h0);
   const h1=await relativeY('.certificate-header-art');
   const b1=await relativeY('.certificate-body-content');
   assert.ok(h1>h0+3&&b1>b0+3,
    'qiraat basmalah/title/riwayah move together; sanad body follows');
   const fAfterTitle=await relativeY('.certificate-footer');
   assert.ok(Math.abs(fAfterTitle-f0)<2,
    'moving the title does not pull the pinned mujeez footer with it');
   await qFooter.fill('-3');await qFooter.blur();
   const debug=await qPage.evaluate(()=>({
    titleOffset:getComputedStyle(document.querySelector('.print-area')).getPropertyValue('--certificate-heading-offset'),
    footerOffset:getComputedStyle(document.querySelector('.print-area')).getPropertyValue('--certificate-footer-offset'),
    footerLift:getComputedStyle(document.querySelector('.print-area')).getPropertyValue('--certificate-footer-lift'),
    footerTransform:getComputedStyle(document.querySelector('.certificate-footer')).transform,
    footerTop:document.querySelector('.certificate-footer').getBoundingClientRect().top,
   }));
   console.log('QIRAAT_POSITION_DEBUG',JSON.stringify({f0,fAfterTitle,debug}));
   await qPage.waitForFunction(y=>{
    const p=document.querySelector('.print-area')?.getBoundingClientRect();
    const r=document.querySelector('.certificate-footer')?.getBoundingClientRect();
    return p&&r&&r.top-p.top<y-3;
   },fAfterTitle);
   const f1=await relativeY('.certificate-footer');
   assert.ok(fAfterTitle-f1>3,'qiraat mujeez stamp/date/signature lift independently');
   const layout=await qPage.evaluate(()=>{
    const rect=selector=>{
     const r=document.querySelector(selector)?.getBoundingClientRect();
     return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width}:null;
    };
    const paper=document.querySelector('.print-area');
    return {paper:rect('.print-area'),header:rect('.certificate-header-art'),
     body:rect('.certificate-body-content'),footer:rect('.certificate-footer'),
     scrollHeight:paper?.scrollHeight,clientHeight:paper?.clientHeight,
     alerts:[...document.querySelectorAll('[role="alert"]')].map(n=>n.textContent)};
   });
   console.log('QIRAAT_FINAL_LAYOUT',JSON.stringify(layout));
   if(process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS)
    await qPage.locator('.print-area').screenshot({
     path:process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS+'/certificate-qiraat-heading-footer.png'
    });
   assert.equal(await qPage.locator('.certificate-settings-panel[role="alert"]').count(),0,
    'reasonable title/footer offsets remain inside the ornamental safety zone');
   await qPage.getByRole('button',{name:'حفظ تنسيق هذه الشهادة'}).click();
   assert.equal(qChanges.at(-1)?.action,'save','SVG positions are saved without final approval');
   assert.equal(qChanges.at(-1)?.settings?.qiraatHeading?.ijazahWidthMm,106);
   assert.equal(qChanges.at(-1)?.settings?.qiraatHeading?.riwayahHeightMm,9);
   assert.equal(qChanges.at(-1)?.settings?.qiraatHeading?.riwayahGapMm,4);
   await qPage.reload();
   await qPage.locator('.certificate-settings-panel').first().locator('summary').click();
   await qPage.getByLabel('جزء الشهادة').selectOption('reading');
   assert.equal(Number(await qPage.getByRole('spinbutton',{name:'عرض رسم إجازة',exact:true}).inputValue()),106,
    'per-certificate SVG sizing persists through reload');
   await qPage.getByRole('button',{name:'استعادة تنسيق النظام'}).click();
   await qPage.waitForFunction(()=>document.querySelector('input[aria-label="عرض رسم إجازة"]')?.value==='98.0244');
   assert.equal(Number(await qPage.getByRole('spinbutton',{name:'ارتفاع سطر الرواية',exact:true}).inputValue()),8.445,
    'restore resets individual riwayah SVG height without changing shared templates');
  }finally{await qPage.close();}
  console.log('PASS PDF viewer matn and qiraat SVG title, mujeez footer, draft save/reset and responsive print');
 }finally{
  if(browser)await browser.close().catch(()=>{});
  if(server?.pid)try{if(process.platform==='win32')server.kill();else process.kill(-server.pid,'SIGTERM');}catch{}
  fs.rmSync(temp,{recursive:true,force:true});
  fs.rmSync(qiraatDir,{recursive:true,force:true});
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
