'use client';
import {setSessionRefresher} from './lib/sessionRecovery';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, useSession, loginWithRedirect, logout } from 'zitejs/auth';
import { getDashboard, saveProfile, assetSource, GetDashboardOutputType } from './lib/api';
import { applyAssets } from './lib/assets';
import AssetSourcePanel from './components/AssetSourcePanel';
import SanadSectionEditor from './components/SanadSectionEditor';
import RiwayahColorsEditor from './components/RiwayahColorsEditor';
import { Input } from '@project/components/ui/input';
import { Toaster } from '@project/components/ui/sonner';
import { Button } from '@project/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { LogOut, BookOpen, Moon, Sun, Languages } from 'lucide-react';
import { toast } from 'sonner';
import CertificatesView from './components/CertificatesView';
import IjazahHoldingsView from './components/IjazahHoldingsView';
import CertificatePrint from './components/CertificatePrint';
import ShaykhPrintProfileForm from './components/ShaykhPrintProfileForm';
import DataBackupPanel from './components/DataBackupPanel';
import NarratorDirectoryPage from './components/NarratorDirectoryPage';
import AdditionalShaykhsPage from './components/AdditionalShaykhsPage';
import MyCertificatesPage from './components/MyCertificatesPage';
import UsersManager from './components/UsersManager';
import CertificateVerificationPage from './components/CertificateVerificationPage';

export type Data = GetDashboardOutputType;
export type Cert = Data['certificates'][0];

export default function App(){
  const [assetsReady,setAssetsReady]=useState(false);
  useEffect(()=>{assetSource({}).then(r=>applyAssets(r.repository,r.branch)).catch(()=>{}).finally(()=>setAssetsReady(true));},[]);
  if(!assetsReady)return <div className="min-h-screen grid place-items-center text-muted-foreground">جارٍ التحميل…</div>;
  if(window.location.pathname.startsWith('/verify/'))return <CertificateVerificationPage/>;
  return <PrivateApp/>;
}

function PrivateApp() {
  const { user, isLoading } = useAuth();
  const session=useSession();
  const [sessionExpired,setSessionExpired]=useState(false);
  const [loadError,setLoadError]=useState('');
  const [refreshing,setRefreshing]=useState(false);
  useEffect(()=>{
   setSessionRefresher(async()=>session.refetch({query:{disableCookieCache:true}}));
   const expire=()=>setSessionExpired(true);
   window.addEventListener('asaneed-session-expired',expire);
   return()=>{setSessionRefresher(undefined);window.removeEventListener('asaneed-session-expired',expire);};
  },[session.refetch]);
  const activeUserId=useRef<string | undefined>(user?.id);
  activeUserId.current=user?.id;
  const [data, setData] = useState<Data | null>(null);
  const [printing, setPrinting] = useState<Cert | null>(null);
  const [profileName, setProfileName] = useState('');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [dark,setDark]=useState(()=>typeof localStorage!=='undefined'&&localStorage.getItem('asaneed-theme')==='dark');
  const [language,setLanguage]=useState<'ar'|'en'>(()=>localStorage.getItem('asaneed-language')==='en'?'en':'ar');
  const tx=(ar:string,en:string)=>language==='ar'?ar:en;
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('asaneed-theme',dark?'dark':'light');},[dark]);
  // Never retain a previous account's certificates or print selection in client state.
  useEffect(()=>{setData(null);setPrinting(null);setDisplayName(null);},[user?.id]);

  useEffect(() => {
    document.documentElement.dir = language==='ar'?'rtl':'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('asaneed-language',language);
  }, [language]);
  useEffect(() => {
    if (!isLoading && !user) loginWithRedirect();
  }, [isLoading, user]);

  const load = useCallback(async () => {
    const requestedUser=user?.id;
    if(!requestedUser)return;
    setLoadError('');setRefreshing(true);
    try {
      const dashboard=await getDashboard({});
      if(activeUserId.current===requestedUser)setData(dashboard);
    } catch(e) {
      if(activeUserId.current===requestedUser)setLoadError(e instanceof Error?e.message:'تعذّر تحميل البيانات');
    }finally{if(activeUserId.current===requestedUser)setRefreshing(false);}
  }, [user?.id]);
  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if(sessionExpired)return <div className="min-h-screen grid place-items-center p-6" dir="rtl"><div role="alert" className="max-w-lg space-y-4 rounded-xl border p-6"><h1 className="text-xl font-bold">انتهت جلسة الدخول</h1><p>سجّل الدخول مرة أخرى للمتابعة. لم تُلغَ صلاحياتك ولم تُحذف بياناتك.</p><Button onClick={()=>loginWithRedirect()}>تسجيل الدخول والمتابعة</Button></div></div>;
  if (isLoading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">جارٍ التحميل…</div>;

  const shaykhName = displayName || user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const isAdmin = !!data?.isAdmin;
  const isStaff=user.role!=='student';
  const changeName = async () => {
    if (profileName.trim().length < 2) return toast.error('أدخل اسماً صحيحاً');
    setSavingProfile(true);
    try { await saveProfile({ name: profileName.trim() }); setDisplayName(profileName.trim()); toast.success('تم تحديث الاسم'); }
    catch { toast.error('تعذر تحديث الاسم'); }
    finally { setSavingProfile(false); }
  };

  if (printing && data) {
    const linkedSanad = data.asaneed.find((s) => s.id === printing.sanadId);
    const sanad = printing.snapshotChain ? {...(linkedSanad||{id:printing.sanadId,title:'',qiraahName:'',shaykhId:printing.shaykhId}),chain:printing.snapshotChain} : linkedSanad;
    // An administrator previewing someone else's certificate must never become
    // the fallback mujeez merely because the issuer's profile is still loading.
    const issuerFallback=printing.shaykhName||(printing.shaykhId===user.id?shaykhName:'');
    return <CertificatePrint cert={printing} sanad={sanad} shaykhName={issuerFallback} onClose={() => setPrinting(null)} onFinalized={result=>{
      setPrinting(current=>current?.id===printing.id?{...current,publicationStatus:'final',snapshotChain:result.chain,snapshotHeading:result.heading,snapshotFormatting:result.formatting}:current);
      void load();
    }} />;
  }

  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="studio-header bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 sm:py-5 flex items-center justify-between gap-2 sm:gap-4">
          <div className="studio-header-brand flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full bg-accent grid place-items-center"><BookOpen className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-2xl font-bold leading-tight">منصة الأسانيد والإجازات</h1>
              <p className="text-xs sm:text-sm opacity-80 truncate">مرحباً، الشيخ {shaykhName}</p>
            </div>
          </div>
          <div className="studio-header-actions flex gap-2 items-center">{isAdmin&&<a className="studio-admin-tools text-sm underline text-white" href="/control">إدارة الحسابات والبيانات</a>}
          <Button size="sm" variant="outline" className="gap-2 bg-transparent text-white border-white/60 hover:bg-white/15 hover:text-white focus-visible:ring-white" onClick={()=>setDark(v=>!v)}>{dark?<Sun className="h-4 w-4" aria-hidden="true"/>:<Moon className="h-4 w-4" aria-hidden="true"/>}<span>{dark?'Light':'Dark'}</span></Button>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent text-white border-white/60 hover:bg-white/15 hover:text-white focus-visible:ring-white" onClick={()=>setLanguage(v=>v==='ar'?'en':'ar')}><Languages className="h-4 w-4" aria-hidden="true"/><span>{language==='ar'?'English':'العربية'}</span></Button>
          <Button variant="ghost" className="shrink-0 px-2 sm:px-4 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" onClick={() => logout()}>
            <LogOut className="h-4 w-4 sm:me-2" /> <span className="hidden sm:inline">خروج</span>
          </Button></div>
        </div>
        <div className="h-1 bg-accent" />
      </header>
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue={isStaff?"certs":"mycerts"} dir={language==='ar'?'rtl':'ltr'}>
          <div className="-mx-3 sm:mx-0 mb-6 overflow-x-auto px-3 sm:px-0"><TabsList className="w-max">
            {isStaff&&<TabsTrigger value="certs">{tx('الطلاب والشهادات','Students & Certificates')}</TabsTrigger>}
            <TabsTrigger value="mycerts">{tx('شهاداتي','My Certificates')}</TabsTrigger>
            {isStaff&&<TabsTrigger value="asaneed">{tx('أسانيدي','My Asaneed')}</TabsTrigger>}
            {isStaff&&<TabsTrigger value="narrators">{tx('رجال الأسانيد','Narrator Directory')}</TabsTrigger>}
            {isAdmin&&<TabsTrigger value="shared-sanads">{tx('إدارة الأسانيد','Sanad Management')}</TabsTrigger>}
            {isAdmin&&<TabsTrigger value="extra-sheikhs">{tx('المشايخ الإضافيون','Additional Shaykhs')}</TabsTrigger>}
            {isAdmin&&<TabsTrigger value="users">{tx('المستخدمون','Users')}</TabsTrigger>}
            <TabsTrigger value="profile">{tx('الملف الشخصي','Profile')}</TabsTrigger>
          </TabsList></div>
          <TabsContent value="certs">
            <CertificatesView loading={refreshing} error={loadError} onRetry={load} data={data} currentUserId={user.id} onChange={load} onPrint={setPrinting} />
          </TabsContent>
          <TabsContent value="asaneed"><IjazahHoldingsView key={user.id}/></TabsContent>
          <TabsContent value="mycerts"><MyCertificatesPage key={user.id} onPrint={setPrinting}/></TabsContent>
          <TabsContent value="narrators"><NarratorDirectoryPage/></TabsContent>
          {isAdmin&&<TabsContent value="shared-sanads"><div className="space-y-5"><RiwayahColorsEditor/><SanadSectionEditor/></div></TabsContent>}
          {isAdmin&&<TabsContent value="extra-sheikhs"><AdditionalShaykhsPage onSaved={load}/></TabsContent>}
          {isAdmin&&<TabsContent value="users"><UsersManager/></TabsContent>}
          <TabsContent value="profile"><div className="max-w-xl space-y-4"><div className="space-y-3 rounded-lg border p-5"><h2 className="text-xl font-bold">تعديل اسم المستخدم</h2><p className="text-sm text-muted-foreground">اسمك الحالي: {shaykhName}</p><Input placeholder="الاسم الجديد" value={profileName} onChange={e=>setProfileName(e.target.value)} /><Button disabled={savingProfile} onClick={changeName}>حفظ الاسم</Button></div><ShaykhPrintProfileForm key={user.id}/>{isAdmin&&<AssetSourcePanel/>}{isAdmin&&<DataBackupPanel/>}</div></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
