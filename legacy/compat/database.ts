import {context} from './context';
import type * as Rows from './rows';
import {readingIdentityFromHeading} from '../lib/riwayahSvgHeading';
import {RIWAYAH_CODES} from '../lib/certificateRegistration';
import {normalizeName} from '../../lib/manage';
type RecordRow={id:string;[key:string]:any};
type Params={filters?:Record<string,unknown>;limit?:number;offset?:number;sort?:unknown};
function completed(result:{error:{message:string}|null}){if(result.error)throw new Error(result.error.message);}
function checked(result:{data:any;error:{message:string}|null}):any{if(result.error)throw new Error(result.error.message);if(result.data===null)throw new Error('Record unavailable');return result.data;}
async function fetchTable(name:string){const {client}=context();const all:any[]=[];for(let n=0;;n+=1000){const fields=name==='certificates'?'id,student_id,issuer_id,sanad_id,completion_date,status,registration_number,verification_token,recipient_account_id,legacy_id,created_at,riwayah_code,editor:draft->editor,source:draft->source,studentName:draft->studentName':'*';const rows=checked(await client.from(name).select(fields).range(n,n+999));all.push(...(name==='certificates'?rows.map((r:any)=>({...r,draft:{editor:r.editor??{},source:r.source??{},studentName:r.studentName??''}})):rows));if(rows.length<1000)break;}return all;}
function userIdentity(){return context().user.id;}
function cached<T>(key:string,read:()=>Promise<T>):Promise<T>{const ctx=context();ctx.cache??=new Map();const prior=ctx.cache.get(key);if(prior)return prior;const result=read();ctx.cache.set(key,result);return result;}
function table(name:string):Promise<RecordRow[]>{return cached('table:'+name,async()=>{const rows=await fetchTable(name);const s=context().scope;if(!s||s.system)return rows;
 if(['certificates','sanads'].includes(name))return rows.filter(r=>name==='certificates'&&(s.role==='student'||s.certificateAccess==='recipient')?r.recipient_account_id===s.accountId:s.issuerIds.includes(r.issuer_id)||(name==='certificates'&&s.certificateAccess==='assigned-or-recipient'&&r.recipient_account_id===s.accountId));
 if(name==='issuers')return rows.filter(r=>s.issuerIds.includes(r.id));
 if(name==='certificate_snapshots'){const certs=await table('certificates');return rows.filter(r=>certs.some(c=>c.id===r.certificate_id));}
 return rows;});}
const sharedKinds=new Set(['sanadSections','sanadSectionVersions','mutoonTextTemplates','riwayahPrintColors','assetSources']);
async function workspaceRows(kind:string):Promise<RecordRow[]>{const rows:RecordRow[]=checked(await context().client.from('workspace_records').select('id,payload').eq('kind',kind));const s=context().scope;if(!s||s.system)return rows;
 if(kind==='sanadSectionVersions'){const sections=await workspaceRows('sanadSections');return rows.filter(r=>sections.some(p=>p.id===r.payload.sectionId));}
 return rows.filter(r=>{const p=r.payload;const owner=String(p.ownerId??(kind==='asaneed'?first(p.shaykh):p.shaykhId?'guest:'+p.shaykhId:''));
 if(owner)return owner===s.authUserId||s.issuerIds.some(id=>owner==='guest:'+id);
 // Versions inherit their section's permissions in the database; their directory is shared read-only.
 return sharedKinds.has(kind)||kind==='certificateSnapshots';});}
function coreCertificates(){return cached('core:certificates',()=>readCoreCertificates());}
function load(kind:string):Promise<RecordRow[]>{return cached('kind:'+kind,()=>readKind(kind));}
function first(v:unknown):string{return String(Array.isArray(v)?v[0]??'':v??'');}
async function readCoreCertificates(){const [certs,students,issuers]=await Promise.all([table('certificates'),table('students'),table('issuers')]);const names=new Map(students.map(s=>[s.id,s.display_name]));return certs.map(c=>({...c.draft?.source,...c.draft?.editor,id:c.id,studentName:names.get(c.student_id)||c.draft?.studentName||c.draft?.source?.['Student Name']||'',completionDate:c.completion_date,sanad:c.sanad_id?[c.sanad_id]:[],shaykh:[context().account.role==='student'?'guest:'+c.issuer_id:context().user.id],additionalShaykh:issuers.find(i=>i.id===c.issuer_id)?.print_profile?.personalAccount?'':c.issuer_id,registrationNumber:c.registration_number||'',publicationStatus:c.status==='finalized'?'final':'draft',verificationToken:c.verification_token||'',studentAccount:c.recipient_account_id===(context().scope?.accountId??context().account.id)?userIdentity():c.recipient_account_id,notes:c.draft?.editor?.notes??c.draft?.source?.Notes??'',hijriDayOffset:c.draft?.editor?.hijriDayOffset??c.draft?.source?.hijriDayOffset??0,shahadaNumber:c.draft?.editor?.shahadaNumber??c.draft?.source?.shahadaNumber??c.draft?.source?.['Certificate Number']??0,_core:c}));}
async function readKind(kind:string):Promise<RecordRow[]>{
 const {client,user}=context();
 if(kind==='certificates')return coreCertificates();
 if(kind==='students')return (await table('students')).map(r=>({id:r.id,name:r.display_name,ownerId:'',legacyId:r.legacy_id}));
 if(kind==='qiraat')return (await table('qiraat')).map(r=>({id:r.id,name:r.display_name,description:'',asaneed:[]}));
 if(kind==='additionalShaykhs')return (await table('issuers')).filter(i=>!i.print_profile?.personalAccount).map(r=>({...r.print_profile,id:r.id,name:r.display_name,qualification:r.print_profile?.qualification??r.print_profile?.scientificQualification??'',readingsJson:r.print_profile?.readingsJson??'[]'}));
 if(kind==='asaneed'){
 const issuers=await table('issuers');const core=(await table('sanads')).map(r=>({...r.body?.editor,id:r.id,title:r.title,chain:r.body?.chain??'',shaykh:[user.id],additionalShaykh:issuers.find(i=>i.id===r.issuer_id)?.print_profile?.personalAccount?'':r.issuer_id,qiraah:r.qiraah_id?[r.qiraah_id]:[],certificates:[],_core:r}));
 const extra=await workspaceRows(kind);return [...core,...extra.filter(r=>!core.some(c=>c.id===r.id)).map(r=>({...r.payload,id:r.id}))];
 }
 if(kind==='appUsers')return (checked(await client.rpc('list_application_accounts')) as any[]).filter(a=>!context().scope||context().scope?.system||a.id===context().scope?.accountId).map(a=>({id:a.id,name:a.display_name,email:a.email??'',authUserId:a.auth_user_id??'',stableId:a.id,legacyUserId:a.legacy_auth_id??'',role:{admin:'Admin',shaykh:'Shaykh',student:'Student'}[a.role as 'admin'|'shaykh'|'student'],active:a.active}));
 if(kind==='appAdmins')return (await load('appUsers')).filter(a=>a.role==='Admin').map(a=>({...a,email:a.authUserId===user.id?user.email:'',active:a.active}));
 if(kind==='certificateIssuers')return (await table('issuers')).map(i=>({id:i.id,issuerKey:'guest:'+i.id,issuerNumber:Number(i.issuer_code),issuerCode:i.issuer_code,displayName:i.display_name}));
 if(kind==='certificateRegistrations')return (await coreCertificates()).filter(c=>c.registrationNumber).map(c=>({id:c.id,reservationKey:c.id,certificateId:c.id,issuerKey:'guest:'+c.additionalShaykh,year:c.completionDate.slice(0,4),riwayahCode:c.registrationNumber.slice(5,7),registrationNumber:c.registrationNumber,sequenceOrder:Number(c.registrationNumber.slice(-2)),reservationOrder:Number(c.registrationNumber.slice(-2))}));
 if(kind==='legacyUserDirectory'){if(context().account.role!=='admin')return [];const records=checked(await client.rpc('read_legacy_library',{source_name:'Legacy User Directory',page_number:0}));return records.records.map((r:any)=>({id:r.source_id,name:r.payload.Name??'',email:r.payload.Email??'',originalUserId:r.payload['Original User ID']??'',firstName:r.payload['First Name']??'',lastName:r.payload['Last Name']??''}));}
 const raw=await workspaceRows(kind);let rows:RecordRow[]=raw.map(r=>({...r.payload,id:r.id}));
 if(kind==='certificateSnapshots'){
  const certs=await coreCertificates();const frozen=await table('certificate_snapshots');const list:RecordRow[]=[];
  for(const cert of certs){const f=frozen.find(f=>f.certificate_id===cert.id);if(f){list.push({id:f.certificate_id,name:'شهادة '+cert.id,certificateId:cert.id,ownerId:first(cert.shaykh),...f.content});continue;}
   const sources=rows.filter(r=>r.certificateId===cert.id||r.certificateId===cert._core.draft?.source?.legacyId);for(const r of sources)list.push({...r,certificateId:cert.id,ownerId:first(cert.shaykh)});
  }
  return list;
 }
 return rows;
}
function filtered(rows:RecordRow[],filters?:Record<string,unknown>){return filters?rows.filter(row=>Object.entries(filters).every(([key,value])=>{if(key==='ownerId'&&row.ownerId===''&&value)return true;let field=row[key];return Array.isArray(field)?field.includes(value):Array.isArray(value)?value.includes(field):field===value;})):rows;}
async function personalIssuer(){const {client,account,user,scope}=context();const assigned=checked(await client.from('issuer_accounts').select('issuer_id').eq('account_id',scope?.accountId??account.id));
 const profiles=await table('issuers');const personal=profiles.find(p=>p.print_profile?.personalAccount&&assigned.some((a:any)=>a.issuer_id===p.id));if(personal)return personal.id;
 if(account.role==='admin'&&!scope?.inspection){const id=checked(await client.rpc('create_issuer_profile',{new_name:user.name,profile:{},personal:true}));if(scope){if(!scope.issuerIds.includes(id))scope.issuerIds.push(id);}context().cache?.clear();return id;}throw new Error('Assign a personal issuing-shaykh profile first');}
async function rememberStudent(name:string){const all=await table('students');const existing=all.find(s=>normalizeName(s.display_name)===normalizeName(name));if(existing)return existing.id;return checked(await context().client.from('students').insert({display_name:name.trim()}).select('id').single()).id;}
async function write(kind:string,id:string|undefined,record:Record<string,unknown>):Promise<RecordRow>{
 const {client,user,account}=context();
 const scope=context().scope;if(scope?.readOnly)throw Error('Workspace is read-only');
 if(id&&!(await load(kind)).some(r=>r.id===id))throw Error('Record is outside the selected workspace');
 if(scope&&!scope.system){
  const owner=record.ownerId;if(owner&&owner!==scope.authUserId&&!scope.issuerIds.some(id=>owner==='guest:'+id))throw Error('Owner is outside the selected workspace');
  const issuer=first(record.additionalShaykh)||String(record.shaykhId??'');if(issuer&&!scope.issuerIds.includes(issuer))throw Error('Issuer is outside the selected workspace');
 }
 context().cache?.clear();
 if(kind==='students'){const data=id?checked(await client.from('students').update({display_name:record.name}).eq('id',id).select().single()):checked(await client.from('students').insert({display_name:record.name}).select().single());return {id:data.id,name:data.display_name,ownerId:''};}
 if(kind==='additionalShaykhs'){
  if(id){const old=checked(await client.from('issuers').select('*').eq('id',id).single());checked(await client.from('issuers').update({display_name:record.name??old.display_name,print_profile:{...old.print_profile,...record}}).eq('id',id).select().single());}
  else {id=checked(await client.rpc('create_issuer_profile',{new_name:record.name,profile:record,personal:false}));if(scope){scope.issuerIds.push(id!);}context().cache?.clear();}
  return (await load(kind)).find(r=>r.id===id)!;
 }
 if(kind==='asaneed'){
  if(id){const lookup=await client.from('sanads').select('*').eq('id',id).maybeSingle();if(lookup.error)throw new Error(lookup.error.message);const old=lookup.data;if(!old){const prior=checked(await client.from('workspace_records').select('payload').eq('kind','asaneed').eq('id',id).single());if(first(prior.payload.shaykh)===user.id){const issuer=await personalIssuer();checked(await client.from('sanads').insert({id,issuer_id:issuer,title:record.title??prior.payload.title,body:{chain:record.chain??prior.payload.chain,editor:{...prior.payload,...record}},legacy_id:id}).select().single());return {...prior.payload,...record,id,shaykh:[user.id],additionalShaykh:''};}const result=checked(await client.from('workspace_records').update({payload:{...prior.payload,...record}}).eq('kind','asaneed').eq('id',id).select().single());return {...result.payload,id};}if(old){checked(await client.from('sanads').update({title:record.title??old.title,body:{...old.body,chain:record.chain??old.body.chain,editor:{...old.body.editor,...record}}}).eq('id',id).select().single());return (await load(kind)).find(r=>r.id===id)!;}}
  const issuer=first(record.additionalShaykh)||await personalIssuer();const data=checked(await client.from('sanads').insert({issuer_id:issuer,title:record.title,body:{chain:record.chain,editor:record}}).select().single());return {...record,id:data.id,shaykh:[user.id],additionalShaykh:issuer};
 }
 if(kind==='certificates'){
  const old=id?checked(await client.from('certificates').select('*').eq('id',id).single()):null;
  if(old?.status==='finalized')throw Error('Finalized certificates are immutable');
  const sanadId=first(record.sanad)||old?.sanad_id;let sanadQuery=await client.from('sanads').select('*').eq('id',sanadId).maybeSingle();if(sanadQuery.error)throw new Error(sanadQuery.error.message);if(!sanadQuery.data){const source=checked(await client.from('workspace_records').select('payload').eq('kind','asaneed').eq('id',sanadId).single());if(first(source.payload.shaykh)!==user.id)throw Error('Sanad owner must be verified');await write('asaneed',sanadId,{title:source.payload.title,chain:source.payload.chain});sanadQuery=await client.from('sanads').select('*').eq('id',sanadId).single();}const sanad=checked(sanadQuery);
  if(old&&old.issuer_id!==sanad.issuer_id)throw Error('Issuer cannot change');
  const identity=readingIdentityFromHeading((sanad.body.chain??'').match(/^【بيان القراءة:([^】]+)】/)?.[1]??'');
  const code=identity&&RIWAYAH_CODES[identity.qariId+'|'+identity.rawi];if(!code)throw Error('A single riwayah is required');
  const editor={...old?.draft?.editor,...record};const studentId=record.studentName?await rememberStudent(String(record.studentName)):old?.student_id;
  const patch={student_id:studentId,sanad_id:sanadId,riwayah_code:code,completion_date:record.completionDate??old?.completion_date,draft:{...old?.draft,editor,studentName:record.studentName??old?.draft?.studentName}};
  const data=old?checked(await client.from('certificates').update(patch).eq('id',id).select().single()):checked(await client.from('certificates').insert({...patch,issuer_id:sanad.issuer_id}).select().single());
  return (await coreCertificates()).find(c=>c.id===data.id)!;
 }
 if(kind==='appUsers'){
  if(!id)throw Error('Create login accounts through registration');const old=(await load(kind)).find(a=>a.id===id);if(!old)throw Error('Unknown account');if(record.authUserId!==undefined&&record.authUserId!==old.authUserId)throw Error('Login identities cannot be reassigned');
  completed(await client.rpc('save_account_profile',{target:id,new_name:record.name??old.name,new_role:String(record.role??old.role).toLowerCase(),new_active:record.active??old.active,legacy_id:record.legacyUserId&&record.legacyUserId!==old.legacyUserId?record.legacyUserId:null}));context().cache?.clear();return (await load(kind)).find(a=>a.id===id)!;
 }
 if(['appAdmins','certificateIssuers','certificateRegistrations','qiraat'].includes(kind))throw Error('This system directory is read-only');
 const lookup=id?await client.from('workspace_records').select('payload').eq('kind',kind).eq('id',id).maybeSingle():null;if(lookup?.error)throw new Error(lookup.error.message);const old=lookup?.data;
 const data=checked(await client.from('workspace_records').upsert({kind,id:id??crypto.randomUUID(),payload:{...old?.payload,...record}},{onConflict:'kind,id'}).select().single());return {...data.payload,id:data.id};
}
function entity<T extends RecordRow>(kind:string){return {
 async findAll(p:Params={}){const rows=filtered(await load(kind),p.filters);const start=p.offset??0,limit=Math.min(p.limit??100,2000);return {records:rows.slice(start,start+limit) as T[],hasMore:start+limit<rows.length};},
 async findOne(p:{id:string}){const row=(await load(kind)).find(r=>r.id===p.id);if(!row)throw Error('Record unavailable');return row as T;},
 async create(p:{record:Record<string,unknown>}){const value=await write(kind,undefined,p.record) as T;context().cache?.clear();return value;},
 async update(p:{id:string;record:Record<string,unknown>}){const value=await write(kind,p.id,p.record) as T;context().cache?.clear();return value;},
 async delete(p:{id:string}){if(context().scope?.readOnly)throw Error('Workspace is read-only');if(!(await load(kind)).some(r=>r.id===p.id))throw Error('Record is outside the selected workspace');context().cache?.clear();const {client}=context();const core:Record<string,string>={certificates:'certificates',asaneed:'sanads',students:'students'};if(core[kind]){checked(await client.from(core[kind]).delete().eq('id',p.id).select().single());}else{checked(await client.from('workspace_records').delete().eq('kind',kind).eq('id',p.id).select().single());}return {success:true};},
 async bulkCreate(p:{records:Record<string,unknown>[];matchOn?:string[]}){const records:T[]=[];for(const record of p.records){let existing=p.matchOn?(await load(kind)).find(row=>p.matchOn!.every(k=>row[k]===record[k])):null;records.push(await write(kind,existing?.id,record) as T);}return {records};}
};}

export const zite={
qiraat:entity<Rows.qiraatRow>('qiraat'),
asaneed:entity<Rows.asaneedRow>('asaneed'),
certificates:entity<Rows.certificatesRow>('certificates'),
sanadSections:entity<Rows.sanadSectionsRow>('sanadSections'),
ijazahHoldings:entity<Rows.ijazahHoldingsRow>('ijazahHoldings'),
sanadPrintStyles:entity<Rows.sanadPrintStylesRow>('sanadPrintStyles'),
preparedIjazahs:entity<Rows.preparedIjazahsRow>('preparedIjazahs'),
certificateSnapshots:entity<Rows.certificateSnapshotsRow>('certificateSnapshots'),
sanadSectionVersions:entity<Rows.sanadSectionVersionsRow>('sanadSectionVersions'),
shaykhPrintProfiles:entity<Rows.shaykhPrintProfilesRow>('shaykhPrintProfiles'),
riwayahPrintColors:entity<Rows.riwayahPrintColorsRow>('riwayahPrintColors'),
students:entity<Rows.studentsRow>('students'),
additionalShaykhs:entity<Rows.additionalShaykhsRow>('additionalShaykhs'),
assetSources:entity<Rows.assetSourcesRow>('assetSources'),
appAdmins:entity<Rows.appAdminsRow>('appAdmins'),
legacyUserDirectory:entity<Rows.legacyUserDirectoryRow>('legacyUserDirectory'),
appUsers:entity<Rows.appUsersRow>('appUsers'),
mutoonHoldings:entity<Rows.mutoonHoldingsRow>('mutoonHoldings'),
mutoonTextTemplates:entity<Rows.mutoonTextTemplatesRow>('mutoonTextTemplates'),
additionalShaykhExtensions:entity<Rows.additionalShaykhExtensionsRow>('additionalShaykhExtensions'),
additionalShaykhReadingSanads:entity<Rows.additionalShaykhReadingSanadsRow>('additionalShaykhReadingSanads'),
certificateIssuers:entity<Rows.certificateIssuersRow>('certificateIssuers'),
certificateRegistrations:entity<Rows.certificateRegistrationsRow>('certificateRegistrations'),
 auth:{async findAllUsers(p:{limit?:number;offset?:number;appIds?:string[]}={}){const rows=(await load('appUsers')).filter(a=>a.authUserId).map(a=>({id:a.authUserId,name:a.name,email:a.email,firstName:a.name.split(' ')[0],lastName:a.name.split(' ').slice(1).join(' '),image:null}));const offset=p.offset??0,limit=p.limit??2000;return {records:rows.slice(offset,offset+limit),hasMore:rows.length>offset+limit};},async updateUserProfile(id:string,patch:{firstName?:string;lastName?:string;image?:string|null}){const ctx=context();if(id!==ctx.user.id&&ctx.account.role!=='admin')throw Error('Forbidden');const target=(await load('appUsers')).find(a=>a.authUserId===id);if(!target)throw Error('Account not found');return write('appUsers',target.id,{name:[patch.firstName,patch.lastName].filter(Boolean).join(' ')});}}
};
