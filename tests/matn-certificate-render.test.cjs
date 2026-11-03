const assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),swc=require('next/dist/build/swc');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
async function main(){
 await swc.loadBindings();
 const {code}=await swc.transform(fs.readFileSync('legacy/components/MatnFormatting.tsx','utf8'),{filename:'MatnFormatting.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const stubs={'zitejs/auth':{useAuth:()=>({})},'../lib/matnDraftRecovery':{},'../lib/assets':{currentArtwork:()=>[],assetBase:()=>''},'../lib/arabicSearch':{arabicSearchKey:s=>s},'../lib/matnRichText':{},'@project/components/ui/button':{Button:()=>null},'../lib/sakkalPrintNodes':require(require('node:path').resolve('.vercel/matn-tests/legacy/lib/sakkalPrintNodes.js'))};
 const mod=new Module(__filename,module);mod.filename=__filename;mod.paths=module.paths;mod.require=id=>id in stubs?stubs[id]:require(id);mod._compile(code,__filename);
 const f={text:'سند',start:0,end:3,bold:true,color:'primary',center:true,indent:1};
 const html=renderToStaticMarkup(React.createElement(mod.exports.MatnPreview,{bare:true,bookName:'الجزرية',wording:'أجزت {{mujaaz}} عن {{mujeez}} في {{kitab_name}}',sanad:'سند محفوظ',studentName:'الطالب',teacherName:'الشيخ',formats:[f]}));
 assert.ok(html.includes('أجزت الطالب عن الشيخ في الجزرية'));
 assert.ok(html.includes('text-align:center')&&html.includes('padding-inline-start:16px')&&html.includes('font-weight:700'));
 assert.ok(!html.includes('p-5')&&!html.includes('{{'));
 assert.equal(f.text,'سند');
 console.log('PASS: matn print resolves names and retains source bold/color/centering/indentation without editor chrome');
}
main().catch(e=>{console.error(e);process.exitCode=1});
