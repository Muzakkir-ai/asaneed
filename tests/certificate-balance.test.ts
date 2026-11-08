import assert from 'node:assert/strict';
import {certificateBalance} from '../legacy/lib/certificateBalance';
const layout={pageTop:0,pageBottom:800,pageWidth:1123,layoutWidth:1123,headerTop:55,footerBottom:690};
const balanced=certificateBalance(layout);
assert.ok(balanced.fits&&balanced.shift>0&&balanced.shift<30,'Gently use spare bottom space');
const stable=certificateBalance({...layout,headerTop:layout.headerTop+balanced.shift,footerBottom:layout.footerBottom+balanced.shift,previousShift:balanced.shift});
assert.ok(Math.abs(stable.shift-balanced.shift)<0.001,'No repeated drift');
const scaled=certificateBalance({...layout,pageBottom:400,pageWidth:561.5,headerTop:27.5,footerBottom:345});
assert.ok(Math.abs(scaled.shift-balanced.shift)<0.001,'Same print position at mobile preview scale');
assert.equal(certificateBalance({...layout,footerBottom:795}).fits,false,'Long text must not be squeezed');
// New issuer footer sits close to the bottom border, not at the body end.
const pinned={...layout,headerTop:55,footerBottom:763,pinnedFooter:true};
const pinnedResult=certificateBalance(pinned);
const maxRise=4*layout.pageWidth/297;
assert.ok(pinnedResult.fits&&pinnedResult.shift<=0&&pinnedResult.shift>=-maxRise,'Pinned footer may rise only 4mm, never move down');
const pinnedStable=certificateBalance({...pinned,headerTop:pinned.headerTop+pinnedResult.shift,footerBottom:pinned.footerBottom+pinnedResult.shift,previousShift:pinnedResult.shift});
assert.ok(Math.abs(pinnedStable.shift-pinnedResult.shift)<0.001,'Pinned footer shift stays stable on remeasurement');
assert.equal(certificateBalance({...pinned,footerBottom:795}).fits,false,'Pinned footer refuses unsafe bottom overflow');
console.log('PASS: restrained vertical balance, preview-scale independence, no drift and long-certificate fallback');

assert.equal(certificateBalance({...layout,anchorHeader:true}).shift,0,'Keep basmalah at original top coordinate');
assert.equal(certificateBalance({...layout,pageBottom:400,pageWidth:561.5,headerTop:27.5,footerBottom:345,anchorHeader:true}).shift,0,'Anchoring is independent of viewer zoom');
assert.equal(certificateBalance({...layout,footerBottom:795,anchorHeader:true}).fits,false,'Anchoring retains overflow fallback');
