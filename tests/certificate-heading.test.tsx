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

const matn=renderToStaticMarkup(<CertificateHeading heading="إجازة في المقدمة الجزرية" primary="#123456" secondary="#654321"/>);
assert.ok(matn.includes('إجازة بالسند')&&matn.includes('المقدمة الجزرية'));
assert.ok(!matn.includes('certificate-ijazah-svg'),'Matn certificates must not show Quran ijazah artwork');

const bookCatalog:import('../legacy/lib/artworkCatalog').Artwork[]=[
 {kind:'books',number:'02',line:'heading',path:'svg/books/02/heading.svg',label:'المقدمة الجزرية',width:186.29,height:48.19},
 {kind:'books',number:'02',line:'line-02',path:'svg/books/02/line-02.svg',label:'المقدمة الجزرية',width:184.97,height:19.84},
];
const bookProps={heading:'إجازة في المُقدّمة الجزرية',primary:'#123456',secondary:'#654321',artwork:bookCatalog,artworkBase:'https://cdn.example/pinned'};
const art=renderToStaticMarkup(<CertificateHeading {...bookProps}/>);
assert.ok(art.includes('/pinned/svg/books/02/heading.svg')&&art.includes('/pinned/svg/books/02/line-02.svg'));
assert.ok(!art.includes('إجازة بالسند'));assert.ok(art.includes('background-color:#123456')&&art.includes('background-color:#654321'));
const dimensions=[...art.matchAll(/width:([\d.]+)mm;height:([\d.]+)mm/g)].map(m=>[Number(m[1]),Number(m[2])]);
assert.ok(Math.abs(dimensions[0][0]/dimensions[0][1]-186.29/48.19)<1e-8);
assert.ok(Math.abs(dimensions[1][0]/dimensions[0][0]-184.97/186.29)<1e-8);
const smaller=renderToStaticMarkup(<CertificateHeading {...bookProps} scalePercent={80}/>);
assert.ok(Math.abs(Number(smaller.match(/width:([\d.]+)mm/)![1])-98.0244*.8)<1e-8);
const historical=renderToStaticMarkup(<CertificateHeading {...bookProps} useMatnArtwork={false}/>);
assert.ok(historical.includes('إجازة بالسند')&&!historical.includes('/books/02/'));
const partial=renderToStaticMarkup(<CertificateHeading {...bookProps} artwork={bookCatalog.slice(0,1)}/>);
assert.ok(partial.includes('/books/02/heading.svg')&&!partial.includes('/books/02/line-02.svg'));
console.log('PASS: numbered book SVG lookup, shared aspect-preserving scaling, pinned source, missing-line and frozen historical fallback');

const fifteen=renderToStaticMarkup(<CertificateHeading {...bookProps} matnHeightPt={15}/>);
const dims15=[...fifteen.matchAll(/width:([\d.]+)mm;height:([\d.]+)mm/g)].map(m=>[Number(m[1]),Number(m[2])]);
assert.ok(Math.abs(dims15[0][1]-15*25.4/72)<1e-8,'Upper matn SVG has exact 15pt height');
assert.ok(Math.abs(dims15[1][0]/dims15[0][0]-184.97/186.29)<1e-8,'Lower SVG shares upper scale');
const thirty=renderToStaticMarkup(<CertificateHeading {...bookProps} matnHeightPt={30}/>);
const dims30=[...thirty.matchAll(/width:([\d.]+)mm;height:([\d.]+)mm/g)].map(m=>[Number(m[1]),Number(m[2])]);
assert.ok(Math.abs(dims30[1][1]/dims15[1][1]-2)<1e-8);
console.log('PASS: 15pt matn SVG height and linked resizing of both artwork lines');
