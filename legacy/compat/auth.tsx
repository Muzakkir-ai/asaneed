'use client';
import {createContext,useContext} from 'react';
import type {User} from './context';
export const UserContext=createContext<User|null>(null);
export function useAuth(){return {user:useContext(UserContext),isLoading:false};}
const refetch=async (_options?:unknown)=>({});
export function useSession(){return {refetch};}
export function loginWithRedirect(){window.location.assign('/login');}
export async function logout(){await fetch('/api/workspace/session',{method:'DELETE'});window.location.assign('/login');}
