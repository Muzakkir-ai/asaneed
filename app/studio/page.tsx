import {redirect} from 'next/navigation';
import {managementSession} from '../../lib/manage-session';
import StudioClient from './client';
import './studio.css';
export const dynamic='force-dynamic';
export default async function Studio(){const {client,account}=await managementSession();if(!account?.active)redirect('/manage');const {data:{user}}=await client.auth.getUser();if(!user)redirect('/login');return <StudioClient user={{id:user.id,email:user.email??'',name:account.display_name,image:null,role:account.role}}/>;}
