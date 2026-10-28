import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
const font=z.enum(['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri']);
const color=z.enum(['primary','secondary','charcoal']);
const typography=z.object({font,size:z.number().min(6).max(30),color});
const style=z.object({borderColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),typography:z.object({reading:typography,sanad:typography,conclusion:typography,shaykh:typography}),phrases:z.array(z.object({text:z.string().min(1).max(300),font,size:z.number().min(6).max(30),color})).max(80)});
const first=(v?:string|string[])=>Array.isArray(v)?v[0]:v;
export default createEndpoint({
 description:'Read or save typography of one owned sanad for certificate printing',authenticated:true,
 inputSchema:z.object({action:z.enum(['get','save']),sanadId:z.string(),settings:style.optional()}),
 outputSchema:z.object({settings:style.nullable()}),
 execute:async({input,context})=>{
  const sanad=await zite.asaneed.findOne({id:input.sanadId}).catch(()=>null);
  if(!sanad||first(sanad.shaykh)!==context.user.id)throw new Error('Sanad not found or not owned by user');
  const {records}=await zite.sanadPrintStyles.findAll({filters:{sanadId:input.sanadId},limit:100});
  const own=records.find(r=>r.ownerId===context.user.id);
  if(input.action==='save'){
    if(!input.settings)throw new Error('Settings required');
    const settings=JSON.stringify(input.settings);
    if(own)await zite.sanadPrintStyles.update({id:own.id,record:{settings}});
    else await zite.sanadPrintStyles.create({record:{name:'Print style: '+input.sanadId,sanadId:input.sanadId,ownerId:context.user.id,settings}});
  }
  const content=input.action==='save'?input.settings:own?.settings?JSON.parse(own.settings):null;
  return {settings:content?style.parse(content):null};
 }
});
