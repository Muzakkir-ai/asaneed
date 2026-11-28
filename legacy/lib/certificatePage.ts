import {matchesArabic} from './arabicSearch';
import type {CertificateFilters} from './certificateFilters';

export type ListCertificate={id:string;studentId?:string;studentName:string;completionDate:string;certificateNumber:number;registrationNumber:string;issuerKey:string;qariId:string;rawi:string;publicationStatus:'draft'|'final';qiraahName:string;shaykhName:string};
export const CERTIFICATE_PAGE_SIZE=15;
export function certificatePage<T extends ListCertificate>(certificates:readonly T[],filters:CertificateFilters,view:'certificates'|'students',requestedPage:number){
 const rows=certificates.filter(c=>(filters.issuer==='all'||c.issuerKey===filters.issuer)&&(filters.qari==='all'||c.qariId===filters.qari)&&(filters.rawi==='all'||c.qariId+'|'+c.rawi===filters.rawi)&&(filters.year==='all'||c.completionDate.startsWith(filters.year+'-'))&&(filters.status==='all'||c.publicationStatus===filters.status)&&matchesArabic([c.studentName,c.qiraahName,c.shaykhName,c.registrationNumber,String(c.certificateNumber)].join(' '),filters.query));
 rows.sort((a,b)=>(filters.sort==='name'?a.studentName.localeCompare(b.studentName,'ar'):filters.sort==='completion'||filters.sort==='completion-desc'?(filters.sort==='completion-desc'?-1:1)*(a.completionDate.localeCompare(b.completionDate)||(a.registrationNumber||'').localeCompare(b.registrationNumber||'',undefined,{numeric:true})||a.certificateNumber-b.certificateNumber):b.certificateNumber-a.certificateNumber)||a.id.localeCompare(b.id));
 const groups=new Map<string,T[]>();
 if(view==='students')for(const row of rows){const key=row.studentId?'student:'+row.studentId:'certificate:'+row.id;const group=groups.get(key);if(group)group.push(row);else groups.set(key,[row]);}
 const total=view==='students'?groups.size:rows.length;
 const pages=Math.max(1,Math.ceil(total/CERTIFICATE_PAGE_SIZE));
 const page=Math.max(0,Math.min(requestedPage,pages-1));
 const start=page*CERTIFICATE_PAGE_SIZE;
 return {totalCertificates:rows.length,pages,page,years:[...new Set(certificates.map(c=>c.completionDate.slice(0,4)).filter(Boolean))].sort().reverse(),certificates:view==='certificates'?rows.slice(start,start+CERTIFICATE_PAGE_SIZE):[],students:view==='students'?[...groups.values()].slice(start,start+CERTIFICATE_PAGE_SIZE):[]};
}
