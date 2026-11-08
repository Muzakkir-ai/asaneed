/** Gently lower short certificate text without moving the pinned issuer footer.
 *
 * The computed translation is in unscaled layout CSS pixels, so the same
 * physical position is used in desktop, zoomed preview, and print/PDF.
 * We intentionally leave at least 12mm clear above the reserved footer zone.
 */
export function certificateBodyBalance({
 pageWidth,layoutWidth,bodyBottom,footerTop,previousShift=0,
}:{
 pageWidth:number;layoutWidth:number;bodyBottom:number;footerTop:number;
 previousShift?:number;
}):number{
 const scale=pageWidth/layoutWidth;
 const screenPxPerMm=pageWidth/297;
 if(!Number.isFinite(scale)||scale<=0||!Number.isFinite(screenPxPerMm)||screenPxPerMm<=0)return 0;
 // Remove the previous transform before measuring, preventing drift.
 const naturalBodyBottom=bodyBottom-previousShift*scale;
 const gapMm=(footerTop-naturalBodyBottom)/screenPxPerMm;
 if(!Number.isFinite(gapMm))return 0;
 // The existing screenshot has ~25-30mm of separation. Use about 8-10mm
 // of it for balance, while medium certificates move a little and long ones
 // never move. No adjustment changes the line-height or body text itself.
 const shiftMm=Math.max(0,Math.min(10,(gapMm-14)*0.75,gapMm-12));
 return shiftMm*layoutWidth/297;
}
