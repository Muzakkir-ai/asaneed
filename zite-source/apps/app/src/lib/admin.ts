import { zite } from 'zitejs/db';
/** App-level administrators, managed in the "App Admins" database table. Server-only. */
export const isAppAdmin = async (email: string | undefined | null): Promise<boolean> => {
  const e = (email || '').trim().toLowerCase();
  if (!e) return false;
  const { records:users } = await zite.appUsers.findAll({ limit: 2000 });
  const identity=users.find(u=>(u.email||'').trim().toLowerCase()===e);
  if(identity)return identity.role==='Admin'&&(identity.active===true);
  const { records } = await zite.appAdmins.findAll({ limit: 500 });
  return records.some(r => r.active && (r.email || '').trim().toLowerCase() === e);
};
