import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
const {JSDOM}=require('jsdom');
import {MatnPreview} from '../legacy/components/MatnFormatting';
import MatnHeading from '../legacy/components/MatnHeading';
import MatnA4Preview from '../legacy/components/MatnA4Preview';
import CertificateBorder from '../legacy/components/CertificateBorder';
import {DEFAULT_MATN_HEADING,matnHeadingSchema,readMatnPresentation,writeMatnPresentation} from '../legacy/lib/matnPresentation';
import {numberedArtworkPath,artworkSchema,type Artwork} from '../legacy/lib/artworkCatalog';
const layout={...DEFAULT_MATN_HEADING,basmalahGapMm:7,borderNumber:'02',sectionBreaks:{afterIntro:false,afterWording:false,afterSanad:false}};
assert.deepEqual(readMatnPresentation(writeMatnPresentation('[]',[],layout)).heading,layout);
assert.equal(matnHeadingSchema.safeParse({...layout,basmalahGapMm:31}).success,false);
assert.equal(matnHeadingSchema.safeParse({...layout,borderNumber:'../../bad'}).success,false);
const heading=renderToStaticMarkup(<MatnHeading name="مثال" settings={layout}/>);assert.ok(heading.includes('margin-top:7mm'));
const props={bookName:'مثال',intro:'مقدمة',wording:'إجازة',sanad:'سند',end:'خاتمة',formats:[{start:0,end:3,text:'سند',bold:true,color:'primary' as const,center:false,indent:0}]};
const joined=new JSDOM(renderToStaticMarkup(<MatnPreview {...props} headingSettings={layout}/>)).window.document;
assert.equal(joined.querySelectorAll('.matn-composed-preview .whitespace-pre-wrap').length,1);assert.ok(joined.body.textContent?.includes('مقدمة إجازة سند خاتمة'));const bold=joined.querySelector('span[style*="font-weight:700"]');assert.equal(bold?.textContent,'سند','joining rebases sanad format ranges');
const separated=new JSDOM(renderToStaticMarkup(<MatnPreview {...props} headingSettings={{...layout,sectionBreaks:{afterIntro:true,afterWording:true,afterSanad:true}}}/>)).window.document;assert.equal(separated.querySelectorAll('.matn-composed-preview .whitespace-pre-wrap').length,4);
const old=new JSDOM(renderToStaticMarkup(<MatnPreview {...props}/>)).window.document;assert.equal(old.querySelectorAll('.matn-composed-preview .whitespace-pre-wrap').length,4,'legacy rendering stays separated');
const art:Artwork={kind:'borders',number:'02',line:'frame',path:'svg/borders/02/frame.svg',width:297,height:210,label:'إطار تجريبي'};assert.ok(artworkSchema.safeParse(art).success);assert.equal(numberedArtworkPath(art.path)?.kind,'borders');assert.equal(numberedArtworkPath('svg/borders/02/heading.svg'),null);assert.equal(numberedArtworkPath('svg/borders/02/../../frame.svg'),null);
const border=renderToStaticMarkup(<CertificateBorder number="02" color="#123456" artwork={[art]} base="https://example.test/pinned-commit"/>);assert.ok(border.includes('pinned-commit/svg/borders/02/frame.svg'));assert.equal(renderToStaticMarkup(<CertificateBorder number="none" color="#123456"/>),'');assert.ok(renderToStaticMarkup(<CertificateBorder number="03" color="#123456" artwork={[]}/>).includes('certificate-ornament'));
const paper=renderToStaticMarkup(<MatnA4Preview borderNumber="none"><MatnPreview {...props}/></MatnA4Preview>);assert.ok(paper.includes('width:297mm;height:210mm'));assert.ok(paper.includes('data-viewer-scale'));
console.log('PASS: basmalah gap, join/separate boundaries with rebased formats, saved settings, A4 landscape, safe/pinned border paths and legacy fallback');

const boxed=new JSDOM(renderToStaticMarkup(<MatnPreview {...props} formats={[{...props.formats[0],sizePt:20}]} headingSettings={{...layout,bodyWidthMm:190,bodyScalePercent:120}}/>)).window.document;assert.ok(boxed.querySelector('.matn-text-box')?.getAttribute('style')?.includes('width:190mm'));assert.ok(boxed.querySelector('.matn-text-box')?.getAttribute('style')?.includes('font-size:120%'));assert.ok(boxed.querySelector('span[style*="font-size:24pt"]'));assert.equal(matnHeadingSchema.safeParse({...layout,bodyWidthMm:99}).success,false);

const bSettings={...layout,basmalahWidthMm:50};assert.equal(readMatnPresentation(writeMatnPresentation('[]',[],bSettings)).heading?.basmalahWidthMm,50);const sized=new JSDOM(renderToStaticMarkup(<MatnHeading name="مثال" settings={bSettings}/>)).window.document.querySelector('.certificate-basmalah-svg') as HTMLElement;assert.equal(sized.style.width,'50mm');assert.ok(Math.abs(parseFloat(sized.style.height)-50*4.4/34.18)<.0001);assert.equal(matnHeadingSchema.safeParse({...layout,basmalahWidthMm:81}).success,false);
