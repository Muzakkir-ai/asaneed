import {reachesJunction} from './personalSanadValidation';
export const UBAYDI_BRIDGE_TITLE='من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند';
export type BuilderPrefixContinuation={id:string;title:string;body:string};
/** Preserve the reviewed source verbatim, including its textual branch markers. */
export function resolveBuilderPrefix(prefix:string,continuations:BuilderPrefixContinuation[]=[],selectedId=''){
 const text=prefix.trim();
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
