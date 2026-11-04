"use client";
import ShaykhMatnCards from '../../legacy/components/ShaykhMatnCards';
import ShaykhReadingsList from '../../legacy/components/ShaykhReadingsList';
import {MatnHeadingControls} from '../../legacy/components/MatnHeadingControls';
import {DEFAULT_MATN_HEADING} from '../../legacy/lib/matnPresentation';
import type {Artwork} from '../../legacy/lib/artworkCatalog';
import {useState} from 'react';
import {Button} from '../../legacy-ui/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter} from '../../legacy-ui/ui/dialog';
import {BookOpen,ScrollText} from 'lucide-react';
import '../studio/studio.css';
export default function Review(){const [open,O]=useState(false),[heading,H]=useState(DEFAULT_MATN_HEADING);const art:Artwork[]=[{kind:'books',number:'02',line:'heading',path:'svg/books/02/heading.svg',label:'المقدمة الجزرية',width:186.29,height:48.19}];return <div className="zite-app" dir="rtl" style={{padding:40,maxWidth:1000,margin:'auto'}}><h1>فحص الواجهة — بيانات تجريبية</h1><div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" className="workspace-action-card h-24 text-lg"><span className="workspace-card-icon"><BookOpen/></span>قسم القراءات</Button><Button variant="outline" className="workspace-action-card h-24 text-lg"><span className="workspace-card-icon"><ScrollText/></span>قسم المتون</Button></div><h2>متون الشيخ</h2><ShaykhMatnCards mutoon={[{name:"المقدمة الجزرية",category:"التجويد"},{name:"تحفة الأطفال",category:"التجويد"}]} onOpen={()=>O(true)}/><h2>روايات الشيخ</h2><ShaykhReadingsList readings={[{qariId:"nafi",rawi:"قالون"},{qariId:"asim",rawi:"حفص"}]} routes={[]} labelRoute={(n,name)=>name} onEdit={()=>O(true)}/><MatnHeadingControls name="المقدمة الجزرية" value={heading} onChange={H} artwork={art} base="https://cdn.jsdelivr.net/gh/Muzakkir-ai/fonts@ac3a0a0f6e5f8fb96d84dc1bb7be41fc021f31a8"/><Button onClick={()=>O(true)}>عرض النافذة</Button><Dialog open={open} onOpenChange={O}><DialogContent dir="rtl"><DialogHeader><DialogTitle>إضافة شهادة — فحص تجريبي</DialogTitle></DialogHeader><p>تحقق من المسافة بين أزرار النافذة.</p><DialogFooter><Button variant="outline" onClick={()=>O(false)}>رجوع إلى المُجيز</Button><Button>حفظ المسودة</Button></DialogFooter></DialogContent></Dialog></div>}
