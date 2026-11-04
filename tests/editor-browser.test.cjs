const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),{chromium}=require('playwright');
// Isolated fixture imports the real editor and print flow. It never reads/writes hosted data.
async function main(){
 const route=path.resolve('app/editor-review'),out=path.resolve(process.env.EDITOR_ARTIFACT_DIR||'.vercel/editor-browser');
 if(fs.existsSync(route))throw Error('Remove or move the existing app/editor-review fixture before running this test.');
 const generated=['AGENTS.md','next-env.d.ts','app/studio/studio.css'].map(file=>({file,content:fs.readFileSync(file)}));
 fs.mkdirSync(route);fs.copyFileSync('tests/fixtures/editor-review.tsx',path.join(route,'page.tsx'));fs.mkdirSync(out,{recursive:true});
 let server,browser;
 try{
  execFileSync(process.execPath,['scripts/build-studio.cjs']);server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--port','3105'],{stdio:'pipe',windowsHide:true});let serverLog='';server.stdout.on('data',b=>serverLog+=b);server.stderr.on('data',b=>serverLog+=b);
  let ready=false;for(let i=0;i<120;i++){try{const r=await fetch('http://localhost:3105/editor-review');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw Error(serverLog);
  browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,headless:true}:{channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3105/editor-review');const box=page.getByRole('textbox');await box.waitFor();await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'nextjs-portal{display:none}'});
  assert.equal(await page.getByRole('button',{name:'تراجع',exact:true}).isVisible(),false);
  await box.click();await page.keyboard.press('Control+End');await page.getByRole('button',{name:'غامق',exact:true}).first().click();await page.keyboard.insertText(' بَارَكَ اللّٰهُ');await page.keyboard.press('Shift');await page.keyboard.insertText(' فِيهِ');
  const state=JSON.parse(await page.getByTestId('state').textContent());assert.ok(state.formats.some(f=>f.bold&&f.text.includes('بَارَكَ اللّٰهُ فِيهِ')));assert.equal(await page.getByRole('button',{name:'غامق',exact:true}).first().getAttribute('aria-pressed'),'true');
  await page.getByLabel('نمط النص',{exact:true}).selectOption('heading');assert.equal(await page.getByLabel('نمط النص',{exact:true}).inputValue(),'heading');assert.equal(await page.getByRole('button',{name:'توسيط',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByLabel('لون النص',{exact:true}).click();await page.getByRole('button',{name:'اللون الثانوي',exact:true}).click();assert.equal(await page.getByRole('button',{name:'اللون الثانوي',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('heading',{name:'محرر النصوص'}).click();
  await page.screenshot({path:path.join(out,'editor-desktop.png'),fullPage:true});
  await page.getByLabel('المزيد من التنسيق',{exact:true}).first().click();assert.ok(await page.getByRole('button',{name:'تراجع',exact:true}).isVisible());await page.screenshot({path:path.join(out,'editor-more-desktop.png'),fullPage:true});await page.keyboard.press('Escape');
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,`editor-mobile-${width}.png`),fullPage:true});}
  await page.getByLabel('المزيد من التنسيق',{exact:true}).first().click();assert.ok(await page.getByRole('button',{name:'تراجع',exact:true}).isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'editor-more-mobile.png'),fullPage:true});
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('.review-print .certificate-sanad-paragraph').count(),2);assert.equal(await page.locator('.review-print .certificate-sanad-paragraph').first().locator('div').count(),0,'inline rich source adds no nested blocks');
  const printBounds=await page.locator('.print-area').boundingBox();assert.ok(printBounds.width>1100&&printBounds.width<1130,'A4 landscape width in CSS pixels');
  await page.pdf({path:path.join(out,'editor-a4-landscape.pdf'),preferCSSPageSize:true,printBackground:true});assert.deepEqual(errors,[]);
  const fonts=await page.evaluate(()=>({ksa:document.fonts.check('12px "KSA Regular"'),sakkal:document.fonts.check('12px "Sakkal Kitab"')}));assert.ok(fonts.ksa&&fonts.sakkal);console.log(JSON.stringify({arabicTyping:state.text,fonts,desktop:1280,mobile:[320,390],printParagraphs:2,errors,out}));
 }finally{
  await browser?.close();if(server){if(process.platform==='win32'){try{execFileSync('taskkill',['/pid',String(server.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{}}else server.kill();}
  fs.unlinkSync(path.join(route,'page.tsx'));fs.rmdirSync(route);const validator='.next/dev/types/validator.ts';if(fs.existsSync(validator)&&fs.readFileSync(validator,'utf8').includes('editor-review/page'))fs.unlinkSync(validator);for(const item of generated)fs.writeFileSync(item.file,item.content);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
