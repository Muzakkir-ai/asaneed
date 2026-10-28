import {context as requestContext} from '../compat/context';
import {z} from 'zod';
import {createEndpoint,ZiteError} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {isAppAdmin} from '../lib/admin';

export default createEndpoint({
 description:'Administrator directory of stable user identities and roles',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['list','update']).default('list'),id:z.string().optional(),name:z.string().optional(),role:z.enum(['Admin','Shaykh','Student']).optional(),active:z.boolean().optional(),authUserId:z.string().optional(),transferOwnership:z.boolean().optional(),legacyUserId:z.string().optional()}),
 outputSchema:z.object({legacyProfiles:z.array(z.object({id:z.string(),name:z.string(),email:z.string()})),users:z.array(z.object({id:z.string(),stableId:z.string(),name:z.string(),email:z.string(),role:z.string(),active:z.boolean(),authUserId:z.string(),legacyUserId:z.string()}))}),
 execute:async({input,context})=>{
  if(!await isAppAdmin(context.user.email))throw new ZiteError({code:'FORBIDDEN',message:'Admins only'});
  if(input.action==='update'){
   if(!input.id)throw new Error('User required');
   const existing=await zite.appUsers.findOne({id:input.id});
   if(!existing)throw new Error('User not found');
   const patch:Record<string,string|boolean>={};
   if(input.name!==undefined){if(!input.name.trim())throw new Error('Name required');patch.name=input.name.trim();}
   if(input.role!==undefined)patch.role=input.role;
   if(input.legacyUserId)patch.legacyUserId=input.legacyUserId;
   if(input.active!==undefined)patch.active=input.active;
   if(input.authUserId!==undefined){
    const uid=input.authUserId.trim();
    const {records:all}=await zite.appUsers.findAll({limit:2000});
    if(uid&&all.some(u=>u.id!==existing.id&&u.authUserId===uid))throw new Error('Account is linked to another identity');
    if(uid&&uid!==existing.authUserId){
     const accounts=await zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000});
     const target=accounts.records.find(u=>u.id===uid);
     if(!target||(target.email||'').trim().toLowerCase()!==(existing.email||'').trim().toLowerCase())throw new Error('The new account ID must belong to the same verified email');
     if(!input.transferOwnership)throw new Error('Confirm ownership transfer before linking a new account');
     const prior=[existing.authUserId,existing.legacyUserId].filter((v):v is string=>!!v&&v!==uid);
     for(const oldId of prior){
      const tables=[
       {client:zite.ijazahHoldings,field:'ownerId'},
       {client:zite.preparedIjazahs,field:'ownerId'},
       {client:zite.certificateSnapshots,field:'ownerId'},
       {client:zite.shaykhPrintProfiles,field:'ownerId'},
       {client:zite.sanadPrintStyles,field:'ownerId'},
       {client:zite.students,field:'ownerId'},
      ] as const;
      for(const t of tables){
       const {records}=await t.client.findAll({filters:{ownerId:oldId},limit:2000});
       for(const rec of records)await t.client.update({id:rec.id,record:{ownerId:uid}});
      }
      const {records:asaneed}=await zite.asaneed.findAll({filters:{shaykh:oldId},limit:2000});
      for(const rec of asaneed)await zite.asaneed.update({id:rec.id,record:{shaykh:[uid]}});
      const {records:certificates}=await zite.certificates.findAll({filters:{shaykh:oldId},limit:2000});
      for(const rec of certificates)await zite.certificates.update({id:rec.id,record:{shaykh:[uid]}});
     }
    }
    patch.authUserId=uid;
   }
   await zite.appUsers.update({id:existing.id,record:patch});
  }
  const {records}=await zite.appUsers.findAll({limit:2000});
  const legacy=await requestContext().client.rpc('legacy_identity_choices');if(legacy.error)throw new Error(legacy.error.message);
  return {legacyProfiles:legacy.data,users:records.map(u=>({id:u.id,stableId:u.stableId||'',name:u.name||'',email:u.email||'',role:u.role||'Shaykh',active:u.active===true,authUserId:u.authUserId||'',legacyUserId:u.legacyUserId||''}))};
 }
});
