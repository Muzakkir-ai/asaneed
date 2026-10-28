/** Date-only certificate formatting, stable in the Riyadh calendar timezone. */
export const hijriOffsetChoices=[-2,-1,0,1,2] as const;
export function certificateDate(value:string,calendar:'islamic-umalqura'|'gregory',offset=0):string{
 const date=new Date(`${value}T12:00:00`);
 if(Number.isNaN(date.getTime()))return value;
 if(calendar==='islamic-umalqura')date.setDate(date.getDate()+offset);
 const parts=new Intl.DateTimeFormat('en-US-u-ca-'+calendar,{day:'numeric',month:'numeric',year:'numeric',timeZone:'Asia/Riyadh'}).formatToParts(date);
 const n=(type:string)=>parts.find(part=>part.type===type)?.value||'';
 return [n('day'),n('month'),n('year')].join(' / ').replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}
