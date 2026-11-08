import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import {redirect} from 'next/navigation';
import {managementSession} from '../../../lib/manage-session';
import QurraTransmissionWorkspace from './client';
import '../studio.css';

export const dynamic='force-dynamic';

/** Standalone authenticated research workspace; the existing studio
 * certificate/sanad screens are deliberately not modified or replaced.
 */
export default async function QurraDiagramsPage(){
 const {account}=await managementSession();
 if(!account?.active)redirect('/manage');
 if(account.role==='student')redirect('/studio');
 return <div className="zite-app min-h-screen bg-background text-foreground">
  <QurraTransmissionWorkspace/>
 </div>;
}
