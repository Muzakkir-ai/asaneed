/** Round existing orthogonal corridors only; retain their exact endpoints.
 * A small inset radius leaves the router's card clearance intact. */
export function roundedSanadConnector(d:string,radius=7):string{
 const tokens=d.match(/[MHVL]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
 if(!tokens||tokens.join('').replace(/\s/g,'')!==d.replace(/[\s,]/g,''))return d;
 const points:{x:number;y:number}[]=[];let x=0,y=0;
 for(let i=0;i<tokens.length;){
  const command=tokens[i++];
  if(command==='M'||command==='L'){x=Number(tokens[i++]);y=Number(tokens[i++]);}
  else if(command==='H')x=Number(tokens[i++]);
  else if(command==='V')y=Number(tokens[i++]);
  else return d;
  if(!Number.isFinite(x)||!Number.isFinite(y))return d;
  if(!points.length||points.at(-1)!.x!==x||points.at(-1)!.y!==y)points.push({x,y});
 }
 if(points.length<3)return d;
 const start=points[0];let result=`M${start.x} ${start.y}`;
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1];
  const first=Math.hypot(b.x-a.x,b.y-a.y),second=Math.hypot(c.x-b.x,c.y-b.y);
  if(!first||!second||(a.x!==b.x&&a.y!==b.y)||(b.x!==c.x&&b.y!==c.y))return d;
  if(a.x===b.x&&b.x===c.x||a.y===b.y&&b.y===c.y){result+=` L${b.x} ${b.y}`;continue;}
  const r=Math.max(0,Math.min(radius,first/2,second/2));
  const before={x:b.x+(a.x-b.x)*r/first,y:b.y+(a.y-b.y)*r/first};
  const after={x:b.x+(c.x-b.x)*r/second,y:b.y+(c.y-b.y)*r/second};
  result+=` L${before.x} ${before.y} Q${b.x} ${b.y} ${after.x} ${after.y}`;
 }
 const end=points.at(-1)!;return result+` L${end.x} ${end.y}`;
}
