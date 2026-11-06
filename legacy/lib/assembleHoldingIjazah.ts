import {reachesJunction} from './personalSanadValidation';
import {assembleIjazah,type AssemblyHolding,type AssemblySection} from './assembleIjazah';
import {builderPreview,type BuilderLibrary} from './bookBuilder';
import {loadBuilderLibrary} from '../../lib/sanad-library';
import {context} from '../compat/context';
export type UnifiedHolding=AssemblyHolding&{unifiedSanad?:{version:number;routeId:string;prefix:string}|null};
/** New referenced holdings resolve current approved library data at explicit preparation.
 * Old copied chains remain complete compatibility input until reviewed conversion. */
export async function resolveHoldingSanad(holding:UnifiedHolding,library?:BuilderLibrary){
 const ref=holding.unifiedSanad;
 if(!ref)return holding.personalChain;
 if(ref.version!==1||!reachesJunction({personalChain:ref.prefix,junction:'jazari'}))throw Error('مرجع السند يحتاج مراجعة');
 const lib=library??await loadBuilderLibrary(context().client),route=lib.chains.find(c=>c.id===ref.routeId&&c.kind==='route'&&!c.archived&&c.confirmed),book=lib.books.find(b=>b.id===route?.book_id&&!b.archived),parent=lib.chains.find(c=>c.id===route?.book_chain_id&&!c.archived);
 if(!route||!book||!parent)throw Error('الطريق المعتمد غير متاح؛ راجع اختيار السند');
 if(route.qari_id!==holding.qariId||route.rawi!==holding.rawi)throw Error('تغير نطاق الرواية؛ لا يمكن تبديلها تلقائيًا');
 const result=builderPreview(book,parent,route,lib.people,ref.prefix);
 return result.text;
}

export async function assembleHoldingIjazah(holding:UnifiedHolding,sections:AssemblySection[],library?:BuilderLibrary){const personalChain=await resolveHoldingSanad(holding,library);return assembleIjazah({...holding,...(holding.unifiedSanad?{chainMode:'complete' as const}:{}),personalChain},sections);}
