import {QURRA,routeFor,readingText,displayRawi,plainReadingName,type ReadingSelection} from '../lib/qurra';
import {Checkbox} from '@project/components/ui/checkbox';
import {Card,CardContent,CardHeader,CardTitle} from '@project/components/ui/card';
import {Input} from '@project/components/ui/input';
import {useState} from 'react';
export default function QurraPicker({onChange}:{onChange:(value:{selection:ReadingSelection[];route:string;personal:string})=>void}) {
  const [selection,setSelection]=useState<ReadingSelection[]>([]);
  const [personal,setPersonal]=useState('');
  const notify=(next:ReadingSelection[],chain=personal)=>{setSelection(next);onChange({selection:next,route:routeFor(next.map(v=>v.qariId)),personal:chain});};
  const pick=(id:string, rawi?:string)=>{
    const exists=selection.some(x=>x.qariId===id&&x.rawi===rawi);
    notify(exists?selection.filter(x=>!(x.qariId===id&&x.rawi===rawi)):[...selection,{qariId:id,rawi}]);
  };
  const route=routeFor(selection.map(x=>x.qariId));
  return <Card><CardHeader><CardTitle>اختيار الإجازات من القراء العشرة ورواتهم</CardTitle><p className="text-sm text-muted-foreground">اختر القراءة كاملة أو رواية بعينها. يمكن اختيار أكثر من إجازة. لا تُضاف أسانيد الأئمة تلقائياً حتى يتم توثيقها وإدخالها.</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2">{QURRA.map((q,i)=><div className="rounded-lg border p-3 space-y-2" key={q.id}><p className="font-semibold">{i+1}. {plainReadingName(q.imam)}</p><label className="flex items-center gap-2"><Checkbox checked={selection.some(s=>s.qariId===q.id&&!s.rawi)} onCheckedChange={()=>pick(q.id)}/> القراءة بروايتي {q.rawis.map(r=>displayRawi(q.id,r)).join(' و')}</label><div className="grid grid-cols-2 gap-2">{q.rawis.map((r,index)=><label key={index} className="flex items-center gap-2 text-sm"><Checkbox checked={selection.some(s=>s.qariId===q.id&&s.rawi===r)} onCheckedChange={()=>pick(q.id,r)}/>{displayRawi(q.id,r)}</label>)}</div></div>)}</div>{route&&<p className="rounded-md bg-muted p-3 text-center font-sanad">{route}</p>}<div className="space-y-1"><label className="font-medium">السند الشخصي إلى نقطة الالتقاء التي تختارها أدناه</label><textarea value={personal} rows={4} className="w-full rounded-md border bg-background p-3 font-sanad" placeholder="اكتب سندك الشخصي حتى إبراهيم العُبيدي أو الإمام ابن الجزري، كما في إجازتك" onChange={e=>{setPersonal(e.target.value);onChange({selection,route,personal:e.target.value});}}/></div>{selection.length>0&&<div className="rounded-md border p-3"><p className="font-medium mb-1">الإجازات المختارة</p>{selection.map((v,i)=><p key={`${v.qariId}-${v.rawi||''}-${i}`} className="font-sanad">{readingText(v)}</p>)}</div>}</CardContent></Card>;
}
