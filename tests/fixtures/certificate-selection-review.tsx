'use client';
import {useEffect,useState} from 'react';
import CertificateForm from '../../legacy/components/CertificateForm';
import '../../app/studio/studio.css';
export default function Review(){const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);if(!ready)return null;return <div className="zite-app"><CertificateForm selectedIssuer="guest:00000000-0000-4000-8000-000000000001" cert={null} asaneed={[]} shaykhs={[]} isAdmin currentUserId="fixture" onBack={()=>{}} onClose={()=>{}} onSaved={()=>{}}/></div>;}
