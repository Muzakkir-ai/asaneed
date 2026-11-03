export type MatnSource={name:string;sanadText:string;wordingText?:string;introductionId?:string;conclusionId?:string;sanadFormatting?:string};
export const defaultMatnWording='وقد قرأ عليَّ mujaaz هذا المتن، فأجزته بروايته عني بالسند المذكور.';
export const matnHeading=(name:string)=>'إجازة في '+name.trim();
export const isMatnHeading=(heading:string)=>heading.startsWith('إجازة في ');
export function matnFormats(raw?:string){
 try{const value=JSON.parse(raw||'[]');return Array.isArray(value)?value.filter(f=>f&&typeof f.text==='string'&&Number.isInteger(f.start)&&Number.isInteger(f.end)&&f.start>=0&&f.end>f.start&&typeof f.bold==='boolean'&&typeof f.center==='boolean'&&Number.isFinite(f.indent)&&f.indent>=0&&f.indent<=10):[];}catch{return [];}
}
/** Keep placeholders until the certificate renderer substitutes the actual identities. */
export function assembleMatnCertificate(matn:MatnSource,intro='',end=''){
 if(!matn.name.trim()||!matn.sanadText.trim())throw Error('أكمل اسم المتن وسنده أولًا');
 const replace=(s:string)=>s.replace(/\{\{\s*(?:mujaaz|اسم الطالب|الطالب|المجاز)\s*\}\}/gu,'mujaaz').replace(/\{\{\s*(?:mujeez|اسم الشيخ|الشيخ|المجيز)\s*\}\}/gu,'mujeez').replace(/\{\{\s*(?:kitab_name|اسم المتن|المتن)\s*\}\}/gu,()=>matn.name);
 const wording=matn.wordingText?.trim()||defaultMatnWording;
 return '【بيان القراءة:'+matnHeading(matn.name)+'】\n'+[intro,wording,matn.sanadText,end].filter(s=>s.trim()).map(replace).join('\n\n');
}
