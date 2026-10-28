'use client';
import {useState} from 'react';
import SubmitButton from '../submit-button';
import {createDraft} from './actions';
type Item={id:string;display_name:string};
export default function DraftForm({students,issuers,qiraat,riwayat,labels}:{students:Item[];issuers:Item[];qiraat:Item[];riwayat:{code:string;display_name:string;qiraah_id:string}[];labels:{newDraft:string;student:string;issuer:string;qiraah:string;riwayah:string;date:string;save:string;loading:string;choose:string}}){
 const [qiraah,setQiraah]=useState(qiraat[0]?.id??'');
 return <details className="draft-form"><summary>{labels.newDraft}</summary><form action={createDraft}>
 <label htmlFor="draft-student">{labels.student}</label><select id="draft-student" name="student" required defaultValue=""><option value="" disabled>{labels.choose}</option>{students.map(s=><option key={s.id} value={s.id}>{s.display_name}</option>)}</select>
 <label htmlFor="draft-issuer">{labels.issuer}</label><select id="draft-issuer" name="issuer" required defaultValue=""><option value="" disabled>{labels.choose}</option>{issuers.map(i=><option key={i.id} value={i.id}>{i.display_name}</option>)}</select>
 <label htmlFor="draft-qiraah">{labels.qiraah}</label><select id="draft-qiraah" name="qiraah" required value={qiraah} onChange={e=>setQiraah(e.target.value)}>{qiraat.map(q=><option key={q.id} value={q.id}>{q.display_name}</option>)}</select>
 <label htmlFor="draft-riwayah">{labels.riwayah}</label><select key={qiraah} id="draft-riwayah" name="riwayah" required defaultValue=""><option value="" disabled>{labels.choose}</option>{riwayat.filter(r=>r.qiraah_id===qiraah).map(r=><option key={r.code} value={r.code}>{r.display_name}</option>)}</select>
 <label htmlFor="draft-date">{labels.date}</label><input id="draft-date" name="date" type="date" min="1900-01-01" max="2199-12-31" required/>
 <SubmitButton pendingLabel={labels.loading}>{labels.save}</SubmitButton></form></details>;
}
