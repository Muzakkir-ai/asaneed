import assert from 'node:assert/strict';
import {certificateFooterLift} from '../legacy/lib/certificateFooterLift';
import {matnHeadingSchema} from '../legacy/lib/matnPresentation';

const width=1123;
const layoutWidth=1123;
const pxPerMm=width/297;
const args={pageWidth:width,layoutWidth,bodyBottom:560,footerTop:560+pxPerMm*32};
const lift=certificateFooterLift(args);
assert.ok(Math.abs(lift-pxPerMm*10)<0.0001,'short ijazah lifts footer by at most 10mm');
const stable=certificateFooterLift({...args,footerTop:args.footerTop-lift,previousLift:lift});
assert.ok(Math.abs(lift-stable)<0.0001,'remeasuring the transformed footer does not drift');
const middle=certificateFooterLift({...args,footerTop:args.bodyBottom+pxPerMm*18});
assert.ok(middle>0&&middle<lift,'medium-length ijazah gets less upward movement');
const long=certificateFooterLift({...args,footerTop:args.bodyBottom+pxPerMm*12});
assert.equal(long,0,'long ijazah retains normal footer placement');
const close=certificateFooterLift({...args,footerTop:args.bodyBottom+pxPerMm*10});
assert.equal(close,0,'never lift an already close footer');

const reduced=certificateFooterLift({
 pageWidth:width/2,layoutWidth,bodyBottom:280,
 footerTop:280+(pxPerMm/2)*32,
});
assert.ok(Math.abs(reduced-lift)<.0001,'PDF layout unaffected by zoomed/mobile preview');
assert.equal(certificateFooterLift({...args,pageWidth:0}),0,'invalid paper geometry fails safely');

const updated=matnHeadingSchema.parse({
 version:1,mainHeightPt:42,secondaryHeightPt:24,lineGapMm:2,afterGapMm:4,
 sectionGapAfterIntroMm:3,sectionGapAfterWordingMm:5,
 sectionGapAfterSanadMm:6,conclusionOffsetMm:-7,
});
assert.equal(updated.conclusionOffsetMm,-7,'negative value raises khatima within the actual document flow');
assert.equal(updated.sectionGapAfterWordingMm,5,'matn paragraph gaps survive validation');
assert.equal(matnHeadingSchema.safeParse({...updated,conclusionOffsetMm:18}).success,false,
 'khatima offset is bounded to prevent dangerous overlap');
assert.equal(matnHeadingSchema.safeParse({...updated,sectionGapAfterSanadMm:25}).success,false,
 'section spacing must stay within printable limits');
console.log('PASS certificate footer balancing and section spacing validation');
