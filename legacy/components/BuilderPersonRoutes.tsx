import {builderPersonRoutes} from '../lib/builderPersonRoutes';
import {type BuilderLibrary,builderRouteName} from '../lib/bookBuilder';
import {displayRawi} from '../lib/qurra';
export default function BuilderPersonRoutes({lib,personId}:{lib:BuilderLibrary;personId:string}){
 const memberships=builderPersonRoutes(lib,personId);
 return <div className="space-y-2"><h4 className="text-sm font-semibold">الكتب والطرق التي ورد فيها</h4>{memberships.length?memberships.map(({route,book,author,levels})=><div className="rounded border p-2 text-sm" key={route.id}><p>{builderRouteName(book,route)}</p><p className="text-xs text-muted-foreground">{displayRawi(route.qari_id,route.rawi)} · {route.reading_scope==='sughra'?'العشر الصغرى':route.reading_scope==='kubra'?'العشر الكبرى':'النوع غير مصنف'}{author?' · صاحب الكتاب':''}{levels.map(level=>' · '+(level==='upper'?'صاحب الطريق الأعلى':level==='branch'?'صاحب الطريق الفرعي':'صاحب طريق غير مصنف')).join('')}</p></div>):<p className="text-xs text-muted-foreground">لم يُسجل هذا الشخص في طريق منظم محفوظ. النصوص القديمة لا تُربط بالهوية تلقائيًا.</p>}</div>;
}
