'use client';
import dynamic from 'next/dynamic';
import {UserContext} from '../../legacy/compat/auth';
import type {User} from '../../legacy/compat/context';
const OriginalApp=dynamic(()=>import('../../legacy/App'),{ssr:false});
export default function StudioClient({user}:{user:User}){return <UserContext.Provider value={user}><div className="zite-app"><OriginalApp/></div></UserContext.Provider>;}
