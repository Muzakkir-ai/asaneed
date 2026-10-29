export type CertificateFilters={query:string;issuer:string;qari:string;rawi:string;year:string;status:string;sort:'added'|'completion'|'name'};
export const defaultCertificateFilters:CertificateFilters={query:'',issuer:'all',qari:'all',rawi:'all',year:'all',status:'all',sort:'added'};
const TTL=4*60*60*1000;
export function decodeCertificateFilters(value:string|null,now=Date.now()):CertificateFilters{
 try{const stored=JSON.parse(value||'null');if(stored?.version!==1||typeof stored.savedAt!=='number'||now-stored.savedAt>TTL||stored.savedAt>now)return {...defaultCertificateFilters};const f=stored.filters;
 return {query:typeof f.query==='string'?f.query.slice(0,200):'',issuer:typeof f.issuer==='string'?f.issuer:'all',qari:typeof f.qari==='string'?f.qari:'all',rawi:typeof f.rawi==='string'?f.rawi:'all',year:typeof f.year==='string'?f.year:'all',status:['draft','final'].includes(f.status)?f.status:'all',sort:['added','completion','name'].includes(f.sort)?f.sort:'added'};
 }catch{return {...defaultCertificateFilters};}
}
export function encodeCertificateFilters(filters:CertificateFilters,now=Date.now()){return JSON.stringify({version:1,savedAt:now,filters});}
export function reconcileCertificateFilters(f:CertificateFilters,choices:{issuers:string[];qariRawis:Record<string,string[]>;years:string[];showIssuer:boolean}):CertificateFilters{
 const qari=f.qari==='all'||f.qari in choices.qariRawis?f.qari:'all';
 const rawis=qari==='all'?Object.entries(choices.qariRawis).flatMap(([q,rs])=>rs.map(r=>q+'|'+r)):(choices.qariRawis[qari]||[]).map(r=>qari+'|'+r);
 return {...f,qari,issuer:choices.showIssuer&&choices.issuers.includes(f.issuer)?f.issuer:'all',rawi:rawis.includes(f.rawi)?f.rawi:'all',year:choices.years.includes(f.year)?f.year:'all'};
}
