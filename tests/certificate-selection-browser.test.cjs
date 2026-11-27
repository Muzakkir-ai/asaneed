const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
 const directory=fs.mkdtempSync('app/certificate-selection-review-'),root=path.resolve('.');
 const url='http://127.0.0.1:3114/'+path.basename(directory);
 let server,browser;
 try{
  fs.copyFileSync('tests/fixtures/certificate-selection-review.tsx',directory+'/page.tsx');
  execFileSync(process.execPath,['scripts/build-studio.cjs']);
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3114'],{stdio:'inherit'});
  let ready=false;
  for(let i=0;i<80&&!ready;i++){try{ready=(await fetch(url,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(!ready)await new Promise(resolve=>setTimeout(resolve,300));}
  assert.ok(ready,'fixture served');
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});
  const page=await browser.newPage({viewport:{width:796,height:670}});
  const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
  const guest={id:id(1),name:'الشيخ الاختباري',readings:[{qariId:'asim',rawi:'حفص'}],routes:[],sharedSughraSanad:true,variants:Array.from({length:6},(_,i)=>({id:id(i+2),name:'سند تجريبي '+(i+1),qariId:'asim',rawi:'حفص'}))};
  const requests=[];
  await page.route('**/api/book-builder',route=>route.fulfill({json:{people:[],books:[],chains:[]}}));
  await page.route('**/api/workspace/*',route=>{
   const endpoint=route.request().url().split('/').at(-1),input=route.request().postDataJSON();
   requests.push({endpoint,...input});
   if(endpoint==='additionalShaykhs'&&input.readinessOnly){assert.equal(input.previewOnly,true);return route.fulfill({json:{sheikhs:[],ready:true}});}
   if(endpoint==='additionalShaykhs')return route.fulfill({json:input.action==='list'?{sheikhs:[guest]}:{sheikhs:[],preview:{chain:'سند المعاينة التجريبي',branches:input.personalSanadIds.map(sourceId=>({sourceId,label:'تجريبي',paths:[],names:{},continuationId:null,routeId:null,narratorCount:32}))}}});
   if(endpoint==='studentDirectory')return route.fulfill({json:{students:[],entries:[]}});
   if(endpoint==='ijazahHoldings')return route.fulfill({json:{holdings:[]}});
   return route.fulfill({json:{entries:[]}});
  });
  await page.goto(url);
  const reading=page.getByRole('combobox',{name:'القراءة أو الرواية',exact:true});
  await reading.waitFor();
  await page.getByRole('combobox').filter({has:page.locator('option[value="sughra"]')}).count().then(count=>assert.equal(count,0,'only Sughra: no scope selector'));
  await reading.click();
  await page.getByRole('option',{name:'رواية حفص',exact:true}).click();
  const picker=page.getByRole('group',{name:'الأسانيد المحفوظة لهذه الرواية'});
  await picker.getByRole('checkbox').first().waitFor();
  await page.getByText('السند مكتمل وجاهز للإصدار',{exact:true}).waitFor();
  assert.equal(await picker.getByRole('checkbox').count(),7);
  assert.equal(await picker.getByRole('checkbox',{checked:true}).count(),1,'default sanad visibly selected');
  await picker.getByRole('button',{name:'تحديد الكل',exact:true}).click();
  assert.equal(await picker.getByRole('checkbox',{checked:true}).count(),7);
  await page.getByText('٣٢ راوياً إلى النبي ﷺ').first().waitFor();
  await picker.getByRole('checkbox').nth(2).uncheck();
  await page.getByRole('button',{name:'معاينة السند المجمّع'}).click();
  await page.getByText('سند المعاينة التجريبي',{exact:true}).waitFor();
  assert.equal(requests.filter(r=>r.previewOnly&&!r.readinessOnly&&r.personalSanadIds?.length===6).length>0,true);
  assert.ok(requests.filter(r=>r.action==='issue').every(r=>r.previewOnly),'all requests are read-only previews');
  await picker.getByRole('button',{name:'تحديد الكل',exact:true}).click();
  await picker.getByRole('button',{name:'مسح التحديد',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'حفظ المسودة',exact:true}).isDisabled(),true,'empty selection cannot silently issue the default');
  assert.equal(await page.getByRole('button',{name:'رجوع إلى المُجيز'}).innerText(),'','back is an accessible icon');
  for(const width of [320,375,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.locator('.certificate-entry-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'form has no horizontal overflow at '+width);}
  fs.mkdirSync('work/certificate-selection',{recursive:true});
  await page.screenshot({path:'work/certificate-selection/selection.png',fullPage:true});
  guest.routes=[{qariId:'asim',rawi:'حفص',tariqNumber:'1031',tariqName:'المستنير — طريق تجريبي'}];
  await page.reload();
  await page.locator('select').filter({has:page.locator('option[value="kubra"]')}).waitFor();
  console.log('PASS single-scope auto-selection, dual-scope choice, seven-sanad select all/partial/clear, count badges, read-only preview and back icon');
 }finally{
  await browser?.close();
  if(server&&server.exitCode===null){server.kill();await new Promise(resolve=>setTimeout(resolve,500));}
  const target=path.resolve(directory);if(!target.startsWith(root+path.sep))throw Error('Unsafe cleanup');
  fs.rmSync(target,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
