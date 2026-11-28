import {context as requestContext} from '../compat/context';
import {personalIssuerName} from '../lib/issuerNames';
import {readingIdentityFromHeading} from '../lib/riwayahSvgHeading';
import {isAppAdmin} from '../lib/admin';
import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import {certificatePage} from '../lib/certificatePage';
import {displayReadingLabel} from '../lib/qurra';

const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';

const certificateSchema=z.object({
      id: z.string(), studentId:z.string().optional(), studentName: z.string(), completionDate: z.string(), hijriDayOffset:z.number(), sanadId: z.string(),
      qiraahName: z.string(), notes: z.string(), certificateNumber: z.number(), registrationNumber:z.string(),issuerKey:z.string(),qariId:z.string(),rawi:z.string(), publicationStatus:z.enum(['draft','final']), shaykhId:z.string(), shaykhName:z.string(), additionalShaykh:z.string(), snapshotChain:z.string(), snapshotHeading:z.string(), snapshotFormatting:z.string(),
    });
const filtersSchema=z.object({query:z.string().max(200),issuer:z.string().max(200),qari:z.string().max(200),rawi:z.string().max(200),year:z.string().max(10),status:z.enum(['all','draft','final']),sort:z.enum(['added','completion','completion-desc','name'])});
async function allPages<T>(read:(offset:number)=>Promise<{records:T[];hasMore:boolean}>){const records:T[]=[];for(let offset=0;;){const next=await read(offset);records.push(...next.records);if(!next.hasMore)return {records};if(!next.records.length)throw Error('تعذر استكمال تحميل الشهادات');offset+=next.records.length;}}
export default createEndpoint({
  description: "Loads the signed-in shaykh's asaneed and the certificates he has issued",
  authenticated: true,
  inputSchema: z.object({metadataOnly:z.boolean().optional(),listPage:z.object({filters:filtersSchema,view:z.enum(['certificates','students']),page:z.number().int().min(0).max(1000000)}).optional()}),
  outputSchema: z.object({
    isAdmin:z.boolean(),
    issuers:z.array(z.object({id:z.string(),name:z.string()})),
    shaykhs:z.array(z.object({id:z.string(),name:z.string()})),
    asaneed: z.array(z.object({ id: z.string(), title: z.string(), qiraahName: z.string(), chain: z.string(), shaykhId:z.string() })),
    certificates:z.array(certificateSchema),
    certificatePage:z.object({totalCertificates:z.number(),pages:z.number(),page:z.number(),years:z.array(z.string()),students:z.array(z.array(certificateSchema))}).optional(),
  }),
  execute: async ({ context,input }) => {
    const admin=(await isAppAdmin(context.user.email));
    if(input.metadataOnly&&input.listPage)throw Error('Invalid dashboard request');
    const request=requestContext(),scope=request.scope,filter=input.listPage?.filters;
    const pageSchema=z.object({ids:z.array(z.string().uuid()).max(150),groups:z.array(z.array(z.string().uuid())).max(15).optional(),totalCertificates:z.number().int().nonnegative(),pages:z.number().int().positive(),page:z.number().int().nonnegative(),years:z.array(z.string())});
    let databasePage:z.infer<typeof pageSchema>|undefined;
    if(scope&&!scope.system&&scope.role!=='student'&&input.listPage?.view==='certificates'&&filter&&!filter.query.trim()&&filter.issuer==='all'&&filter.qari==='all'&&filter.rawi==='all'&&filter.sort!=='name'&&(filter.year==='all'||/^[0-9]{4}$/.test(filter.year)&&Number(filter.year)>0&&Number(filter.year)<9999)){
      // A non-admin may have linked issuers whose personal identity belongs to another
      // account. Preserve the legacy ownership filter by falling back in that case.
      let eligible=admin||scope.issuerIds.length===0;
      if(!admin&&scope.issuerIds.length>0&&scope.issuerIds.length<=100){
        const profiles=await request.client.from('issuers').select('id,print_profile').in('id',scope.issuerIds);
        if(profiles.error)throw Error(profiles.error.message);
        eligible=(profiles.data||[]).length===scope.issuerIds.length&&(profiles.data||[]).every((i:any)=>!i.print_profile?.personalAccount||i.print_profile.personalAccount===scope.accountId);
      }
      if(eligible){
        const result=await request.client.rpc('certificate_list_page',{p_issuers:scope.issuerIds,p_year:filter.year==='all'?null:Number(filter.year),p_status:filter.status,p_sort:filter.sort,p_page:input.listPage.page});
        // Rolling deploy compatibility only: other errors must not silently load the entire database.
        if(result.error&&!['PGRST202','42883'].includes(result.error.code))throw Error(result.error.message);
        if(!result.error){databasePage=pageSchema.parse(result.data);request.certificateListIds=databasePage.ids;}
      }
    }
    const [{ records: qiraat }, { records: asaneed },users,extras,profiles] = await Promise.all([
      zite.qiraat.findAll({ limit: 2000 }),
      // Admins list certificates from all issuers, so resolve their linked sanads as well.
      // Only the signed-in issuer's sanads are exposed in the editable asaneed list.
      allPages(offset=>zite.asaneed.findAll({...(admin?{}:{filters:{shaykh:context.user.id}}),offset,limit:2000})),
      admin?zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000}):Promise.resolve({records:[context.user]}),
      zite.additionalShaykhs.findAll({limit:2000}),
      zite.shaykhPrintProfiles.findAll(admin?{limit:2000}:{filters:{ownerId:context.user.id},limit:2000}),
    ]);
    const directoryAccounts=admin?await requestContext().client.rpc('list_application_accounts'):null;
    if(directoryAccounts?.error)throw Error(directoryAccounts.error.message);
    const directoryProfiles=admin?await requestContext().client.from('issuers').select('id,display_name,print_profile'):null;
    if(directoryProfiles?.error)throw Error(directoryProfiles.error.message);
    const allAccounts:{id:string;name:string;email?:string}[]=admin?(directoryAccounts?.data||[]).filter((a:any)=>a.active&&a.role!=='student').map((a:any)=>({id:a.auth_user_id,name:a.display_name,email:a.email})):users.records;
    const accountNames=allAccounts.map(u=>({id:u.id,name:personalIssuerName(u.name||u.email||'',(directoryProfiles?.data||[]).find((i:any)=>i.print_profile?.personalAccount===(directoryAccounts?.data||[]).find((a:any)=>a.auth_user_id===u.id)?.id)?.print_profile?.printedName||profiles.records.find(p=>p.ownerId===u.id)?.printedName)}));
    const shaykhs=accountNames;
    const issuerMap=new Map<string,string>(extras.records.map(g=>['guest:'+g.id,g.name||'شيخ إضافي'] as [string,string]));
    for(const u of shaykhs)issuerMap.set('user:'+u.id,u.name);
    const issuers=[...issuerMap].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
    const shaykhNames=new Map(accountNames.map(u=>[u.id,u.name]));
    const guestNames=new Map<string,string>(extras.records.map(x=>[x.id,x.name||''] as [string,string]));
    // Enforce account isolation independently of the database query filter.
    const owns=(value:string|string[]|undefined)=>Array.isArray(value)?value.includes(context.user.id):value===context.user.id;
    const ownAsaneed=asaneed;
    const qName = new Map(qiraat.map((q) => [q.id, q.name ?? '']));
    const sanads = ownAsaneed.map((a) => ({
      id: a.id,
      title: a.title ?? '',
      qiraahName: qName.get(first(a.qiraah)) ?? '',
      chain: a.chain ?? '',
      shaykhId:first(a.shaykh),
    }));
    const readingBySanad = new Map(asaneed.map(a=>[
      a.id,
      displayReadingLabel((a.chain||'').match(/^【بيان القراءة:([^】]+)】/)?.[1]?.trim() || qName.get(first(a.qiraah)) || ''),
    ]));
    // Complex list filters use the same labels as the legacy renderer, not a second
    // implementation of scholarly reading-name rules in SQL. Only metadata is sent
    // to the invoker-scoped RPC; certificate rows remain in the database until picked.
    if(!databasePage&&scope&&!scope.system&&scope.role!=='student'&&input.listPage?.view==='certificates'&&filter&&(filter.year==='all'||/^[0-9]{4}$/.test(filter.year)&&Number(filter.year)>0&&Number(filter.year)<9999)&&scope.issuerIds.length<=100){
      const issuerProfiles=scope.issuerIds.length?await request.client.from('issuers').select('id,print_profile').in('id',scope.issuerIds):{data:[],error:null};
      if(issuerProfiles.error)throw Error(issuerProfiles.error.message);
      const profiles=issuerProfiles.data||[];
      // Linked historical guests have record-level identity rules; do not guess.
      if(profiles.length===scope.issuerIds.length&&profiles.every((i:any)=>i.print_profile?.loginLinked!==true&&(admin||!i.print_profile?.personalAccount||i.print_profile.personalAccount===scope.accountId))){
        const labels=Object.fromEntries(profiles.map((i:any)=>{
          const personal=i.print_profile?.personalAccount;
          const accountId=personal&&(admin&&!scope.inspection?(directoryAccounts?.data||[]).find((a:any)=>a.id===personal)?.auth_user_id:personal===scope.accountId?scope.authUserId:undefined);
          return [i.id,personal?{key:'user:'+(accountId||'guest:'+i.id),name:shaykhNames.get(accountId||'')||'شيخ غير مسمى'}:{key:'guest:'+i.id,name:guestNames.get(i.id)||shaykhNames.get(context.user.id)||'شيخ غير مسمى'}];
        }));
        const readings=Object.fromEntries([...readingBySanad].map(([id,label])=>{const identity=readingIdentityFromHeading(label);return [id,{label,qari:identity?.qariId||'',rawi:identity?.rawi||''}];}));
        const result=await request.client.rpc('certificate_filtered_page',{p_issuers:scope.issuerIds,p_readings:readings,p_issuer_labels:labels,p_filters:filter,p_view:input.listPage.view,p_page:input.listPage.page});
        if(result.error&&!['PGRST202','42883'].includes(result.error.code))throw Error(result.error.message);
        if(!result.error&&result.data?.fallback!==true){databasePage=pageSchema.parse(result.data);request.certificateListIds=databasePage.ids;}
      }
    }
    const [{records:certs},{records:snapshots}]=await Promise.all([
      input.metadataOnly?Promise.resolve({records:[]}):input.listPage?allPages(offset=>zite.certificates.findAll({...(admin?{}:{filters:{shaykh:context.user.id}}),offset,limit:2000})):zite.certificates.findAll(admin?{limit:2000}:{ filters: { shaykh: context.user.id }, limit: 2000 }),
      input.metadataOnly?Promise.resolve({records:[]}):input.listPage?allPages(offset=>zite.certificateSnapshots.findAll({...(admin?{}:{filters:{ownerId:context.user.id}}),offset,limit:2000})):zite.certificateSnapshots.findAll(admin?{limit:2000}:{filters:{ownerId:context.user.id},limit:2000}),
    ]);
    const ownCerts=admin?certs:certs.filter(c=>owns(c.shaykh));
    const ownSnapshots=admin?snapshots:snapshots.filter(s=>s.ownerId===context.user.id);
    const snapMap=new Map(ownSnapshots.map(s=>[s.certificateId,s]));
    const certificates=ownCerts
        .map((c) => ({
          id: c.id,
          studentId:c.studentId,
          studentName: c.studentName ?? '',
          completionDate: c.completionDate ?? '',
          hijriDayOffset:c.hijriDayOffset??0,
          sanadId: first(c.sanad),
          qiraahName: readingBySanad.get(first(c.sanad)) || snapMap.get(c.id)?.heading || '',
          notes: c.notes ?? '',
          registrationNumber:c.registrationNumber||'',
          certificateNumber: c.shahadaNumber ?? c.certificateNumber ?? 0,
          publicationStatus:c.publicationStatus==='draft'?('draft' as const):('final' as const),
          shaykhId:first(c.shaykh),
          additionalShaykh:c.additionalShaykh||'',
          issuerKey:c.additionalShaykh?'guest:'+c.additionalShaykh:'user:'+first(c.shaykh),
          qariId:readingIdentityFromHeading(readingBySanad.get(first(c.sanad))||snapMap.get(c.id)?.heading||'')?.qariId||'',
          rawi:readingIdentityFromHeading(readingBySanad.get(first(c.sanad))||snapMap.get(c.id)?.heading||'')?.rawi||'',
          shaykhName:(c.additionalShaykh&&guestNames.get(c.additionalShaykh))||shaykhNames.get(first(c.shaykh))||'شيخ غير مسمى',
          snapshotChain:snapMap.get(c.id)?.chain||'',
          snapshotHeading:snapMap.get(c.id)?.heading||'',
          snapshotFormatting:snapMap.get(c.id)?.formatting||'',
        }))
        .sort((a, b) => b.certificateNumber - a.certificateNumber);
    const byId=new Map(certificates.map(c=>[c.id,c]));
    if(databasePage&&databasePage.ids.some(id=>!byId.has(id)))throw Error('تغيّرت قائمة الشهادات؛ أعد المحاولة');
    const paged=databasePage?{...databasePage,certificates:input.listPage?.view==='students'?[]:databasePage.ids.map(id=>byId.get(id)!),students:(databasePage.groups||[]).map(ids=>ids.map(id=>byId.get(id)!))}:input.listPage?certificatePage(certificates,input.listPage.filters,input.listPage.view,input.listPage.page):undefined;
    return {isAdmin:admin,shaykhs,issuers,asaneed:input.listPage?[]:sanads,certificates:paged?paged.certificates:certificates,...(paged?{certificatePage:{totalCertificates:paged.totalCertificates,pages:paged.pages,page:paged.page,years:paged.years,students:paged.students}}:{})};
  },
});
