import {reachesJunction} from './personalSanadValidation';
export const UBAYDI_BRIDGE_TITLE='من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند';
export const DIRECT_JAZARI_ID='junction:jazari';
export const PERSONAL_BRIDGE_TITLE='PERSONAL-BRIDGE:';
export type BuilderPrefixContinuation={id:string;title:string;body:string;anchorName?:string};
const key=(s:string)=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640\u06d6-\u06ed]/gu,'').replace(/[أإآٱ]/gu,'ا').replace(/ى/gu,'ي').replace(/[،.؛\s]+$/u,'').replace(/\s+/gu,' ').trim();
export function prefixBridgeAnchor(source:BuilderPrefixContinuation){return source.anchorName|| (source.title===UBAYDI_BRIDGE_TITLE?'إبراهيم العُبيدي':'');}
export function validatePersonalBridge(anchor:string,body:string){
 if(key(anchor).length<3)throw Error('اختر اسم الشيخ عند نقطة الالتقاء');
 if(!/^عن\s/u.test(body.trim()))throw Error('ابدأ التتمة بـ «عن» واسم الشيخ التالي؛ لا تكرر شيخ نقطة الالتقاء');
 if(!reachesJunction({personalChain:body,junction:'jazari'}))throw Error('التتمة المحفوظة لا تصل إلى ابن الجزري؛ راجع النص');
 const normalized=key(body),name=key(anchor);
 if(new RegExp('(?:^|[\\s،؛.(])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[\\s،؛.)])','u').test(normalized))throw Error('راجع التتمة لتجنب تكرار شيخ نقطة الالتقاء');
}

/** Preserve the reviewed source verbatim, including its textual branch markers. */
export function resolveBuilderPrefix(prefix:string,continuations:BuilderPrefixContinuation[]=[],selectedId=''){
 const text=prefix.trim();
 if(selectedId===DIRECT_JAZARI_ID){
  if(!reachesJunction({personalChain:text,junction:'jazari'}))throw Error('أكمل رواة سندك إلى الإمام ابن الجزري قبل اعتماد نقطة الالتقاء');
  return {text,junction:'jazari' as const,sourceId:''};
 }
 const selected=selectedId?continuations.find(c=>c.id===selectedId):undefined;
 if(selectedId&&!selected)throw Error('التتمة المختارة غير متاحة؛ أعد اختيار نقطة الالتقاء');
 if(selected?.anchorName){
  const anchor=key(selected.anchorName),normalized=key(text);
  if(!(normalized===anchor||normalized.endsWith(' '+anchor)))throw Error('يجب أن ينتهي سندك الشخصي باسم '+selected.anchorName);
  validatePersonalBridge(selected.anchorName,selected.body);
  return {text:text.replace(/[،.؛\s]+$/u,'')+'، '+selected.body.trim(),junction:'jazari' as const,sourceId:selected.id};
 }
 if(reachesJunction({personalChain:text,junction:'jazari'}))return {text,junction:'jazari' as const,sourceId:''};
 if(!reachesJunction({personalChain:text,junction:'ubaydi'}))throw Error('أدخل السند الشخصي إلى إبراهيم العبيدي أو الإمام ابن الجزري');
 const choices=continuations.filter(c=>c.title===UBAYDI_BRIDGE_TITLE&&c.body.trim());
 const source=selectedId?choices.find(c=>c.id===selectedId):choices.length===1?choices[0]:undefined;
 if(!source)throw Error(choices.length>1?'اختر التتمة المحفوظة من إبراهيم العبيدي إلى ابن الجزري':'تتمة إبراهيم العبيدي إلى ابن الجزري غير متاحة؛ أكمل السند إلى ابن الجزري أو راجع المكتبة');
 if(!reachesJunction({personalChain:source.body,junction:'jazari'}))throw Error('التتمة المحفوظة لا تصل إلى ابن الجزري؛ راجع النص المشترك');
 // This source starts after al-Ubaydi. Never guess how to trim a duplicated anchor.
 if(!/^عن\s/u.test(source.body.trim())||reachesJunction({personalChain:source.body,junction:'ubaydi'}))throw Error('راجع بداية التتمة المحفوظة لتجنب تكرار إبراهيم العبيدي');
 return {text:text.replace(/[،.؛\s]+$/u,'')+'، '+source.body.trim(),junction:'ubaydi' as const,sourceId:source.id};
}

/** Only exact text produced from saved ordered identities supplies extra meeting points.
 * Never split an arbitrary pasted sanad or guess at its branch boundaries. */
export function savedPersonalMeetingPoints(holdings:{id:string;unifiedSanad?:{prefix:string;prefixPersonIds?:string[]}|null}[],people:{id:string;name:string;archived:boolean}[]):BuilderPrefixContinuation[]{
 return holdings.flatMap(h=>{
  const ref=h.unifiedSanad,ids=ref?.prefixPersonIds;if(!ref||!ids?.length)return [];
  const nodes=ids.map(id=>people.find(p=>p.id===id&&!p.archived));if(nodes.some(p=>!p))return [];
  const head='كما أخذته عن '+nodes.map(p=>p!.name).join('، عن ');
  if(!ref.prefix.startsWith(head)||ref.prefix.length>head.length&&!ref.prefix.slice(head.length).startsWith('، '))return [];
  let offset='كما أخذته عن '.length;
  return nodes.flatMap((p,i)=>{
   offset+=p!.name.length;const body=ref.prefix.slice(offset).replace(/^،\s*/u,'').trim();offset+='، عن '.length;
   try{validatePersonalBridge(p!.name,body);}catch{return [];}
   return [{id:`holding:${h.id}:${i}`,title:PERSONAL_BRIDGE_TITLE+p!.name,anchorName:p!.name,body}];
  });
 });
}

/** Restore only a saved, identity-backed endpoint with its exact reviewed continuation. */
export function savedPrefixSelection(value:string,ids:string[],people:{id:string;name:string;archived:boolean}[],continuations:BuilderPrefixContinuation[]=[]){
 const last=people.find(p=>p.id===ids.at(-1)&&!p.archived);if(!last)return '';
 if(reachesJunction({personalChain:'كما أخذته عن '+last.name,junction:'jazari'})&&reachesJunction({personalChain:value,junction:'jazari'}))return DIRECT_JAZARI_ID;
 const choices=continuations.filter(c=>{const anchor=key(prefixBridgeAnchor(c)),name=key(last.name);return anchor&&(name===anchor||name.endsWith(' '+anchor))&&c.body.trim()&&value.trim().endsWith(c.body.trim());});
 return choices.length===1?choices[0].id:'';
}
