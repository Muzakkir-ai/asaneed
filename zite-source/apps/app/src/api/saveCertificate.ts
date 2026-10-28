import {ensureCertificateRegistration} from '../lib/certificateRegistration';
import {isAppAdmin} from '../lib/admin';
import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import {QURRA,displayRawi} from '../lib/qurra';
import {nextShahadaNumber} from '../lib/shahadaSequence';


const owns = (v: string | string[] | undefined, id: string) => (Array.isArray(v) ? v.includes(id) : v === id);

// Keep one reusable student entry per issuer, even after an old certificate is deleted.
const rememberStudent = async (ownerId:string, text:string) => {
  const name=text.normalize('NFKC').trim().replace(/\s+/gu,' ');
  if(!name)return;
  const {records}=await zite.students.findAll({filters:{ownerId},limit:2000});
  if(!records.some(r=>(r.name||'').normalize('NFKC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('ar')===name.toLocaleLowerCase('ar'))){
    await zite.students.create({record:{name,ownerId}});
  }
};

export default createEndpoint({
  description: 'Creates or updates a student certificate for the signed-in shaykh',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    studentName: z.string().min(1),
    completionDate: z.string().min(1),
    hijriDayOffset:z.number().int().min(-2).max(2).default(0),
    sanadId: z.string().min(1),
    notes: z.string(),
    shaykhId:z.string().optional(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const admin=(await isAppAdmin(context.user.email));
    const uid=admin&&input.shaykhId?input.shaykhId:context.user.id;
    if(admin&&uid!==context.user.id){const users=await zite.auth.findAllUsers({appIds:['qkvfmeznbu'],limit:2000});if(!users.records.some(u=>u.id===uid))throw new Error('المُجيز غير موجود');}
    const sanad = await zite.asaneed.findOne({ id: input.sanadId }).catch(()=>null);
    if (!sanad || !owns(sanad.shaykh, uid)) throw new ZiteError({ code: 'NOT_FOUND', message: 'Invalid sanad', userFacingMessage: 'السند غير متاح لك' });
    // Defense in depth: never issue a NEW certificate for a combined qiraah,
    // including via direct endpoint calls with a manually saved sanad ID.
    if(!input.id){
      const heading=(sanad.chain||'').match(/^【بيان القراءة:([^】]+)】/)?.[1]||'';
      const matches=QURRA.flatMap(q=>q.rawis.map(r=>({imam:q.imam,rawi:r,label:displayRawi(q.id,r)})))
        .filter(v=>(heading.includes('رواية '+v.label)||heading.includes('رواية '+v.rawi))&&heading.includes(v.imam));
      if(matches.length!==1||heading.includes('بروايتي'))
        throw new Error('إصدار الشهادة لرواية واحدة فقط؛ اختر رواية محددة من إجازاتك');
    }
    const record = {
      studentName: input.studentName.trim(),
      completionDate: input.completionDate,
      hijriDayOffset:input.hijriDayOffset,
      sanad: input.sanadId,
      shaykh: uid,
      notes: input.notes,
    };
    if (input.id) {
      const existing = await zite.certificates.findOne({ id: input.id }).catch(()=>null);
      if (!existing || (!admin&&!owns(existing.shaykh, context.user.id))) throw new ZiteError({ code: 'NOT_FOUND', message: 'Not found', userFacingMessage: 'الشهادة غير موجودة' });
      if(!owns(existing.shaykh,uid))throw new Error('لا يمكن تغيير المُجيز لشهادة سبق إصدارها');
      if(existing.publicationStatus!=='draft')throw new Error('الشهادة نهائية ولا يمكن تعديل بياناتها');
      const previousId=Array.isArray(existing.sanad)?existing.sanad[0]:existing.sanad;
      if(previousId!==input.sanadId)throw new Error('لا يمكن تغيير الإجازة في شهادة صدرت بالفعل؛ أصدر شهادة جديدة حفاظًا على سندها الأصلي');
      await zite.certificates.update({ id: input.id, record });
      await ensureCertificateRegistration(input.id);
      await rememberStudent(uid, input.studentName);
      return { id: input.id };
    }
    const shahadaNumber=await nextShahadaNumber();
    const created = await zite.certificates.create({ record: {...record,shahadaNumber,publicationStatus:'draft'} });
    try{await ensureCertificateRegistration(created.id);}catch(error){await zite.certificates.delete({id:created.id}).catch(()=>{});throw error;}
    await rememberStudent(uid, input.studentName);
    return { id: created.id };
  },
});
