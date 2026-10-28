import {context} from '../compat/context';
export const isAppAdmin=async (_email?:string|null)=>context().account.role==='admin'&&context().account.active;
