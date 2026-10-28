import {BACKUP_TABLES} from '../src/lib/backupManifest';
export const rows:Record<string,any[]>=Object.fromEntries(BACKUP_TABLES.map(t=>[t,[]]));
export const operations:{table:string;action:string}[]=[];
let nextId=900,nextAuto=90;
const clone=(value:any)=>structuredClone(value);
export const zite:any={};
for(const name of BACKUP_TABLES){
 zite[name]={
  findAll:async({filters={},limit=2000,offset=0}:any={})=>{
   const matches=rows[name].filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));
   return {records:clone(matches.slice(offset,offset+limit)),hasMore:matches.length>offset+limit};
  },
  findOne:async({id}:any)=>clone(rows[name].find(r=>r.id===id)),
  bulkCreate:async({records,matchOn}:any)=>{
   const created=[];
   for(const record of records){
    const existing=matchOn&&rows[name].find(r=>matchOn.every((k:string)=>r[k]===record[k]));
    if(existing){created.push(clone(existing));continue;}
    const row={...clone(record),id:'00000000-0000-4000-8000-'+String(++nextId).padStart(12,'0')};
    if(name==='certificateIssuers')row.issuerNumber=++nextAuto;
    if(name==='certificateRegistrations')row.reservationOrder=++nextAuto;
    rows[name].push(row);created.push(clone(row));operations.push({table:name,action:'create'});
   }
   return {records:created};
  },
  update:async({id,record}:any)=>{
   const row=rows[name].find(r=>r.id===id);if(!row)throw Error('Missing row '+id);
   Object.assign(row,clone(record));operations.push({table:name,action:'update'});return clone(row);
  },
  delete:async({id}:any)=>{rows[name]=rows[name].filter(r=>r.id!==id);operations.push({table:name,action:'delete'});return{success:true};},
 };
}
zite.auth={findAllUsers:async()=>({records:[{id:'account',name:'Admin',email:'admin@example.test',image:null}],hasMore:false}),updateUserProfile:async()=>{}};
