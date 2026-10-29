import {NextResponse} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
export const dynamic='force-dynamic';
async function administrator(){
 const client=await createClient();const {data}=await client.auth.getClaims();
 if(!data?.claims.sub)throw Error('Sign in required');
 const actor=await client.from('accounts').select('role,active').eq('auth_user_id',data.claims.sub).single();
 if(!actor.data?.active||actor.data.role!=='admin')throw Error('Administrator required');
 return client;
}
export async function GET(){try{
 const client=await administrator();
 const [students,links,certificates]=await Promise.all([client.from('students').select('id,display_name').order('display_name'),client.from('student_accounts').select('*'),client.from('certificates').select('student_id,status')]);
 if(students.error||links.error||certificates.error)throw Error('Unable to load student links');
 return NextResponse.json({students:(students.data||[]).map(s=>({id:s.id,name:s.display_name,accountId:links.data?.find(l=>l.student_id===s.id)?.account_id||'',certificates:certificates.data?.filter(c=>c.student_id===s.id).length||0,published:certificates.data?.filter(c=>c.student_id===s.id&&c.status==='finalized').length||0}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unavailable'},{status:403});}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Forbidden origin'},{status:403});
 try{const client=await administrator();const body=await request.json();
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(body.studentId)||body.accountId&&!uuid.test(body.accountId))throw Error('Choose a student and account');
 const {error}=await client.rpc('set_student_account',{student:body.studentId,account:body.accountId||null});if(error)throw Error(error.message);
 return NextResponse.json({success:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save link'},{status:400});}
}
