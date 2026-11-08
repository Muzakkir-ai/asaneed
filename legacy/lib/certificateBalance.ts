/** Balance the composition without sacrificing a pinned bottom signing zone.
 * Coordinates are measured in preview pixels; pageWidth makes mm scale-invariant. */
export function certificateBalance({pageTop,pageBottom,pageWidth,layoutWidth,headerTop,footerBottom,previousShift=0,anchorHeader=false,pinnedFooter=false}:{pageTop:number;pageBottom:number;pageWidth:number;layoutWidth:number;headerTop:number;footerBottom:number;previousShift?:number;anchorHeader?:boolean;pinnedFooter?:boolean}){
 const scale=pageWidth/layoutWidth;
 if(!Number.isFinite(scale)||scale<=0)return {fits:false,shift:0};
 const mm=pageWidth/297;
 const margin=mm*(pinnedFooter?6:12);
 const headerBase=headerTop-previousShift*scale,footerBase=footerBottom-previousShift*scale;
 if(footerBase-headerBase>pageBottom-pageTop-2*margin)return {fits:false,shift:0};
 const ideal=((pageTop+pageBottom)/2-(headerBase+footerBase)/2)/scale;
 const minimum=(pageTop+margin-headerBase)/scale,maximum=(pageBottom-margin-footerBase)/scale;
 const balanced=anchorHeader?0:Math.max(minimum,Math.min(maximum,ideal*0.72));
 // Pinned footers never move downward and may rise at most 4 physical mm.
 const shift=pinnedFooter?Math.max(-4*mm/scale,Math.min(0,balanced)):balanced;
 if(pinnedFooter&&(headerBase+shift*scale<pageTop+margin||footerBase+shift*scale>pageBottom-margin))return {fits:false,shift:0};
 return {fits:true,shift};
}
