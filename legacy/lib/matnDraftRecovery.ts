import type {MatnFormat} from './matnRichText';
import {cleanMatnFormats} from './matnRichText';
export type MatnDraft={version:1;text:string;formats:MatnFormat[];updatedAt:number};
export const matnDraftKey=(userId:string,context:string,label:string)=>`asaneed:matn-draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(context)}:${encodeURIComponent(label)}`;
export function parseMatnDraft(raw:string|null):MatnDraft|null{
 try{if(!raw)return null;const value=JSON.parse(raw);if(value.version!==1||typeof value.text!=='string'||value.text.length>100000||!Array.isArray(value.formats)||value.formats.length>10000||typeof value.updatedAt!=='number')return null;const formats=value.formats.filter((f:unknown):f is MatnFormat=>!!f&&typeof f==='object'&&typeof (f as MatnFormat).text==='string');return {...value,formats:cleanMatnFormats(value.text,formats)};}catch{return null;}
}
