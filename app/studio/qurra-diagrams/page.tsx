import {redirect} from 'next/navigation';
import {managementSession} from '../../../lib/manage-session';

export const dynamic='force-dynamic';

/** Keep the old preview URL working, but render all diagrams inside the
 * normal authenticated studio sidebar, theme, language and account context.
 */
export default async function QurraDiagramsPage(){
 const {account}=await managementSession();
 if(!account?.active)redirect('/manage');
 if(!(account.can_issue??account.role!=='student'))redirect('/studio');
 redirect('/studio?page=qurra-diagrams');
}
