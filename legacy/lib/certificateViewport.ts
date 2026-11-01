export const PAPER_WIDTH=297*96/25.4,PAPER_HEIGHT=210*96/25.4;
export const clampCertificateZoom=(scale:number)=>Math.max(.15,Math.min(4,scale));
export function fitCertificate(width:number,height:number,page=false){return clampCertificateZoom(page?Math.min(Math.max(1,width-24)/PAPER_WIDTH,Math.max(1,height-24)/PAPER_HEIGHT):Math.max(1,width-24)/PAPER_WIDTH);}
export const zoomScroll=(scroll:number,anchor:number,before:number,after:number)=>(scroll+anchor)*after/before-anchor;
