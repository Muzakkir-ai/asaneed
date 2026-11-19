import {useState} from 'react';
import {GitBranch,Network,Users} from 'lucide-react';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@project/components/ui/tabs';
import NarratorDirectoryPage from './NarratorDirectoryPage';
import ShaykhSanadTree from './ShaykhSanadTree';
import QurraTransmissionWorkspace from '../../app/studio/qurra-diagrams/client';
export type SanadExplorerView='narrators'|'qurra'|'sheikhs';
export default function SanadExplorer({initialView='narrators',canViewQurra=true,canViewShaykhs=false}:{initialView?:SanadExplorerView;canViewQurra?:boolean;canViewShaykhs?:boolean}){
 const views=[{id:'narrators',label:'رجال الأسانيد',Icon:Network},{id:'qurra',label:'أسانيد القراء',Icon:GitBranch},{id:'sheikhs',label:'أسانيد المشايخ',Icon:Users}].filter(item=>item.id==='narrators'||item.id==='qurra'&&canViewQurra||item.id==='sheikhs'&&canViewShaykhs);
 const [view,setView]=useState(()=>{const requested=typeof window==='undefined'?initialView:new URLSearchParams(window.location.search).get('view')||initialView;return views.some(item=>item.id===requested)?requested:'narrators';});
 const select=(next:string)=>{if(!views.some(item=>item.id===next))return;setView(next);const url=new URL(window.location.href);url.searchParams.set('page','sanad-explorer');url.searchParams.set('view',next);window.history.replaceState(window.history.state,'',url);};
 return <section className="sanad-explorer min-w-0 space-y-4" dir="rtl">
  <header><h1 className="text-2xl font-bold">الأسانيد ورجالها</h1><p className="mt-1 text-sm text-muted-foreground">دليل الرواة ومسارات القراء والمشايخ في مكان واحد.</p></header>
  <Tabs value={view} onValueChange={select} dir="rtl">
   <TabsList aria-label="أقسام الأسانيد" className={"mb-4 grid h-auto w-full gap-1 rounded-xl border bg-card p-1 "+(views.length===3?"grid-cols-3":views.length===2?"grid-cols-2":"grid-cols-1")}>{views.map(({id,label,Icon})=><TabsTrigger key={id} value={id} className="flex min-w-0 items-center justify-center gap-2 whitespace-normal rounded-lg px-2 py-3 text-sm"><Icon size={18} className="shrink-0"/><span>{label}</span></TabsTrigger>)}</TabsList>
   <div className="min-w-0 rounded-2xl border bg-card p-3 sm:p-5">
    <TabsContent value="narrators" className="m-0"><NarratorDirectoryPage/></TabsContent>
    {canViewQurra&&<TabsContent value="qurra" className="m-0"><QurraTransmissionWorkspace/></TabsContent>}
    {canViewShaykhs&&<TabsContent value="sheikhs" className="m-0"><ShaykhSanadTree/></TabsContent>}
   </div>
  </Tabs>
 </section>;
}
