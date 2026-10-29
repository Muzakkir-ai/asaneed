import {context as requestContext} from '../compat/context';
import {isAppAdmin} from '../lib/admin';
import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
const fields=z.object({footerLineStyles:z.string().max(1200),scientificQualification:z.string().max(240),showScientificQualification:z.boolean(),printedName:z.string().max(180),teachingRole:z.string().max(180),madrasaName:z.string().max(200),madrasaPlace:z.string().max(200),centerStampText:z.string().max(500),showTeachingRole:z.boolean(),showMadrasaName:z.boolean(),showMadrasaPlace:z.boolean()});
export default createEndpoint({
 description:'Read a teacher certificate-footer profile or update the logged-in teacher own profile',
 authenticated:true,
 inputSchema:z.object({action:z.enum(['get','save']),ownerId:z.string().optional(),profile:fields.optional()}),
 outputSchema:z.object({profile:fields}),
 execute:async({input,context})=>{
  const ownerId=input.action==='save'?context.user.id:(input.ownerId||context.user.id);
  // Only certificate issuers' own footer information is editable by themselves.
  const {records}=await zite.shaykhPrintProfiles.findAll({filters:{ownerId},limit:100});
  const own=records.find(x=>x.ownerId===ownerId);
  if(input.action==='save'){
   if(!input.profile)throw new Error('Missing profile');
   if((await isAppAdmin(context.user.email))){const ctx=requestContext();const result=await ctx.client.rpc('save_personal_issuer_profile',{profile:input.profile});if(result.error)throw new Error(result.error.message);ctx.cache?.clear();}
   else if(own)await zite.shaykhPrintProfiles.update({id:own.id,record:input.profile});
   else await zite.shaykhPrintProfiles.create({record:{name:'Print profile',ownerId,...input.profile}});
  }else if(ownerId!==context.user.id){
   // Reading another issuer's certificate footer details is limited to administrators or viewers of an issued certificate.
   const isAdmin=(await isAppAdmin(context.user.email));
   if(!isAdmin){const {records:certs}=await zite.certificates.findAll({filters:{shaykh:context.user.id},limit:2000});
     if(!certs.some(c=>{const ids=Array.isArray(c.shaykh)?c.shaykh:[c.shaykh];return ids.includes(ownerId);}))throw new Error('Permission denied');}
  }
  const profile=input.action==='save'?input.profile:own;
  return {profile:{footerLineStyles:profile?.footerLineStyles||'',scientificQualification:profile?.scientificQualification||'',showScientificQualification:profile?.showScientificQualification??true,printedName:profile?.printedName||'',teachingRole:profile?.teachingRole||'',madrasaName:profile?.madrasaName||'',madrasaPlace:profile?.madrasaPlace||'',centerStampText:profile?.centerStampText||'',showTeachingRole:profile?.showTeachingRole??true,showMadrasaName:profile?.showMadrasaName??true,showMadrasaPlace:profile?.showMadrasaPlace??true}};
 }
});
