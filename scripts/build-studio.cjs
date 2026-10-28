const fs=require('node:fs');
const postcss=require('postcss');
const tailwind=require('tailwindcss');
const autoprefixer=require('autoprefixer');
const source=fs.readFileSync('legacy/index.css','utf8').replace(/^@import.*\r?\n/m,'').replaceAll('43 28% 48%','37.19 58.45% 59.41%').replaceAll('--secondary: 188 51% 19%;','--secondary: 37.19 58.45% 59.41%;').replaceAll('--secondary-foreground: 40 33% 97%;','--secondary-foreground: 188 51% 19%;');
async function build(){
 const result=await postcss([tailwind({config:'tailwind.config.ts'}),autoprefixer()]).process(source,{from:'legacy/index.css'});
 result.root.walkRules(rule=>{
  if(rule.parent.type==='atrule'&&/keyframes/.test(rule.parent.name))return;
  rule.selectors=rule.selectors.map(selector=>{
   if([':root','html','body','#root'].includes(selector))return '.zite-app';
   if(selector==='body *')return '.zite-app *';
   if(selector==='.dark')return '.dark .zite-app';
   return '.zite-app '+selector;
  });
 });
 const shell='body>main:has(.zite-app){max-width:none;padding:0}.zite-app main{max-width:none;margin:0 auto}.zite-app form{max-width:none}.zite-app button{margin-top:0}.zite-app h1,.zite-app h2,.zite-app p{margin-top:0}\n@media print{html:has(.zite-app .print-area),body:has(.zite-app .print-area),body>main:has(.zite-app .print-area){width:297mm!important;height:210mm!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}body:has(.zite-app .print-area){visibility:hidden}.zite-app .print-area,.zite-app .print-area *{visibility:visible!important}}';
 fs.writeFileSync('app/studio/studio.css',result.root.toString()+'\n'+shell);
}
build().catch(error=>{console.error(error);process.exitCode=1;});
