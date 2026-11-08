import {isAppAdmin} from '../lib/admin';
import {matnHeadingSchema} from '../lib/matnPresentation';
import {context as requestContext} from '../compat/context';
import {createEndpoint} from 'zitejs/backend';
import {zite} from 'zitejs/db';
import {z} from 'zod';

const font=z.enum(['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri']);
const color=z.enum(['primary','secondary','charcoal']);
const typography=z.object({
 font,size:z.number().min(6).max(30),color,headingGapMm:z.number().min(0).max(20).optional(),
 lastLineAlignment:z.enum(['right','center']).optional(),svgHeightPt:z.number().min(5).max(100).optional(),
 scalePercent:z.number().min(50).max(150).optional(),lineSpacing:z.number().min(1).max(3).optional(),
 paragraphSpacing:z.number().min(0).max(30).optional(),firstLineIndent:z.number().min(0).max(25).optional(),
 offsetMm:z.number().min(-15).max(15).optional(),alignment:z.enum(['right','center','justify']).optional(),
});
const style=z.object({
 matnHeading:matnHeadingSchema.nullable().optional(),headingOffsetMm:z.number().min(-12).max(12).optional(),footerOffsetMm:z.number().min(-15).max(4).optional(),borderColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
 accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),
 typography:z.object({reading:typography,sanad:typography,conclusion:typography,shaykh:typography}),
 phrases:z.array(z.object({text:z.string().min(1).max(300),font,size:z.number().min(6).max(30),color})).max(80),
});
const one=(value?:string|string[])=>Array.isArray(value)?value[0]:value;
export default createEndpoint({
 description:'Save or reset per-certificate draft PDF formatting, without finalizing or changing the shared sanad style',
 authenticated:true,
 inputSchema:z.object({
  certificateId:z.string(),action:z.enum(['save','reset']),
  settings:style.optional(),printMode:z.enum(['number','none']).optional(),
 }),
 outputSchema:z.object({saved:z.boolean()}),
 execute:async({input,context})=>{
  const cert=await zite.certificates.findOne({id:input.certificateId}).catch(()=>null);
  if(!cert)throw new Error('الشهادة غير موجودة');
  const issuer=one(cert.shaykh);
  const admin=await isAppAdmin(context.user.email);
  if(!issuer||(!admin&&issuer!==context.user.id))throw new Error('لا تملك صلاحية تعديل هذه الشهادة');
  if(cert.publicationStatus!=='draft')throw new Error('الشهادة معتمدة ولا يمكن تعديل تنسيقها');
  if(input.action==='save'&&!input.settings)throw new Error('إعدادات التنسيق مطلوبة');
  const client=requestContext().client;
  const {data:record,error:readError}=await client.from('certificates')
   .select('id,status,draft').eq('id',input.certificateId).maybeSingle();
  if(readError)throw new Error(readError.message);
  if(!record||record.status!=='draft')throw new Error('هذه الشهادة ليست مسودة قابلة للتعديل');
  // Keep source, sourceSnapshot, studentName, editor and other draft fields.
  // Only the PDF layout key is modified; this never writes a final snapshot.
  const next={...(record.draft&&typeof record.draft==='object'&&!Array.isArray(record.draft)?record.draft:{} as Record<string,unknown>)};
  // A reset is a deliberate system-default choice for this certificate,
  // not a return to the user's shared sanad-wide styling.
  if(input.action==='reset')next.certificatePrintStyle={version:1,systemDefault:true,printMode:'number'};
  else next.certificatePrintStyle={
   version:1,settings:style.parse(input.settings),printMode:input.printMode??'number',
  };
  const {data:updated,error:writeError}=await client.from('certificates')
   .update({draft:next}).eq('id',input.certificateId).eq('status','draft').select('id').maybeSingle();
  if(writeError)throw new Error(writeError.message);
  if(!updated)throw new Error('تعذر حفظ تنسيق الشهادة المسودة');
  return {saved:input.action==='save'};
 },
});
