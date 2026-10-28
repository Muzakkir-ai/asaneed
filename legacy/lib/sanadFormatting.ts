import {z} from 'zod';
export const fontChoice=z.enum(['KSA Regular','Sakkal Kitab','Majalla','Bahij Muna','Amiri']);
export const colorChoice=z.enum(['primary','secondary','charcoal']);
export const phraseStyle=z.object({text:z.string().min(1).max(30000),font:fontChoice,size:z.number().min(6).max(30),color:colorChoice});
export const sectionFormatting=z.object({font:fontChoice,size:z.number().min(6).max(30),color:colorChoice,phrases:z.array(phraseStyle).max(60)});
export type SectionFormatting=z.infer<typeof sectionFormatting>;
export const defaultSectionFormatting:SectionFormatting={font:'KSA Regular',size:9,color:'charcoal',phrases:[]};
export const parseFormatting=(value?:string|null):SectionFormatting=>{try{return value?sectionFormatting.parse(JSON.parse(value)):defaultSectionFormatting;}catch{return defaultSectionFormatting;}};
