import assert from 'node:assert/strict';
import {currentRouteEmphasis} from '../legacy/lib/currentRouteEmphasis';
const library={books:[{id:'book',title:'الدرة',author_id:'author',archived:false}],people:[{id:'author',name:'المؤلف',display_name:'',archived:false},{id:'old',name:'الاسم السابق',display_name:'',archived:false},{id:'new',name:'صاحب الطريق المصحح',display_name:'',archived:false}],chains:[{id:'route',book_id:'book',route_code:'1072',qari_id:'yaqub',rawi:'رُويس',kind:'route' as const,archived:false,confirmed:true,reading_scope:'sughra' as const}],nodes:[{chain_id:'route',branch:0,position:2,person_id:'old',route_source:false},{chain_id:'route',branch:0,position:3,person_id:'new',route_source:true}]};
assert.deepEqual(currentRouteEmphasis(library,{qariId:'yaqub',rawi:'رويس'}),{bookAuthor:'المؤلف',routeSource:'صاحب الطريق المصحح',routeSources:['صاحب الطريق المصحح']});
assert.equal(currentRouteEmphasis(library,{routeCode:'1072',qariId:'yaqub',rawi:'رُويس'})?.routeSource,'صاحب الطريق المصحح');
assert.equal(currentRouteEmphasis(library,{routeId:'missing',qariId:'yaqub',rawi:'رُويس'}),null);
assert.equal(currentRouteEmphasis({...library,chains:[...library.chains,{...library.chains[0],id:'duplicate'}]},{qariId:'yaqub',rawi:'رُويس'}),null);
assert.deepEqual(currentRouteEmphasis({...library,nodes:[]},{qariId:'yaqub',rawi:'رُويس'})?.routeSources,[]);
console.log('Current route source role tests passed');
