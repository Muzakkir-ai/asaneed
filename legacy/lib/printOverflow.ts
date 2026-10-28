type Rect={left:number;right:number;top:number;bottom:number;width:number};
export type PrintLayout={page:Rect;footer:Rect;body?:Rect;header?:Rect;scrollHeight:number;clientHeight:number;scrollWidth:number;clientWidth:number};
/** Compare rendered coordinates, accounting for the preview's scale. */
export function certificateOverflows({page:p,footer:f,body:b,header:h,...size}:PrintLayout){
 const mm=p.width/297;
 return size.scrollHeight>size.clientHeight+2||size.scrollWidth>size.clientWidth+2||
  f.bottom>p.bottom-mm*5||f.left<p.left-mm||f.right>p.right+mm||
  Boolean(b&&(b.bottom>f.top+mm||b.left<p.left-mm||b.right>p.right+mm))||
  Boolean(h&&b&&h.bottom>b.top+mm);
}
