import {createContext,useContext,type ReactNode} from 'react';
import type {SanadPositionLabel} from '../lib/sanadPresentation';
const Context=createContext<{labels:SanadPositionLabel[];preview:boolean}|null>(null);
export const useSanadNodePresentation=()=>useContext(Context);
export default function SanadNodePresentation({labels,preview=false,children}:{labels:SanadPositionLabel[];preview?:boolean;children:ReactNode}){
 return <Context.Provider value={{labels,preview}}>{children}</Context.Provider>;
}
