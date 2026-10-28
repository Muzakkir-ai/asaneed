import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import {redirect} from 'next/navigation';
import {managementSession} from '../../lib/manage-session';
import StudioClient from './client';
import './studio.css';
export const dynamic='force-dynamic';
export default async function Studio(){const {account,claims}=await managementSession();if(!account?.active)redirect('/manage');const user={id:claims.sub,email:typeof claims.email==='string'?claims.email:''};return <StudioClient user={{id:user.id,email:user.email??'',name:account.display_name,image:null,role:account.role}}/>;}
