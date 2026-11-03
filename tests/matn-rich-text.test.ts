import assert from 'node:assert/strict';
import {editMatnFormats,setMatnStyle,type MatnStyle} from '../legacy/lib/matnRichText';
const style:MatnStyle={bold:true,color:'primary',center:false,indent:0};
const before='قال أحمد عن أحمد';
const f=setMatnStyle(before,[],4,8,style);
let next='ثم '+before;
let result=editMatnFormats(before,next,f);
assert.equal(result[0].start,7);assert.equal(result[0].text,'أحمد');
next='قال أحمد الكريم عن أحمد';result=editMatnFormats(before,next,f);
assert(result.some(v=>v.text.startsWith('أحمد')));assert(!result.some(v=>v.start>next.indexOf('عن')));
const replaced='قال محمد عن أحمد';result=editMatnFormats(before,replaced,f);
assert.equal(result[0].text,'محمد');assert.equal(result[0].bold,true);
const removed='قال  عن أحمد';assert.equal(editMatnFormats(before,removed,f).length,0);
const split=setMatnStyle('abcdef',setMatnStyle('abcdef',[],0,6,style),2,4,{...style,color:'secondary'});
assert.deepEqual(split.map(f=>[f.text,f.color]),[['ab','primary'],['cd','secondary'],['ef','primary']]);
const inserted=editMatnFormats('abcd','abXcd',setMatnStyle('abcd',[],0,4,style));assert.equal(inserted.length,1);assert.equal(inserted[0].text,'abXcd');
const unrelated=editMatnFormats('one two three','one TWO three',setMatnStyle('one two three',[],8,13,style));assert.equal(unrelated[0].text,'three');
assert.deepEqual(editMatnFormats(before,before,f),f);
console.log('PASS: edits preserve/split styles, Arabic repeated names, insert/delete/replace, no unrelated drift');

// Paragraph layout must preserve differently styled scholarly names.
const mixed='أحمد عن محمد';
const colored=setMatnStyle(mixed,[],0,4,style);
const {applyMatnPatch}=require('../legacy/lib/matnRichText');
const laidOut=applyMatnPatch(mixed,colored,0,mixed.length,{sizePercent:85,lineSpacing:1.4,paragraphSpacing:8,firstLineIndent:6,alignment:'right'});
assert.equal(laidOut[0].color,'primary');assert.equal(laidOut[0].bold,true);
assert.equal(laidOut.at(-1).color,'default');
for(const span of laidOut){assert.equal(span.sizePercent,85);assert.equal(span.lineSpacing,1.4);assert.equal(span.paragraphSpacing,8);assert.equal(span.firstLineIndent,6);assert.equal(span.alignment,'right');}
const reopened=JSON.parse(JSON.stringify(laidOut));
const edited=editMatnFormats(mixed,'ثم '+mixed,reopened);
assert.equal(edited[0].firstLineIndent,6);assert.equal(edited[0].text,'ثم أحمد');
const restyled=applyMatnPatch(mixed,reopened,0,4,{color:'secondary'});
assert.equal(restyled[0].sizePercent,85);assert.equal(restyled[0].paragraphSpacing,8);
console.log('PASS: percentage/paragraph layout survives save, edits and color changes without losing mixed emphasis');
