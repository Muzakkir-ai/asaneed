import {Textarea} from '@project/components/ui/textarea';
import {reachesJunction} from '../lib/personalSanadValidation';
import {type BuilderPrefixContinuation} from '../lib/builderPrefix';
export default function BuilderPrefixInput({value,onChange,continuations=[],selectedId,onSelect}:{value:string;onChange:(v:string)=>void;continuations?:BuilderPrefixContinuation[];selectedId:string;onSelect:(id:string)=>void}){
 const ubaydi=reachesJunction({personalChain:value,junction:'ubaydi'})&&!reachesJunction({personalChain:value,junction:'jazari'});
 return <div className="space-y-2"><label className="block text-sm space-y-1">السند الشخصي إلى إبراهيم العبيدي أو الإمام ابن الجزري<Textarea rows={4} value={value} onChange={e=>onChange(e.target.value)} placeholder="عن الشيخ… حتى إبراهيم العبيدي أو الإمام ابن الجزري"/></label>{ubaydi&&<><p className="text-xs text-muted-foreground">تُضاف التتمة المحفوظة إلى ابن الجزري بفروعها، ثم إسناد الكتاب والطريق. راجع السند الكامل قبل الحفظ.</p>{continuations.length>1&&<label className="block text-sm">التتمة المحفوظة<select aria-label="تتمة إبراهيم العبيدي إلى ابن الجزري" value={selectedId} onChange={e=>onSelect(e.target.value)} className="block w-full rounded border bg-background p-2"><option value="">اختر التتمة</option>{continuations.map(c=><option key={c.id} value={c.id}>{c.title} · {c.id.slice(0,8)}</option>)}</select></label>}</>}</div>;
}
