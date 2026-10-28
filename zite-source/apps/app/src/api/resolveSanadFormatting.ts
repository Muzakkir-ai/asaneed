import {z} from 'zod';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {parseFormatting,phraseStyle} from '../lib/sanadFormatting';
const first=(v?:string|string[])=>Array.isArray(v)?v[0]:v;
export default createEndpoint({
 description:'Resolve saved admin shared-section formatting and user private-sanad formatting for a printed sanad',
 authenticated:true,
 inputSchema:z.object({sanadId:z.string()}),
 outputSchema:z.object({phrases:z.array(phraseStyle)}),
 execute:async({input,context})=>{
  const sanad=await zite.asaneed.findOne({id:input.sanadId}).catch(()=>null);
  if(!sanad||first(sanad.shaykh)!==context.user.id)throw new Error('Sanad not found');
  const text=(sanad.chain||'').replace(/^【بيان القراءة:[^】]+】\s*/, '');
  const [{records:sections},{records:holdings}]=await Promise.all([
    zite.sanadSections.findAll({limit:2000}),
    zite.ijazahHoldings.findAll({filters:{ownerId:context.user.id},limit:2000}),
  ]);
  const out:Array<z.infer<typeof phraseStyle>>=[];
  for(const section of sections){
    if(section.ownerId&&section.ownerId!==context.user.id)continue;
    if(!section.formatting)continue;
    const style=parseFormatting(section.formatting);
    const core=(section.body||'').trim().replace(/[.،؛\s]+$/u,'');
    if(core.length>=20&&text.includes(core))out.push({text:core,font:style.font,size:style.size,color:style.color});
    for(const phrase of style.phrases){if(text.includes(phrase.text))out.push(phrase);}
  }
  for(const holding of holdings){
    if(!holding.formatting)continue;
    const style=parseFormatting(holding.formatting);
    const core=(holding.personalChain||'').trim().replace(/[.،؛\s]+$/u,'');
    if(core.length>=20&&text.includes(core))out.push({text:core,font:style.font,size:style.size,color:style.color});
    for(const phrase of style.phrases){if(text.includes(phrase.text))out.push(phrase);}
  }
  return {phrases:out.slice(0,180)};
 }
});
