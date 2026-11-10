import {z} from 'zod';
import {prepareSavedSanadPeople} from './preparedSanadPeople';
import {preparedSanadGraph} from './preparedSanadGraph';

export const maxOrderedSanads = 5;
export const orderedSanadIds = z.array(z.string().uuid()).min(1).max(maxOrderedSanads)
 .refine(ids => new Set(ids.map(id => id.toLowerCase())).size === ids.length, 'اختر أسانيد مختلفة');
export const sanadBranchSchema = z.object({
 sourceId:z.string(), continuationId:z.string().nullable(), routeId:z.string().nullable(),
 label:z.string(), paths:z.array(z.array(z.string())), names:z.record(z.string(),z.string()),
});
export const orderedSanadPreviewSchema = z.object({chain:z.string(),branches:z.array(sanadBranchSchema)});
export type SanadBranch = z.infer<typeof sanadBranchSchema>;
export type OrderedSanadPreview = z.infer<typeof orderedSanadPreviewSchema>;
export type OrderedSanadProvenance = {
 version:1; kind:'holding'|'additional'; qariId:string; rawi:string; branches:SanadBranch[];
};

export function resolveOrderedSanads<T extends {id:string}>(ids:string[], records:T[], eligible:(row:T)=>boolean) {
 return orderedSanadIds.parse(ids).map(id=>{
  const record=records.find(row=>row.id===id);
  if(!record||!eligible(record))throw Error('أحد الأسانيد المختارة غير متاح لهذا المُجيز وهذه الرواية');
  return record;
 });
}

export function personalBranchDiagram(text:string, ids:string[]) {
 const source=prepareSavedSanadPeople(text,true,'end');
 const graph=source&&source.tokens.length===ids.length&&ids.every(Boolean)
  ?preparedSanadGraph(source,source.tokens.map((token,i)=>({name:token.name,personId:ids[i]}))):null;
 return {paths:graph?.paths.map(path=>[...path].reverse())??[],
  names:Object.fromEntries(graph?.nodes.map(node=>[node.id,node.name])??[])};
}

export function joinOrderedSanads(texts:string[]) {
 const combined=texts.join('\n\n(ح)\n\n');
 if(combined.length>30000)throw Error('السند المدمج أطول من الحد المتاح؛ اختر أسانيد أقل');
 return combined;
}
