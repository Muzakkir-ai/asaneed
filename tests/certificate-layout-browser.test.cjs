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
   await qPage.route('**/api/workspace/certificateDraftPreview',request=>
    request.fulfill({json:qMock}));
   await qPage.goto(qiraatUrl);
   const artwork=qPage.locator('.certificate-header-art');
   await artwork.locator('.certificate-ijazah-svg').waitFor();
   await artwork.locator('.certificate-basmalah-svg').waitFor();
   await artwork.locator('.certificate-reading-svg-line').waitFor();
   const h0=await artwork.boundingBox();
   const b0=await qPage.locator('.certificate-body-content').boundingBox();
   const f0=await qPage.locator('.certificate-footer').boundingBox();
   await qPage.locator('.certificate-settings-panel').first().locator('summary').click();
   const qHeading=qPage.getByRole('spinbutton',{name:'رفع أو خفض عنوان الإجازة',exact:true});
   const qFooter=qPage.getByRole('spinbutton',{name:'رفع أو خفض الختم ومعلومات المجيز',exact:true});
   await qHeading.fill('3');await qHeading.blur();
   await qPage.waitForFunction(y=>
    (document.querySelector('.certificate-header-art')?.getBoundingClientRect().y||0)>y+3,h0.y);
   const h1=await artwork.boundingBox();
   const b1=await qPage.locator('.certificate-body-content').boundingBox();
   assert.ok(h1&&b1&&h1.y>h0.y+3&&b1.y>b0.y+3,
    'qiraat basmalah/title/riwayah move together; sanad body follows');
   await qFooter.fill('-3');await qFooter.blur();
   await qPage.waitForFunction(y=>
    (document.querySelector('.certificate-footer')?.getBoundingClientRect().y||0)<y-3,f0.y);
   const f1=await qPage.locator('.certificate-footer').boundingBox();
   assert.ok(f1&&f0.y-f1.y>3,'qiraat mujeez stamp/date/signature lift independently');
   assert.equal(await qPage.locator('[role="alert"]').count(),0,
    'reasonable title/footer offsets remain inside the ornamental safety zone');
   if(process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS)
    await qPage.locator('.print-area').screenshot({
     path:process.env.ASANEED_CERTIFICATE_REVIEW_SCREENSHOTS+'/certificate-qiraat-heading-footer.png'
    });
  }finally{await qPage.close();}
  console.log('PASS PDF viewer matn and qiraat SVG title, mujeez footer, draft save/reset and responsive print');
 }finally{
  if(browser)await browser.close().catch(()=>{});
  if(server?.pid)try{if(process.platform==='win32')server.kill();else process.kill(-server.pid,'SIGTERM');}catch{}
  fs.rmSync(temp,{recursive:true,force:true});
  fs.rmSync(qiraatDir,{recursive:true,force:true});
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
