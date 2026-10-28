'use client';
import dynamic from 'next/dynamic';
const Verification=dynamic(()=>import('../../../legacy/components/CertificateVerificationPage'),{ssr:false});
export default function VerifyClient(){return <div className="zite-app"><Verification/></div>;}
