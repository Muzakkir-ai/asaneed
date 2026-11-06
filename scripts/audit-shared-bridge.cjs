const fs=require('node:fs');
const {linkSharedBridge}=require('../.vercel/shared-bridge-tests/legacy/lib/sharedBridge.js');

const input=process.argv[2];
if(!input)throw Error('Pass a private JSON export containing source {id, body} and people.');
const {source,people}=JSON.parse(fs.readFileSync(input,'utf8'));
if(!source||typeof source.id!=='string'||typeof source.body!=='string'||!Array.isArray(people)){
 throw Error('Invalid shared continuation or narrator export.');
}
const result=linkSharedBridge(source,people);
if(!result)throw Error('The source does not match the supported shared continuation grammar.');
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(result.unresolved.length)process.exitCode=2;
