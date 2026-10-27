import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { logout } from '../login/actions';
export const dynamic = 'force-dynamic';
export default async function Manage() {
 const client = await createClient();
 const { data, error } = await client.auth.getClaims();
 if (error || !data?.claims?.sub) redirect('/login');
 const { data: account, error: accountError } = await client.from('accounts').select('id,display_name,role,active').eq('auth_user_id',data.claims.sub).maybeSingle();
 if (accountError) return <section className="panel"><h1>تعذر تحميل الحساب</h1><p role="alert">حدث خطأ في الاتصال. يرجى إعادة المحاولة.</p></section>;
 if (!account?.active) return <section className="panel"><h1>الحساب بانتظار التفعيل</h1><p>يرجى التواصل مع إدارة المنصة لتفعيل صلاحيات الحساب.</p><form action={logout}><button>تسجيل الخروج</button></form></section>;
 return <section className="panel"><h1>مرحبًا، {account.display_name}</h1><p>تم التحقق من حسابك. يجري تجهيز أدوات الإدارة ونقل البيانات.</p><form action={logout}><button>تسجيل الخروج</button></form></section>;
}
