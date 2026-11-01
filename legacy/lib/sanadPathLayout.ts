export type SanadPathBlock={kind:'person';id:string}|{kind:'split';lanes:SanadPathBlock[][]};
/** Decompose only explicit person-ID paths; keep repeated splits and meeting points. */
export function sanadPathLayout(input:string[][]):SanadPathBlock[]|null{
 const paths=input.filter((p,i,all)=>all.findIndex(q=>JSON.stringify(q)===JSON.stringify(p))===i);
 if(!paths.length)return [];
 if(paths.some(p=>new Set(p).size!==p.length))return null;
 const common=paths[0].filter(id=>paths.every(p=>p.includes(id)));
 if(paths.some(p=>JSON.stringify(p.filter(id=>common.includes(id)))!==JSON.stringify(common)))return null;
 function layout(rows:string[][]):SanadPathBlock[]|null{
  if(rows.every(p=>!p.length))return [];
  if(rows.some(p=>!p.length))return null;
  const first=rows[0][0];
  if(rows.every(p=>p[0]===first)){const rest=layout(rows.map(p=>p.slice(1)));return rest?[{kind:'person',id:first},...rest]:null;}
  const meeting=rows[0].find(id=>rows.every(p=>p.includes(id)));
  const heads=rows.map(p=>meeting?p.slice(0,p.indexOf(meeting)):p);
  const groups=[...new Set(heads.map(p=>p[0]))].map(id=>heads.filter(p=>p[0]===id));
  const lanes=groups.map(layout);if(lanes.some(l=>!l))return null;
  // A partial overlap crossing lanes cannot be represented as a nested split.
  const ids=(blocks:SanadPathBlock[]):string[]=>blocks.flatMap(b=>b.kind==='person'?[b.id]:b.lanes.flatMap(ids));
  const sets=lanes.map(l=>new Set(ids(l!)));
  if(sets.some((s,i)=>sets.some((t,j)=>i!==j&&[...s].some(id=>t.has(id)))))return null;
  const tail=meeting?layout(rows.map(p=>p.slice(p.indexOf(meeting)))):[];
  return tail?[{kind:'split',lanes:lanes as SanadPathBlock[][]},...tail]:null;
 }
 return layout(paths);
}
