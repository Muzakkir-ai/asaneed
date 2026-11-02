import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {sakkalInitialBa} from '../legacy/lib/sakkalInitialBa';
import {sakkalPrintNodes} from '../legacy/lib/sakkalPrintNodes';
assert.equal(sakkalInitialBa('بِسْمِ الله بن بكر'), 'ﺑ\u0640ِسْمِ الله ﺑ\u0640ن ﺑ\u0640كر');
assert.equal(sakkalInitialBa('عبد أبي ب ب، بء وبن'), 'عبد أبي ب ب، بء وبن');
assert.equal(sakkalInitialBa('(بن) — بَاب'), '(ﺑ\u0640ن) — ﺑ\u0640َاب');
assert.equal(sakkalInitialBa('ﺑ\u0640ن'), 'ﺑ\u0640ن');
const tree=createElement('div',{style:{fontFamily:'Sakkal Kitab'}},'بن ',createElement('span',{style:{fontFamily:'KSA Regular'}},'بكر'));
const html=renderToStaticMarkup(sakkalPrintNodes(tree));
assert.ok(html.includes('ﺑ\u0640ن'));assert.ok(html.includes('>بكر<'));
assert.ok(renderToStaticMarkup(tree).includes('>بن '));
console.log('Sakkal initial ba glyph and font scope tests passed');

const allahHtml=renderToStaticMarkup(sakkalPrintNodes(createElement('span',{style:{fontFamily:'KSA Regular'}},'عبد اللّٰه بن محمد')));
assert.ok(!allahHtml.includes('&quot;ss14&quot; 1'));
assert.ok(allahHtml.includes('عبد الله بن محمد'));
assert.ok(!allahHtml.includes('ّ'));assert.ok(!allahHtml.includes('ٰ'));

const sakkalAllahHtml=renderToStaticMarkup(sakkalPrintNodes(createElement('span',{style:{fontFamily:'Sakkal Kitab'}},'الله')));
assert.ok(sakkalAllahHtml.includes('&quot;ss14&quot; 1'));
assert.ok(!sakkalAllahHtml.includes('&quot;liga&quot; 0'));

assert.equal(sakkalInitialBa('بِّسْم'), 'ﺑـِّسْم');
assert.equal(sakkalInitialBa('ﺑِـسْم'), 'ﺑـِسْم');
assert.equal(sakkalInitialBa('بِأَنْ يَقْرَأَ وَبِرِوَايَةِ'), 'ﺑـِأَنْ يَقْرَأَ وَبـِرِوَايَةِ');
assert.equal(sakkalInitialBa('أَرْبَابِ هَذَا الْفَنِّ'), 'أَرْبـَابِ هَذَا الْفَنِّ');
assert.equal(sakkalInitialBa(sakkalInitialBa('وَبِّرِوَايَةِ')), 'وَبـِّرِوَايَةِ');
const wordingHtml=renderToStaticMarkup(sakkalPrintNodes(createElement('span',{style:{fontFamily:'Sakkal Kitab'}},'بِأَنْ وَبِرِوَايَةِ')));
assert.ok(wordingHtml.includes('ﺑـِأَنْ وَبـِرِوَايَةِ'));
const ksaWordingHtml=renderToStaticMarkup(sakkalPrintNodes(createElement('span',{style:{fontFamily:'KSA Regular'}},'بِأَنْ وَبِرِوَايَةِ')));
assert.ok(ksaWordingHtml.includes('بِأَنْ وَبِرِوَايَةِ'));
