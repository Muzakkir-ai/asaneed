/** Gently balance the entire heading/body/footer group in unscaled print pixels. */
export function certificateBalance({pageTop,pageBottom,pageWidth,layoutWidth,headerTop,footerBottom,previousShift=0}:{pageTop:number;pageBottom:number;pageWidth:number;layoutWidth:number;headerTop:number;footerBottom:number;previousShift?:number}){
 const scale=pageWidth/layoutWidth;
 if(!Number.isFinite(scale)||scale<=0)return {fits:false,shift:0};
 const margin=pageWidth*12/297;
 const headerBase=headerTop-previousShift*scale,footerBase=footerBottom-previousShift*scale;
 if(footerBase-headerBase>pageBottom-pageTop-2*margin)return {fits:false,shift:0};
 const ideal=((pageTop+pageBottom)/2-(headerBase+footerBase)/2)/scale;
 const minimum=(pageTop+margin-headerBase)/scale,maximum=(pageBottom-margin-footerBase)/scale;
 return {fits:true,shift:Math.max(minimum,Math.min(maximum,ideal*0.72))};
}
