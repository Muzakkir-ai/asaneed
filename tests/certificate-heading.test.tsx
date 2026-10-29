import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import CertificateHeading from '../legacy/components/CertificateHeading';
import {svgReadingParts,riwayahSvgWidthMm,RIWAYAH_SVG_HEIGHT_MM} from '../legacy/lib/riwayahSvgHeading';
import {readingText,routeFor,QURRA} from '../legacy/lib/qurra';
import {vocalizeReadingLabel} from '../legacy/lib/vocalizedReading';
const heading=(rawi:string)=>vocalizeReadingLabel(readingText({qariId:'nafi',rawi})+' '+routeFor(['nafi']));
for(const rawi of ['قالون','ورش']){
 const parts=svgReadingParts(heading(rawi));assert.ok(parts);assert.equal(parts.length,5);assert.equal(parts[1],rawi==='قالون'?'rawi/nafi-qalun.svg':'rawi/nafi-warsh.svg');assert.equal(parts[3],'qari/nafi.svg');assert.equal(parts[4],'common/shatbiyah.svg');
 for(const part of parts)assert.ok(riwayahSvgWidthMm(part)>0&&RIWAYAH_SVG_HEIGHT_MM>0);
 for(const [primary,secondary] of [['#123456','#AABBCC'],['#926e35','#075f69']]){
  const markup=renderToStaticMarkup(<CertificateHeading heading={heading(rawi)} primary={primary} secondary={secondary}/>);
  assert.match(markup,/certificate-basmalah-svg/);assert.match(markup,/certificate-ijazah-svg/);assert.match(markup,/certificate-reading-svg-line/);assert.ok(markup.includes(primary)&&markup.includes(secondary));assert.equal((markup.match(/class="certificate-reading-svg-piece"/g)||[]).length,5);
 }
}
const nafi=QURRA.find(q=>q.id==='nafi')!;assert.equal(nafi.rawis.map(rawi=>svgReadingParts(heading(rawi))?.[1]).join(','),'rawi/nafi-qalun.svg,rawi/nafi-warsh.svg');
const nonstandard='برواية حفص عن الإمام عاصم الكوفي من طريق المصباح عن الفيل';
assert.equal(svgReadingParts(nonstandard),null,'Do not display an unrelated route SVG');
assert.equal(svgReadingParts(nonstandard,{preserveHistoricalRoute:true})?.[4],'common/shatbiyah.svg','Preserve the existing finalized artwork selection');
assert.equal(svgReadingParts('Unrecognized historical heading'),null);
console.log('PASS: authentic Qalun/Warsh SVGs, paired qiraah headings, route selection, original dimensions, colors and frozen historical fallback');
