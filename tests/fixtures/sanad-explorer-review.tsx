'use client';
import {useEffect,useState} from 'react';
import SanadExplorer from '../../legacy/components/SanadExplorer';
import {WorkspaceSidebar} from '../../legacy/components/WorkspaceNavigation';
import '../../app/studio/studio.css';
export default function Review(){
 const [ready,setReady]=useState(false),[admin,setAdmin]=useState(true),[selected,setSelected]=useState('sanad-explorer');
 useEffect(()=>setReady(true),[]);
 if(!ready)return null;
 return <div className="zite-app" dir="rtl"><div className="workspace-shell"><WorkspaceSidebar active={selected} onSelect={setSelected} admin={admin} staff collapsed={false} onCollapse={()=>{}} onLogout={()=>{}} dark={false} onTheme={()=>{}} onLanguage={()=>{}}/><main className="workspace-main min-w-0 p-3"><button onClick={()=>setAdmin(v=>!v)}>تبديل الصلاحية التجريبية</button><SanadExplorer key={String(admin)} canViewShaykhs={admin}/></main></div></div>;
}
