'use client';
import MeetingPointSelector from '../../legacy/components/MeetingPointSelector';
import {useCardTouchFeedback} from '../../legacy/lib/useCardTouchFeedback';
import {useState} from 'react';
import {Eye,Plus,Trash2,BookOpen} from 'lucide-react';
import {WorkspaceSidebar} from '../../legacy/components/WorkspaceNavigation';
import SharedContentPage from '../../legacy/components/SharedContentPage';
import {Button} from '../../legacy-ui/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '../../legacy-ui/ui/card';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '../../legacy-ui/ui/tabs';
import CertificateRecordMenu from '../../legacy/components/CertificateRecordMenu';
import '../../app/studio/studio.css';
export default function Review(){
 useCardTouchFeedback();
 const [active,setActive]=useState('shared-texts'),[dark,setDark]=useState(false),[collapsed,setCollapsed]=useState(false),[message,setMessage]=useState(''),[junction,setJunction]=useState('');
 return <div className="zite-app min-h-screen bg-background text-foreground" dir="rtl"><div className={'workspace-shell '+(collapsed?'sidebar-collapsed':'')}>
 <WorkspaceSidebar active={active} onSelect={setActive} admin staff collapsed={collapsed} onCollapse={()=>setCollapsed(v=>!v)} onLogout={()=>setMessage('خروج')} dark={dark} onTheme={()=>{setDark(v=>!v);document.documentElement.classList.toggle('dark');}} onLanguage={()=>{}}/>
 <header className="studio-header bg-primary p-4 text-white"><h1 className="studio-header-brand">الأسانيد والإجازات</h1></header>
 <main className="p-5 space-y-5"><MeetingPointSelector value={junction} onChange={setJunction} options={[{value:'jazari',name:'الإمام ابن الجزري',description:'يصل سندي إليه مباشرة'},{value:'other',name:'أَحْمَد بن مُحَمَّد المقرئ',description:'من أسانيد القرآن المحفوظة'}]}/><button className="workspace-action-card w-full" data-testid="touch-card" onClick={()=>setMessage(v=>v+' tap')}><span className="workspace-card-icon"><BookOpen/></span><span className="workspace-card-title">فتح المتن</span><span className="workspace-card-arrow">←</span></button><button className="workspace-action-card" data-testid="disabled-card" disabled>غير متاح للمس</button><Card data-testid="nested-panel"><CardHeader><CardTitle>إدارة الكتب والطرق والأسانيد</CardTitle></CardHeader><CardContent><SharedContentPage/><Button variant="outline">إعدادات المكتبة</Button></CardContent></Card>
 <Card><CardHeader><CardTitle>شهاداتي</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><span className="workspace-card-icon" aria-hidden="true"><BookOpen/></span><strong>المقدمة الجزرية</strong></div>
 <Tabs defaultValue="certificates"><TabsList><TabsTrigger value="certificates">الشهادات</TabsTrigger><TabsTrigger value="students">الطلاب</TabsTrigger></TabsList><TabsContent value="certificates"><p>الشهادات المحفوظة</p></TabsContent><TabsContent value="students"><p>قائمة الطلاب</p></TabsContent></Tabs>
 <div className="flex flex-wrap gap-2"><Button onClick={()=>setMessage('إضافة')}><Plus/>إضافة شهادة</Button><Button variant="outline" onClick={()=>setMessage('عرض')}><Eye/>عرض الشهادة</Button><Button variant="outline" disabled><Plus/>غير متاح</Button><Button variant="destructive" onClick={()=>setMessage('حذف')}><Trash2/>حذف المسودة</Button><CertificateRecordMenu name="تجريبية" onDetails={()=>setMessage('تفاصيل')} onDelete={()=>setMessage('حذف')}/></div>
 <p role="status">{message}</p></CardContent></Card>
 </main></div></div>;
}
