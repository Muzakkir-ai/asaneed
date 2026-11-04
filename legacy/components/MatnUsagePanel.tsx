import {useEffect,useState} from 'react';
import {contentManagement} from '../lib/api';
import type {MatnUsage} from '../lib/matnUsage';
import {MatnPreview,parseMatnFormat} from './MatnFormatting';
export default function MatnUsagePanel({catalogId}:{catalogId:string}){
 const [rows,R]=useState<MatnUsage[]>([]),[error,E]=useState(''),[loading,L]=useState(true);
 useEffect(()=>{let live=true;L(true);E('');contentManagement({action:'holdings',catalogId}).then(data=>{if(live)R(data.holdings||[]);}).catch(e=>{if(live)E(e instanceof Error?e.message:'تعذر تحميل الأسانيد');}).finally(()=>{if(live)L(false);});return()=>{live=false;};},[catalogId]);
 if(loading)return <p role="status">جارٍ تحميل أسانيد المستخدمين…</p>;if(error)return <p role="alert">{error}</p>;
 return <section className="space-y-3 mt-3"><p className="text-sm text-muted-foreground">{rows.length} سند مرتبط بهذا المتن — للعرض فقط. تعديل بيانات المتن لا يغيّر أسانيد أصحابه.</p>{rows.map(row=><details className="rounded-lg border p-3" key={row.id}><summary className="cursor-pointer font-semibold">{row.ownerName}<span className="ms-2 text-xs text-muted-foreground">{row.source==='personal'?'سند شخصي':'شيخ إضافي'}</span></summary><div className="space-y-3 mt-3"><MatnPreview bare sanad={row.sanadText} wording={row.wordingText} formats={parseMatnFormat(row.sanadFormatting)}/></div></details>)}{!rows.length&&<p>لم يُحفظ سند مرتبط بهذا المتن بعد.</p>}</section>;
}
